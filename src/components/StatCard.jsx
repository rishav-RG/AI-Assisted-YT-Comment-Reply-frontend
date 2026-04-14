import StatusPill from "./StatusPill";

export default function StatCard({ title, value, status = "idle", helper }) {
  return (
    <article className="stat-card">
      <div className="stat-top">
        <p>{title}</p>
        <StatusPill status={status} />
      </div>
      <h3>{value}</h3>
      {helper ? <p className="helper-text">{helper}</p> : null}
    </article>
  );
}