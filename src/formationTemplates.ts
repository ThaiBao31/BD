import type { FormationId, SlotRole } from './types';

export interface SlotTemplate {
  role: SlotRole;
  label: string;
  x: number;
  y: number;
}

export interface FormationTemplate {
  id: FormationId;
  name: string;
  description: string;
  slots: SlotTemplate[];
}

const GK: SlotTemplate = { role: 'gk', label: 'Thủ môn', x: 50, y: 88 };

export const FORMATION_TEMPLATES: FormationTemplate[] = [
  {
    id: '1-2-3-1',
    name: '1-2-3-1',
    description: 'Phòng thủ',
    slots: [
      GK,
      { role: 'def', label: 'Hậu vệ', x: 50, y: 68 },
      { role: 'mid', label: 'Tiền vệ 1', x: 35, y: 52 },
      { role: 'mid', label: 'Tiền vệ 2', x: 65, y: 52 },
      { role: 'mid', label: 'Tiền vệ 3', x: 25, y: 34 },
      { role: 'mid', label: 'Tiền vệ 4', x: 75, y: 34 },
      { role: 'fwd', label: 'Tiền đạo', x: 50, y: 16 },
    ],
  },
  {
    id: '2-2-2',
    name: '2-2-2',
    description: 'Cân bằng',
    slots: [
      GK,
      { role: 'def', label: 'Hậu vệ 1', x: 35, y: 68 },
      { role: 'def', label: 'Hậu vệ 2', x: 65, y: 68 },
      { role: 'mid', label: 'Tiền vệ 1', x: 35, y: 44 },
      { role: 'mid', label: 'Tiền vệ 2', x: 65, y: 44 },
      { role: 'fwd', label: 'Tiền đạo 1', x: 35, y: 18 },
      { role: 'fwd', label: 'Tiền đạo 2', x: 65, y: 18 },
    ],
  },
  {
    id: '3-2-1',
    name: '3-2-1',
    description: 'Phòng ngự chắc',
    slots: [
      GK,
      { role: 'def', label: 'Hậu vệ 1', x: 25, y: 68 },
      { role: 'def', label: 'Hậu vệ 2', x: 50, y: 68 },
      { role: 'def', label: 'Hậu vệ 3', x: 75, y: 68 },
      { role: 'mid', label: 'Tiền vệ 1', x: 35, y: 44 },
      { role: 'mid', label: 'Tiền vệ 2', x: 65, y: 44 },
      { role: 'fwd', label: 'Tiền đạo', x: 50, y: 18 },
    ],
  },
  {
    id: '2-3-1',
    name: '2-3-1',
    description: 'Kiểm soát giữa sân',
    slots: [
      GK,
      { role: 'def', label: 'Hậu vệ 1', x: 35, y: 68 },
      { role: 'def', label: 'Hậu vệ 2', x: 65, y: 68 },
      { role: 'mid', label: 'Tiền vệ 1', x: 25, y: 46 },
      { role: 'mid', label: 'Tiền vệ 2', x: 50, y: 46 },
      { role: 'mid', label: 'Tiền vệ 3', x: 75, y: 46 },
      { role: 'fwd', label: 'Tiền đạo', x: 50, y: 18 },
    ],
  },
  {
    id: '3-1-2',
    name: '3-1-2',
    description: 'Wing play',
    slots: [
      GK,
      { role: 'def', label: 'Hậu vệ 1', x: 25, y: 68 },
      { role: 'def', label: 'Hậu vệ 2', x: 50, y: 68 },
      { role: 'def', label: 'Hậu vệ 3', x: 75, y: 68 },
      { role: 'mid', label: 'Tiền vệ', x: 50, y: 44 },
      { role: 'fwd', label: 'Tiền đạo 1', x: 35, y: 18 },
      { role: 'fwd', label: 'Tiền đạo 2', x: 65, y: 18 },
    ],
  },
  {
    id: '1-3-2',
    name: '1-3-2',
    description: 'Tấn công',
    slots: [
      GK,
      { role: 'def', label: 'Hậu vệ', x: 50, y: 68 },
      { role: 'mid', label: 'Tiền vệ 1', x: 25, y: 46 },
      { role: 'mid', label: 'Tiền vệ 2', x: 50, y: 46 },
      { role: 'mid', label: 'Tiền vệ 3', x: 75, y: 46 },
      { role: 'fwd', label: 'Tiền đạo 1', x: 35, y: 18 },
      { role: 'fwd', label: 'Tiền đạo 2', x: 65, y: 18 },
    ],
  },
];

export function getFormationTemplate(id: FormationId): FormationTemplate {
  return FORMATION_TEMPLATES.find((f) => f.id === id) ?? FORMATION_TEMPLATES[0];
}

export function remapAssignments(
  oldAssignments: (string | null)[],
  _newFormationId: FormationId,
): (string | null)[] {
  const gkPlayer = oldAssignments[0] ?? null;
  const outfield = oldAssignments.slice(1).filter((id): id is string => id !== null);
  const newAssignments: (string | null)[] = new Array(7).fill(null);
  newAssignments[0] = gkPlayer;

  let outfieldIdx = 0;
  for (let i = 1; i < 7; i++) {
    if (outfieldIdx < outfield.length) {
      newAssignments[i] = outfield[outfieldIdx++];
    }
  }

  return newAssignments;
}
