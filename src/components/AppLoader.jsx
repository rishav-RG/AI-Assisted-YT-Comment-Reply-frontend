export default function AppLoader() {
  return (
    <div className="app-loading">
      <div className="app-loading-card" role="status" aria-live="polite">
        <div className="app-loading-ring" aria-hidden="true" />
        <div>
          <p className="app-loading-eyebrow">Initializing</p>
          <h2 className="app-loading-title">Loading AI YouTube Comment Reply Engine</h2>
        </div>
      </div>
    </div>
  );
}