import { useRef } from 'react';
import type { SyncStatus } from '../sharedStorage';

interface SyncBarProps {
  status: SyncStatus;
  lastUpdated: string | null;
  message: string | null;
  onRefresh: () => void;
  onExport: () => void;
  onImport: (file: File) => void;
}

function formatTime(iso: string | null): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('vi-VN');
  } catch {
    return iso;
  }
}

export default function SyncBar({
  status,
  lastUpdated,
  message,
  onRefresh,
  onExport,
  onImport,
}: SyncBarProps) {
  const fileRef = useRef<HTMLInputElement>(null);

  let statusLabel = 'Đã đồng bộ';
  let statusClass = 'sync-status-ok';

  if (status === 'loading') {
    statusLabel = 'Đang tải...';
    statusClass = 'sync-status-loading';
  } else if (status === 'saving') {
    statusLabel = 'Đang lưu...';
    statusClass = 'sync-status-loading';
  } else if (status === 'error') {
    statusLabel = 'Lỗi đồng bộ';
    statusClass = 'sync-status-error';
  } else if (status === 'readonly') {
    statusLabel = 'Chỉ đọc';
    statusClass = 'sync-status-warning';
  }

  return (
    <div className="sync-bar">
      <div className="sync-bar-info">
        <span className={`sync-status ${statusClass}`}>{statusLabel}</span>
        <span className="sync-meta">Cập nhật: {formatTime(lastUpdated)}</span>
        {message && <span className="sync-message">{message}</span>}
      </div>

      <div className="sync-bar-actions">
        <button type="button" className="btn btn-sm" onClick={onRefresh} disabled={status === 'loading'}>
          Tải lại
        </button>
        <button type="button" className="btn btn-sm" onClick={onExport}>
          Xuất JSON
        </button>
        <button type="button" className="btn btn-sm" onClick={() => fileRef.current?.click()}>
          Nhập JSON
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          hidden
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onImport(file);
            e.target.value = '';
          }}
        />
      </div>
    </div>
  );
}
