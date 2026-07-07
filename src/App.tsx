import { useCallback, useEffect, useState } from 'react';
import FormationBoard from './components/FormationBoard';
import PlayerForm from './components/PlayerForm';
import PlayerList from './components/PlayerList';
import { remapAssignments } from './formationTemplates';
import { loadMatchSetup, loadPlayers, saveMatchSetup, savePlayers } from './storage';
import type { FormationId, MatchSetup, Player, PlayerFormData, TeamSide } from './types';
import { removePlayerFromSetup } from './utils/teamStats';

type AppTab = 'roster' | 'formation';

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
  const [matchSetup, setMatchSetup] = useState<MatchSetup>(() => loadMatchSetup());
  const [editing, setEditing] = useState<Player | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState<AppTab>('roster');

  useEffect(() => {
    setPlayers(loadPlayers());
    setMatchSetup(loadMatchSetup());
  }, []);

  const persistPlayers = useCallback((next: Player[]) => {
    setPlayers(next);
    savePlayers(next);
  }, []);

  const persistMatchSetup = useCallback((next: MatchSetup) => {
    setMatchSetup(next);
    saveMatchSetup(next);
  }, []);

  function handleAdd(data: PlayerFormData) {
    const now = new Date().toISOString();
    const player: Player = {
      ...data,
      id: generateId(),
      createdAt: now,
      updatedAt: now,
    };
    persistPlayers([...players, player]);
    setShowForm(false);
  }

  function handleUpdate(data: PlayerFormData) {
    if (!editing) return;
    const now = new Date().toISOString();
    persistPlayers(
      players.map((p) =>
        p.id === editing.id ? { ...p, ...data, updatedAt: now } : p,
      ),
    );
    setEditing(null);
    setShowForm(false);
  }

  function handleDelete(id: string) {
    persistPlayers(players.filter((p) => p.id !== id));
    persistMatchSetup({
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
    });
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
    persistMatchSetup(next);
  }

  function handleClearSlot(side: TeamSide, slotIndex: number) {
    const next = updateTeam(matchSetup, side, (team) => {
      const assignments = [...team.assignments];
      assignments[slotIndex] = null;
      return { ...team, assignments };
    });
    persistMatchSetup(next);
  }

  function handleFormationChange(side: TeamSide, formationId: FormationId) {
    const next = updateTeam(matchSetup, side, (team) => ({
      formationId,
      assignments: remapAssignments(team.assignments, formationId),
    }));
    persistMatchSetup(next);
  }

  const formOpen = showForm || editing !== null;

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
