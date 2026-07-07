import { useCallback, useEffect, useRef, useState } from 'react';
import FormationBoard from './components/FormationBoard';
import PlayerForm from './components/PlayerForm';
import PlayerList from './components/PlayerList';
import SyncBar from './components/SyncBar';
import { remapAssignments } from './formationTemplates';
import {
  cacheSharedData,
  createSharedData,
  exportSharedJson,
  fetchSharedData,
  importSharedJson,
  saveSharedData,
  type SyncStatus,
} from './sharedStorage';
import { createDefaultMatchSetup } from './storage';
import type { FormationId, MatchSetup, Player, PlayerFormData, TeamSide } from './types';
import { removePlayerFromSetup } from './utils/teamStats';

type AppTab = 'roster' | 'formation';

const POLL_MS = 20_000;
const SAVE_DEBOUNCE_MS = 800;

function generateId(): string {
  return crypto.randomUUID();
}

function updateTeam(
  setup: MatchSetup,
  side: TeamSide,
  updater: (team: MatchSetup['teamA']) => MatchSetup['teamA'],
): MatchSetup {
  return {
    ...setup,
    [side]: updater(side === 'teamA' ? setup.teamA : setup.teamB),
    updatedAt: new Date().toISOString(),
  };
}

export default function App() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [matchSetup, setMatchSetup] = useState<MatchSetup>(createDefaultMatchSetup);
  const [editing, setEditing] = useState<Player | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState<AppTab>('roster');
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('loading');
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  const playersRef = useRef(players);
  const matchSetupRef = useRef(matchSetup);
  const lastRemoteUpdatedRef = useRef<string | null>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isSavingRef = useRef(false);

  playersRef.current = players;
  matchSetupRef.current = matchSetup;

  const applyRemoteData = useCallback((data: { players: Player[]; matchSetup: MatchSetup; updatedAt: string }) => {
    setPlayers(data.players);
    setMatchSetup(data.matchSetup);
    setLastUpdated(data.updatedAt);
    lastRemoteUpdatedRef.current = data.updatedAt;
    cacheSharedData({ version: 1, ...data });
  }, []);

  const loadShared = useCallback(async (silent = false) => {
    if (!silent) setSyncStatus('loading');
    try {
      const data = await fetchSharedData();
      applyRemoteData(data);
      if (!silent) {
        setSyncStatus('saved');
        setSyncMessage('Đã tải dữ liệu chung');
      }
    } catch {
      if (!silent) {
        setSyncStatus('error');
        setSyncMessage('Không thể tải dữ liệu chung');
      }
    }
  }, [applyRemoteData]);

  const flushSave = useCallback(async () => {
    if (isSavingRef.current) return;
    isSavingRef.current = true;
    setSyncStatus('saving');

    const payload = createSharedData(playersRef.current, matchSetupRef.current);
    const result = await saveSharedData(payload);

    if (result.ok) {
      setLastUpdated(payload.updatedAt);
      lastRemoteUpdatedRef.current = payload.updatedAt;
      setSyncStatus('saved');
      setSyncMessage('Đã lưu dữ liệu chung');
    } else if (result.readonly) {
      cacheSharedData(payload);
      setSyncStatus('readonly');
      setSyncMessage(result.error ?? 'Chế độ chỉ đọc — dùng Xuất JSON để chia sẻ');
    } else {
      cacheSharedData(payload);
      setSyncStatus('error');
      setSyncMessage(result.error ?? 'Lỗi lưu dữ liệu chung');
    }

    isSavingRef.current = false;
  }, []);

  const scheduleSave = useCallback(() => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      void flushSave();
    }, SAVE_DEBOUNCE_MS);
  }, [flushSave]);

  const persistAll = useCallback(
    (nextPlayers: Player[], nextMatchSetup: MatchSetup) => {
      setPlayers(nextPlayers);
      setMatchSetup(nextMatchSetup);
      playersRef.current = nextPlayers;
      matchSetupRef.current = nextMatchSetup;
      cacheSharedData(createSharedData(nextPlayers, nextMatchSetup));
      scheduleSave();
    },
    [scheduleSave],
  );

  useEffect(() => {
    void loadShared().finally(() => setReady(true));
  }, [loadShared]);

  useEffect(() => {
    if (!ready) return;

    const poll = async () => {
      if (document.hidden || isSavingRef.current) return;
      try {
        const data = await fetchSharedData();
        if (
          lastRemoteUpdatedRef.current &&
          data.updatedAt > lastRemoteUpdatedRef.current
        ) {
          applyRemoteData(data);
          setSyncMessage('Có cập nhật mới từ thành viên khác');
          setSyncStatus('saved');
        }
      } catch {
        /* ignore poll errors */
      }
    };

    const interval = setInterval(() => void poll(), POLL_MS);
    return () => clearInterval(interval);
  }, [ready, applyRemoteData]);

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, []);

  function handleAdd(data: PlayerFormData) {
    const now = new Date().toISOString();
    const player: Player = {
      ...data,
      id: generateId(),
      createdAt: now,
      updatedAt: now,
    };
    persistAll([...players, player], matchSetup);
    setShowForm(false);
  }

  function handleUpdate(data: PlayerFormData) {
    if (!editing) return;
    const now = new Date().toISOString();
    persistAll(
      players.map((p) =>
        p.id === editing.id ? { ...p, ...data, updatedAt: now } : p,
      ),
      matchSetup,
    );
    setEditing(null);
    setShowForm(false);
  }

  function handleDelete(id: string) {
    persistAll(
      players.filter((p) => p.id !== id),
      {
        ...matchSetup,
        teamA: {
          ...matchSetup.teamA,
          assignments: removePlayerFromSetup(matchSetup.teamA.assignments, id),
        },
        teamB: {
          ...matchSetup.teamB,
          assignments: removePlayerFromSetup(matchSetup.teamB.assignments, id),
        },
        updatedAt: new Date().toISOString(),
      },
    );
  }

  function handleAssign(side: TeamSide, slotIndex: number, playerId: string) {
    let next = updateTeam(matchSetup, 'teamA', (team) => ({
      ...team,
      assignments: removePlayerFromSetup(team.assignments, playerId),
    }));
    next = updateTeam(next, 'teamB', (team) => ({
      ...team,
      assignments: removePlayerFromSetup(team.assignments, playerId),
    }));
    next = updateTeam(next, side, (team) => {
      const assignments = [...team.assignments];
      assignments[slotIndex] = playerId;
      return { ...team, assignments };
    });
    persistAll(players, next);
  }

  function handleClearSlot(side: TeamSide, slotIndex: number) {
    const next = updateTeam(matchSetup, side, (team) => {
      const assignments = [...team.assignments];
      assignments[slotIndex] = null;
      return { ...team, assignments };
    });
    persistAll(players, next);
  }

  function handleFormationChange(side: TeamSide, formationId: FormationId) {
    const next = updateTeam(matchSetup, side, (team) => ({
      formationId,
      assignments: remapAssignments(team.assignments, formationId),
    }));
    persistAll(players, next);
  }

  async function handleImport(file: File) {
    try {
      const data = await importSharedJson(file);
      applyRemoteData(data);
      await flushSave();
      setSyncMessage('Đã nhập dữ liệu từ file JSON');
    } catch (err) {
      setSyncStatus('error');
      setSyncMessage(err instanceof Error ? err.message : 'Không thể nhập file');
    }
  }

  const formOpen = showForm || editing !== null;

  if (!ready) {
    return (
      <div className="app app-loading">
        <p>Đang tải dữ liệu chung...</p>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-brand">
          <span className="logo">⚽</span>
          <div>
            <h1>BD Football</h1>
            <p>Đội hình kiểu FIFA Online</p>
          </div>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => {
            setEditing(null);
            setShowForm(true);
          }}
        >
          + Thêm cầu thủ
        </button>
      </header>

      <SyncBar
        status={syncStatus}
        lastUpdated={lastUpdated}
        message={syncMessage}
        onRefresh={() => void loadShared()}
        onExport={() => exportSharedJson(createSharedData(players, matchSetup))}
        onImport={(file) => void handleImport(file)}
      />

      <nav className="app-tabs">
        <button
          type="button"
          className={`app-tab${activeTab === 'roster' ? ' active' : ''}`}
          onClick={() => setActiveTab('roster')}
        >
          Danh sách cầu thủ
        </button>
        <button
          type="button"
          className={`app-tab${activeTab === 'formation' ? ' active' : ''}`}
          onClick={() => setActiveTab('formation')}
        >
          Sơ đồ 7v7
        </button>
      </nav>

      <main className="app-main">
        {formOpen && (
          <div className="modal-overlay" onClick={() => { setShowForm(false); setEditing(null); }}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <PlayerForm
                initial={editing ?? undefined}
                onSubmit={editing ? handleUpdate : handleAdd}
                onCancel={() => { setShowForm(false); setEditing(null); }}
              />
            </div>
          </div>
        )}

        {activeTab === 'roster' ? (
          <PlayerList
            players={players}
            onEdit={(p) => { setEditing(p); setShowForm(false); }}
            onDelete={handleDelete}
          />
        ) : (
          <FormationBoard
            players={players}
            matchSetup={matchSetup}
            onAssign={handleAssign}
            onClear={handleClearSlot}
            onFormationChange={handleFormationChange}
          />
        )}
      </main>
    </div>
  );
}
