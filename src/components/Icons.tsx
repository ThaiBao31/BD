import type { ReactNode } from 'react';

interface IconProps {
  className?: string;
}

export function SkillIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M12 3l1.8 5.5H19l-4.6 3.3 1.8 5.5L12 14l-4.2 3.3 1.8-5.5L5 8.5h5.2z" />
    </svg>
  );
}

export function PreferredFootIcon({ className, foot }: IconProps & { foot: 'L' | 'R' }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
      style={foot === 'L' ? { transform: 'scaleX(-1)' } : undefined}
    >
      <path d="M14 2c-1.5 0-2.8.8-3.5 2C9.8 2.8 8.5 2 7 2 4.8 2 3 3.8 3 6c0 1.2.5 2.3 1.3 3.1L2 22h4l1.5-8c.3-1.5 1.6-2.6 3.2-2.6.9 0 1.7.4 2.3 1l.5.5.5-.5c.6-.6 1.4-1 2.3-1 1.6 0 2.9 1.1 3.2 2.6L20 22h4l-4.3-12.9C20.5 8.3 21 7.2 21 6c0-2.2-1.8-4-4-4z" />
    </svg>
  );
}

interface StarRatingProps {
  value: number;
  label: string;
  icon: ReactNode;
}

export function StarRating({ value, label, icon }: StarRatingProps) {
  return (
    <div className="star-rating">
      <div className="star-rating-icon">{icon}</div>
      <div className="star-rating-content">
        <span className="star-rating-label">{label}</span>
        <div className="star-rating-row">
          <div className="star-rating-stars" aria-label={`${label}: ${value} trên 5`}>
            {[1, 2, 3, 4, 5].map((n) => (
              <span key={n} className={`star ${n <= value ? 'filled' : ''}`}>
                ★
              </span>
            ))}
          </div>
          <span className="star-rating-value">{value}/5</span>
        </div>
      </div>
    </div>
  );
}
