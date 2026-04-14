import { Link } from "react-router-dom";

export default function HomePage() {
    return (
        <section className="page home-page">
            <header className="page-header home-hero reveal">
                <p className="eyebrow">Creator Workflow Hub</p>
                <h2>AI-Assisted YouTube Comment Reply System</h2>
                <p>
                    Turn raw YouTube comments into consistent, context-aware response drafts with a clean,
                    creator-friendly workflow.
                </p>

                <div className="row">
                    <Link className="btn ghost" to="/overview">
                        Open Overview
                    </Link>
                    <Link className="btn ghost" to="/sync">
                        Start Sync
                    </Link>
                    <Link className="btn ghost" to="/activity">
                        View Activity
                    </Link>
                </div>
            </header>

            <div className="stats-grid home-stats">
                <article className="stat-card">
                    <div className="stat-top">
                        <p>What It Solves</p>
                    </div>
                    <h3>Reply Overload</h3>
                    <p className="helper-text">Handle large comment volume without losing your response quality.</p>
                </article>

                <article className="stat-card">
                    <div className="stat-top">
                        <p>What It Offers</p>
                    </div>
                    <h3>AI Draft Replies</h3>
                    <p className="helper-text">Generate contextual replies from synced transcripts and comments.</p>
                </article>

                <article className="stat-card">
                    <div className="stat-top">
                        <p>Why Creators Use It</p>
                    </div>
                    <h3>Consistency + Speed</h3>
                    <p className="helper-text">Keep tone aligned while reducing manual effort across videos.</p>
                </article>
            </div>

            <section className="home-workflow reveal" aria-label="How this system works">
                <header className="home-workflow-header">
                    <p className="home-quick-eyebrow">How It Works</p>
                    <h3>From Raw YouTube Comments to Personalized Replies</h3>
                    <p>
                        The system follows a clear backend pipeline so creators can understand exactly how replies are
                        produced.
                    </p>
                </header>

                <div className="home-workflow-grid">
                    <article className="home-workflow-step">
                        <span className="home-workflow-index">01</span>
                        <h4>Load Raw Comments from YouTube</h4>
                        <p>
                            Sync pulls videos, transcripts, and fresh comment threads from your connected channel.
                        </p>
                    </article>

                    <article className="home-workflow-step">
                        <span className="home-workflow-index">02</span>
                        <h4>Pass Through ML Labeling Pipeline</h4>
                        <p>
                            Comments are sent to the ML intent classifier to label tone and intent before generation.
                        </p>
                    </article>

                    <article className="home-workflow-step">
                        <span className="home-workflow-index">03</span>
                        <h4>Run RAG Reply Generation</h4>
                        <p>
                            Labeled comments are enriched with context and processed in the RAG pipeline for personalized
                            draft replies.
                        </p>
                    </article>

                    <article className="home-workflow-step">
                        <span className="home-workflow-index">04</span>
                        <h4>Review Through Overview and Activity</h4>
                        <p>
                            Final workflow visibility is provided through Overview, Sync, and Activity execution pages.
                        </p>
                    </article>
                </div>
            </section>

            <section className="home-quick-grid" aria-label="Quick entry points">
                <Link className="home-quick-card reveal" to="/overview">
                    <p className="home-quick-eyebrow">Overview</p>
                    <h3>Check Backend Health and OAuth</h3>
                    <p>Start with endpoint status, connectivity, and workflow readiness.</p>
                </Link>

                <Link className="home-quick-card reveal" to="/sync">
                    <p className="home-quick-eyebrow">Sync</p>
                    <h3>Ingest Channel Data</h3>
                    <p>Sync latest creator content and optionally trigger immediate reply generation.</p>
                </Link>

                <Link className="home-quick-card reveal" to="/activity">
                    <p className="home-quick-eyebrow">Activity</p>
                    <h3>Review Execution Timeline</h3>
                    <p>Inspect workflow outcomes and retry context from a single action history.</p>
                </Link>
            </section>
        </section>
    );
}