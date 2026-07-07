import { getFormationTemplate } from '../formationTemplates';
import type { FormationId, Player } from '../types';
import FormationSlot from './FormationSlot';

interface HalfPitchProps {
  teamLabel: string;
  formationId: FormationId;
  assignments: (string | null)[];
  players: Player[];
  teamOvr: number;
  assignedCount: number;
  onSlotClick: (slotIndex: number) => void;
  onSlotClear: (slotIndex: number) => void;
}

export default function HalfPitch({
  teamLabel,
  formationId,
  assignments,
  players,
  teamOvr,
  assignedCount,
  onSlotClick,
  onSlotClear,
}: HalfPitchProps) {
  const template = getFormationTemplate(formationId);
  const playerMap = new Map(players.map((p) => [p.id, p]));
  const isComplete = assignedCount === 7;

  return (
    <div className="half-pitch-wrap">
      <div className="half-pitch">
        <div className="pitch-team-stats">
          <span className={`pitch-ovr-badge${isComplete ? ' complete' : ''}`}>
            OVR {teamOvr}
          </span>
          <span className={`pitch-count-badge${isComplete ? ' complete' : ''}`}>
            {assignedCount}/7
          </span>
        </div>

        <div className="pitch-markings">
          <div className="pitch-center-line" />
          <div className="pitch-center-circle" />
          <div className="pitch-penalty-area" />
          <div className="pitch-goal-area" />
        </div>

        {template.slots.map((slot, index) => (
          <FormationSlot
            key={`${formationId}-${index}`}
            slot={slot}
            player={assignments[index] ? playerMap.get(assignments[index]!) ?? null : null}
            onSelect={() => onSlotClick(index)}
            onClear={() => onSlotClear(index)}
          />
        ))}
      </div>
      <span className="half-pitch-label">{teamLabel}</span>
    </div>
  );
}
