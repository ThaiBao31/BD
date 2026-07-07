import type { SlotTemplate } from '../formationTemplates';
import type { Player } from '../types';
import { overallRating } from '../types';

interface FormationSlotProps {
  slot: SlotTemplate;
  player: Player | null;
  onSelect: () => void;
  onClear: () => void;
}

export default function FormationSlot({ slot, player, onSelect, onClear }: FormationSlotProps) {
  const isGk = slot.role === 'gk';

  return (
    <button
      type="button"
      className={`formation-slot${isGk ? ' gk' : ''}${player ? ' filled' : ''}`}
      style={{ left: `${slot.x}%`, top: `${slot.y}%` }}
      onClick={onSelect}
      title={player ? player.name : slot.label}
    >
      {player ? (
        <>
          <div className="slot-photo-wrap">
            {player.photo ? (
              <img className="slot-avatar" src={player.photo} alt="" />
            ) : (
              <span className="slot-avatar-fallback">{player.name.charAt(0).toUpperCase()}</span>
            )}
            <span className="slot-ovr-badge">{overallRating(player.stats)}</span>
          </div>
          <span className="slot-name-plate">{player.name}</span>
          <span
            className="slot-clear"
            role="button"
            tabIndex={-1}
            onClick={(e) => {
              e.stopPropagation();
              onClear();
            }}
            aria-label="Gỡ cầu thủ"
          >
            ×
          </span>
        </>
      ) : (
        <>
          <span className="slot-empty-icon">+</span>
          <span className="slot-label">{slot.label}</span>
        </>
      )}
    </button>
  );
}
