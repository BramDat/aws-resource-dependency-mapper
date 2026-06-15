import { CheckCircle2, Circle, Loader2, XCircle } from 'lucide-react';

type Status = 'success' | 'danger' | 'checking' | 'neutral';

interface StatusPillProps {
  label: string;
  detail: string;
  status: Status;
}

export function StatusPill({ label, detail, status }: StatusPillProps): JSX.Element {
  const icon = {
    success: <CheckCircle2 size={18} />,
    danger: <XCircle size={18} />,
    checking: <Loader2 className="spin" size={18} />,
    neutral: <Circle size={18} />
  }[status];

  return (
    <div className={`status-pill status-${status}`}>
      {icon}
      <div>
        <span>{label}</span>
        <strong>{detail}</strong>
      </div>
    </div>
  );
}
