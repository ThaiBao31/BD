import { useMemo, useState } from 'react';
import { FORMATION_TEMPLATES, getFormationTemplate } from '../formationTemplates';
import type { FormationId, MatchSetup, Player, TeamSide } from '../types';
import { countAssigned, getAllAssignedIds, totalTeamOvr } from '../utils/teamStats';
import HalfPitch from './HalfPitch';
import SlotPicker from './SlotPicker';
import TeamBalanceAlert from './TeamBalanceAlert';

interface FormationBoardProps {
  players: Player[];
  matchSetup: MatchSetup;
  onAssign: (side: TeamSide, slotIndex: number, playerId: string) => void;
  onClear: (side: TeamSide, slotIndex: number) => void;
  onFormationChange: (side: TeamSide, formationId: FormationId) => void;
}

interface PickerState {
  side: TeamSide;
  slotIndex: number;
}

export default function FormationBoard({
  players,
  matchSetup,
  onAssign,
  onClear,
  onFormationChange,
}: FormationBoardProps) {
  const [picker, setPicker] = useState<PickerState | null>(null);

  const assignedIds = useMemo(
    () => getAllAssignedIds(matchSetup.teamA.assignments, matchSetup.teamB.assignments),
    [matchSetup],
  );

  const ovrA = totalTeamOvr(players, matchSetup.teamA.assignments);
  const ovrB = totalTeamOvr(players, matchSetup.teamB.assignments);
  const assignedA = countAssigned(matchSetup.teamA.assignments);
  const assignedB = countAssigned(matchSetup.teamB.assignments);

  function openPicker(side: TeamSide, slotIndex: number) {
    setPicker({ side, slotIndex });
  }

  function getTeamSetup(side: TeamSide) {
    return side === 'teamA' ? matchSetup.teamA : matchSetup.teamB;
  }

  const pickerSetup = picker ? getTeamSetup(picker.side) : null;
  const pickerTemplate = pickerSetup
    ? getFormationTemplate(pickerSetup.formationId)
    : null;

  return (
    <section className="formation-board-section">
      <div className="formation-board">
        <div className="formation-team-panel">
          <div className="formation-team-header">
            <h2>Đội A</h2>
            <span className="formation-count">{assignedA}/7 cầu thủ</span>
          </div>
          <select
            className="formation-select"
            value={matchSetup.teamA.formationId}
            onChange={(e) => onFormationChange('teamA', e.target.value as FormationId)}
          >
            {FORMATION_TEMPLATES.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name} — {f.description}
              </option>
            ))}
          </select>
          <HalfPitch
            teamLabel="Đội A"
            formationId={matchSetup.teamA.formationId}
            assignments={matchSetup.teamA.assignments}
            players={players}
            teamOvr={ovrA}
            assignedCount={assignedA}
            onSlotClick={(index) => openPicker('teamA', index)}
            onSlotClear={(index) => onClear('teamA', index)}
          />
        </div>

        <div className="formation-team-panel">
          <div className="formation-team-header">
            <h2>Đội B</h2>
            <span className="formation-count">{assignedB}/7 cầu thủ</span>
          </div>
          <select
            className="formation-select"
            value={matchSetup.teamB.formationId}
            onChange={(e) => onFormationChange('teamB', e.target.value as FormationId)}
          >
            {FORMATION_TEMPLATES.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name} — {f.description}
              </option>
            ))}
          </select>
          <HalfPitch
            teamLabel="Đội B"
            formationId={matchSetup.teamB.formationId}
            assignments={matchSetup.teamB.assignments}
            players={players}
            teamOvr={ovrB}
            assignedCount={assignedB}
            onSlotClick={(index) => openPicker('teamB', index)}
            onSlotClear={(index) => onClear('teamB', index)}
          />
        </div>
      </div>

      <TeamBalanceAlert
        ovrA={ovrA}
        ovrB={ovrB}
        assignedA={assignedA}
        assignedB={assignedB}
      />

      {picker && pickerSetup && pickerTemplate && (
        <SlotPicker
          slotLabel={pickerTemplate.slots[picker.slotIndex].label}
          players={players}
          assignedIds={assignedIds}
          currentPlayerId={pickerSetup.assignments[picker.slotIndex]}
          onSelect={(playerId) => {
            onAssign(picker.side, picker.slotIndex, playerId);
            setPicker(null);
          }}
          onClose={() => setPicker(null)}
        />
      )}
    </section>
  );
}
