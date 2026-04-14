import { useAppState } from "../state/AppStateProvider";

export default function ActivityPage() {
  const { state, clearHistory } = useAppState();

  return (
    <section className="page">
      <header className="page-header">
        <h2>Activity Log</h2>
        <p>Client-side history of actions and endpoint responses captured by the frontend.</p>
      </header>

      <article className="panel">
        <div className="row spread">
          <p>{state.history.length} entries saved locally.</p>
          <button className="btn ghost" onClick={clearHistory} disabled={state.history.length === 0}>
            Clear history
          </button>
        </div>

        {state.history.length > 0 ? (
          <div className="stack-list">
            {state.history.map((entry) => (
              <div className="stack-item" key={entry.id}>
                <p>
                  <strong>{entry.type}</strong> - {entry.summary}
                </p>
                <small>{new Date(entry.createdAt).toLocaleString()}</small>
              </div>
            ))}
          </div>
        ) : (
          <p>No activity yet.</p>
        )}
      </article>
    </section>
  );
}