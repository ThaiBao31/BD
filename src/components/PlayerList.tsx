import { useMemo, useState } from 'react';
import type { Player } from '../types';
import { overallRating } from '../types';
import PlayerCard from './PlayerCard';

interface PlayerListProps {
  players: Player[];
  onEdit: (player: Player) => void;
  onDelete: (id: string) => void;
}

type SortKey = 'name' | 'ovr';

export default function PlayerList({ players, onEdit, onDelete }: PlayerListProps) {
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortKey>('ovr');

  const filtered = useMemo(() => {
    let list = [...players];

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(q));
    }

    list.sort((a, b) => {
      if (sort === 'name') return a.name.localeCompare(b.name, 'vi');
      return overallRating(b.stats) - overallRating(a.stats);
    });

    return list;
  }, [players, search, sort]);

  const avgOvr =
    players.length > 0
      ? Math.round(players.reduce((s, p) => s + overallRating(p.stats), 0) / players.length)
      : 0;

  return (
    <section className="player-list-section">
      <div className="summary-cards">
        <div className="summary-card">
          <span className="summary-value">{players.length}</span>
          <span className="summary-label">Cầu thủ</span>
        </div>
        <div className="summary-card highlight">
          <span className="summary-value">{avgOvr}</span>
          <span className="summary-label">OVR trung bình</span>
        </div>
      </div>

      <div className="filters">
        <input
          className="search-input"
          placeholder="Tìm tên cầu thủ..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)}>
          <option value="ovr">Sắp xếp: OVR cao nhất</option>
          <option value="name">Sắp xếp: Tên A-Z</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <p>Chưa có cầu thủ nào. Bấm "Thêm cầu thủ" để bắt đầu!</p>
        </div>
      ) : (
        <div className="player-grid">
          {filtered.map((player) => (
            <PlayerCard key={player.id} player={player} onEdit={onEdit} onDelete={onDelete} />
          ))}
        </div>
      )}
    </section>
  );
}
