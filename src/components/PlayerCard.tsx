import type { Player } from '../types';
import { STAT_LABELS, overallRating } from '../types';
import { PreferredFootIcon, SkillIcon, StarRating } from './Icons';

interface PlayerCardProps {
  player: Player;
  onEdit: (player: Player) => void;
  onDelete: (id: string) => void;
}

const STAT_KEYS = Object.keys(STAT_LABELS) as (keyof typeof STAT_LABELS)[];

export default function PlayerCard({ player, onEdit, onDelete }: PlayerCardProps) {
  const ovr = overallRating(player.stats);

  return (
    <article className="fifa-card">
      <div className="fifa-card-inner">
        <div className="fifa-card-shine" />

        <div className="fifa-card-top">
          <div className="fifa-ovr-block">
            <span className="fifa-ovr">{ovr}</span>
          </div>

          <div className="fifa-photo">
            {player.photo ? (
              <img src={player.photo} alt={player.name} />
            ) : (
              <div className="fifa-photo-fallback">{player.name.charAt(0).toUpperCase()}</div>
            )}
          </div>
        </div>

        <h3 className="fifa-name">{player.name}</h3>

        <div className="fifa-stats">
          {STAT_KEYS.map((key) => (
            <div key={key} className="fifa-stat">
              <span className="fifa-stat-val">{player.stats[key]}</span>
              <span className="fifa-stat-label">{STAT_LABELS[key].full}</span>
            </div>
          ))}
        </div>

        <div className="fifa-meta">
          <StarRating
            label="Chân trái"
            value={player.leftFoot}
            icon={<PreferredFootIcon className="meta-icon" foot="L" />}
          />
          <StarRating
            label="Chân phải"
            value={player.rightFoot}
            icon={<PreferredFootIcon className="meta-icon" foot="R" />}
          />
          <StarRating
            label="Kỹ năng"
            value={player.skillMoves}
            icon={<SkillIcon className="meta-icon" />}
          />
        </div>
      </div>

      <div className="card-actions">
        <button className="btn btn-sm" onClick={() => onEdit(player)}>
          Sửa
        </button>
        <button
          className="btn btn-sm btn-danger"
          onClick={() => {
            if (confirm(`Xóa ${player.name}?`)) onDelete(player.id);
          }}
        >
          Xóa
        </button>
      </div>
    </article>
  );
}
