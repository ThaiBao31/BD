import { getBalanceStatus } from '../utils/teamStats';

interface TeamBalanceAlertProps {
  ovrA: number;
  ovrB: number;
  assignedA: number;
  assignedB: number;
}

export default function TeamBalanceAlert({
  ovrA,
  ovrB,
  assignedA,
  assignedB,
}: TeamBalanceAlertProps) {
  const status = getBalanceStatus(ovrA, ovrB, assignedA, assignedB);

  let bannerClass = 'alert-banner alert-success';
  let message = 'Hai đội cân bằng (chênh lệch OVR ≤ 10)';

  if (!status.isComplete) {
    bannerClass = 'alert-banner alert-warning';
    message = `Chưa đủ 7 cầu thủ mỗi đội (Đội A: ${assignedA}/7 — Đội B: ${assignedB}/7)`;
  } else if (!status.isBalanced) {
    bannerClass = 'alert-banner alert-danger';
    const stronger = status.strongerSide === 'teamA' ? 'Đội A' : 'Đội B';
    message = `Chênh lệch OVR tổng: ${status.diff} (Đội A: ${ovrA} — Đội B: ${ovrB}). ${stronger} mạnh hơn.`;
  }

  return (
    <section className="team-balance-section">
      <div className="summary-cards">
        <div className="summary-card">
          <span className="summary-value">{ovrA}</span>
          <span className="summary-label">OVR tổng — Đội A</span>
          <span className="summary-sub">{assignedA}/7 cầu thủ</span>
        </div>
        <div className="summary-card highlight">
          <span className="summary-value">{status.diff}</span>
          <span className="summary-label">Chênh lệch OVR</span>
        </div>
        <div className="summary-card">
          <span className="summary-value">{ovrB}</span>
          <span className="summary-label">OVR tổng — Đội B</span>
          <span className="summary-sub">{assignedB}/7 cầu thủ</span>
        </div>
      </div>
      <div className={bannerClass}>{message}</div>
    </section>
  );
}
