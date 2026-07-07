import { useMemo, useState } from 'react';
import type { Player } from '../types';
import { overallRating } from '../types';

interface SlotPickerProps {
  slotLabel: string;
  players: Player[];
  assignedIds: Set<string>;
  currentPlayerId: string | null;
  onSelect: (playerId: string) => void;
  onClose: () => void;
}

export default function SlotPicker({
  slotLabel,
  players,
  assignedIds,
  currentPlayerId,
  onSelect,
  onClose,
}: SlotPickerProps) {
  const [search, setSearch] = useState('');

  const available = useMemo(() => {
    let list = players.filter(
      (p) => p.id === currentPlayerId || !assignedIds.has(p.id),
    );

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(q));
    }

    return list.sort((a, b) => overallRating(b.stats) - overallRating(a.stats));
  }, [players, assignedIds, currentPlayerId, search]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal slot-picker-modal" onClick={(e) => e.stopPropagation()}>
        <div className="slot-picker-header">
          <h2>Chọn cầu thủ — {slotLabel}</h2>
          <button type="button" className="btn btn-ghost slot-picker-close" onClick={onClose}>
            ×
          </button>
        </div>

        <input
          className="search-input"
          placeholder="Tìm tên cầu thủ..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          autoFocus
        />

        <div className="slot-picker-list">
          {available.length === 0 ? (
            <p className="slot-picker-empty">Không có cầu thủ khả dụng.</p>
          ) : (
            available.map((player) => (
              <button
                key={player.id}
                type="button"
                className={`slot-picker-item${player.id === currentPlayerId ? ' current' : ''}`}
                onClick={() => onSelect(player.id)}
              >
                {player.photo ? (
                  <img className="slot-picker-avatar" src={player.photo} alt="" />
                ) : (
                  <span className="slot-picker-avatar-fallback">
                    {player.name.charAt(0).toUpperCase()}
                  </span>
                )}
                <span className="slot-picker-name">{player.name}</span>
                <span className="slot-picker-ovr">{overallRating(player.stats)}</span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
