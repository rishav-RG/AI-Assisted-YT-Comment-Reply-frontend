const STATUS_CLASS_MAP = {
  ok: "is-ok",
  connected: "is-connected",
  running: "is-running",
  warning: "is-warning",
  error: "is-error",
  idle: "is-idle"
};

export default function StatusPill({ status = "idle", label }) {
  const className = STATUS_CLASS_MAP[status] || STATUS_CLASS_MAP.idle;
  return <span className={`status-pill ${className}`}>{label || status}</span>;
}