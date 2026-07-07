import { useCallback, useEffect, useState } from 'react';
import PlayerForm from './components/PlayerForm';
import PlayerList from './components/PlayerList';
import { loadPlayers, savePlayers } from './storage';
import type { Player, PlayerFormData } from './types';

function generateId(): string {
  return crypto.randomUUID();
}

export default function App() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [editing, setEditing] = useState<Player | null>(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    setPlayers(loadPlayers());
  }, []);

  const persist = useCallback((next: Player[]) => {
    setPlayers(next);
    savePlayers(next);
  }, []);

  function handleAdd(data: PlayerFormData) {
    const now = new Date().toISOString();
    const player: Player = {
      ...data,
      id: generateId(),
      createdAt: now,
      updatedAt: now,
    };
    persist([...players, player]);
    setShowForm(false);
  }

  function handleUpdate(data: PlayerFormData) {
    if (!editing) return;
    const now = new Date().toISOString();
    persist(
      players.map((p) =>
        p.id === editing.id ? { ...p, ...data, updatedAt: now } : p,
      ),
    );
    setEditing(null);
    setShowForm(false);
  }

  function handleDelete(id: string) {
    persist(players.filter((p) => p.id !== id));
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

        <PlayerList
          players={players}
          onEdit={(p) => { setEditing(p); setShowForm(false); }}
          onDelete={handleDelete}
        />
      </main>
    </div>
  );
}
