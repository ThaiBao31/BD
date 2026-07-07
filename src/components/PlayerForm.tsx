import { useRef, useState } from 'react';
import type { Player, PlayerFormData } from '../types';
import { STAT_LABELS, createEmptyPlayer, overallRating } from '../types';
import { PreferredFootIcon, SkillIcon } from './Icons';
import { readImageAsDataUrl } from '../utils/image';

interface PlayerFormProps {
  initial?: Player;
  onSubmit: (data: PlayerFormData) => void;
  onCancel: () => void;
}

const STAT_KEYS = Object.keys(STAT_LABELS) as (keyof typeof STAT_LABELS)[];

function FootPicker({
  label,
  foot,
  value,
  onChange,
}: {
  label: string;
  foot: 'L' | 'R';
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <div className="extra-picker">
      <div className="extra-picker-header">
        <PreferredFootIcon className="meta-icon" foot={foot} />
        <span>{label}</span>
      </div>
      <div className="star-picker">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            className={`star-btn ${value >= n ? 'active' : ''}`}
            onClick={() => onChange(n)}
            aria-label={`${n} sao`}
          >
            ★
          </button>
        ))}
        <span className="star-value">{value}/5</span>
      </div>
    </div>
  );
}

export default function PlayerForm({ initial, onSubmit, onCancel }: PlayerFormProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const defaults = initial ?? createEmptyPlayer();

  const [photo, setPhoto] = useState<string | undefined>(defaults.photo);
  const [stats, setStats] = useState(defaults.stats);
  const [leftFoot, setLeftFoot] = useState(defaults.leftFoot);
  const [rightFoot, setRightFoot] = useState(defaults.rightFoot);
  const [skillMoves, setSkillMoves] = useState(defaults.skillMoves);

  const ovr = overallRating(stats);

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setPhoto(await readImageAsDataUrl(file));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Lỗi tải ảnh');
    }
    e.target.value = '';
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const name = (new FormData(e.currentTarget).get('name') as string).trim();
    if (!name) return;

    onSubmit({ name, photo, stats, leftFoot, rightFoot, skillMoves });
  }

  function updateStat(key: keyof typeof stats, value: number) {
    setStats((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <form className="player-form" onSubmit={handleSubmit}>
      <div className="form-header">
        <h2>{initial ? 'Sửa cầu thủ' : 'Thêm cầu thủ'}</h2>
        <button type="button" className="btn btn-ghost" onClick={onCancel}>
          Đóng
        </button>
      </div>

      <div className="form-grid">
        <div className="photo-section">
          <div className="photo-upload" onClick={() => fileRef.current?.click()}>
            {photo ? (
              <img className="photo-preview" src={photo} alt="Preview" />
            ) : (
              <div className="photo-placeholder">
                <span>📷</span>
                <p>Chọn ảnh</p>
              </div>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={handlePhotoChange} />
          {photo && (
            <button type="button" className="btn btn-sm btn-ghost" onClick={() => setPhoto(undefined)}>
              Xóa ảnh
            </button>
          )}
        </div>

        <div className="form-fields">
          <label className="full-width">
            Tên cầu thủ *
            <input name="name" required defaultValue={defaults.name} placeholder="Nguyễn Văn A" />
          </label>
        </div>
      </div>

      <fieldset className="stats-fieldset">
        <legend>
          Chỉ số FIFA
          <span className="rating-badge">OVR {ovr}</span>
        </legend>
        <div className="stats-grid">
          {STAT_KEYS.map((key) => (
            <label key={key} className="stat-slider">
              <div className="stat-label">
                <span>{STAT_LABELS[key].full}</span>
                <output>{stats[key]}</output>
              </div>
              <input
                type="range"
                min={1}
                max={99}
                value={stats[key]}
                onChange={(e) => updateStat(key, Number(e.target.value))}
              />
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="stats-fieldset">
        <legend>Chỉ số chân & kỹ năng</legend>
        <div className="fifa-extras">
          <FootPicker label="Chân trái" foot="L" value={leftFoot} onChange={setLeftFoot} />
          <FootPicker label="Chân phải" foot="R" value={rightFoot} onChange={setRightFoot} />

          <div className="extra-picker extra-picker-full">
            <div className="extra-picker-header">
              <SkillIcon className="meta-icon" />
              <span>Kỹ năng</span>
            </div>
            <div className="star-picker">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  className={`star-btn ${skillMoves >= n ? 'active' : ''}`}
                  onClick={() => setSkillMoves(n)}
                  aria-label={`${n} sao`}
                >
                  ★
                </button>
              ))}
              <span className="star-value">{skillMoves}/5</span>
            </div>
          </div>
        </div>
      </fieldset>

      <div className="form-actions">
        <button type="button" className="btn btn-ghost" onClick={onCancel}>
          Hủy
        </button>
        <button type="submit" className="btn btn-primary">
          {initial ? 'Cập nhật' : 'Thêm cầu thủ'}
        </button>
      </div>
    </form>
  );
}
