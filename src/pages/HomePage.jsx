import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { FaChevronDown, FaYoutube, FaMagic, FaRobot, FaClipboardCheck } from "react-icons/fa";

// Animation variants for Framer Motion
const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
        },
    },
};

const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
        y: 0,
        opacity: 1,
        transition: {
            type: "spring",
            stiffness: 100,
        },
    },
};

const workflowItemVariants = {
    hidden: (i) => ({
        x: i % 2 === 0 ? -30 : 30,
        opacity: 0,
    }),
    visible: {
        x: 0,
        opacity: 1,
        transition: {
            type: "spring",
            stiffness: 100,
            damping: 12,
        },
    },
};

const faqData = [
    {
        question: "How does the AI generate replies?",
        answer:
            "The system uses a Retrieval-Augmented Generation (RAG) model. It syncs video transcripts and existing comments to build a context-aware knowledge base, allowing it to generate relevant and personalized draft replies.",
    },
    {
        question: "Is my channel data secure?",
        answer:
            "Yes, security is a top priority. Your channel data is accessed via secure OAuth 2.0 protocols, and the application only requests the permissions necessary to read comments and post replies on your behalf.",
    },
    {
        question: "Can I edit the replies before posting?",
        answer:
            "Absolutely. The AI generates draft replies, which you can review, edit, and approve directly in the Video Detail workspace before posting them to YouTube. You always have the final say.",
    },
];

const workflowSteps = [
    {
        icon: <FaYoutube />,
        title: "Load Raw Comments from YouTube",
        description: "Sync pulls videos, transcripts, and fresh comment threads from your connected channel.",
    },
    {
        icon: <FaMagic />,
        title: "Pass Through ML Labeling Pipeline",
        description: "Comments are sent to the ML intent classifier to label tone and intent before generation.",
    },
    {
        icon: <FaRobot />,
        title: "Run RAG Reply Generation",
        description: "Labeled comments are enriched with context and processed in the RAG pipeline for personalized draft replies.",
    },
    {
        icon: <FaClipboardCheck />,
        title: "Review Through Overview and Activity",
        description: "Final workflow visibility is provided through the Overview workspace and Activity timeline.",
    },
];

function FaqItem({ question, answer }) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <motion.div className="faq-item" variants={itemVariants} layout>
            <motion.button
                className="faq-question"
                onClick={() => setIsOpen(!isOpen)}
                aria-expanded={isOpen}
            >
                <span>{question}</span>
                <motion.div animate={{ rotate: isOpen ? 180 : 0 }}>
                    <FaChevronDown />
                </motion.div>
            </motion.button>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        className="faq-answer"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                    >
                        <p>{answer}</p>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

export default function HomePage() {
    return (
        <motion.section
            className="page home-page"
            initial="hidden"
            animate="visible"
            variants={containerVariants}
        >
            <header className="page-header home-hero">
                <motion.p className="eyebrow" variants={itemVariants}>
                    Creator Workflow Hub
                </motion.p>
                <motion.h2 variants={itemVariants}>
                    AI-Assisted YouTube Comment Reply System
                </motion.h2>
                <motion.p variants={itemVariants}>
                    Turn raw YouTube comments into consistent, context-aware response
                    drafts with a clean, creator-friendly workflow.
                </motion.p>

                <motion.div className="row" variants={itemVariants}>
                    <Link className="btn" to="/overview">
                        Get Started
                    </Link>
                    <Link className="btn ghost" to="/activity">
                        View Activity
                    </Link>
                </motion.div>
            </header>

            <motion.div
                className="stats-grid home-stats"
                variants={containerVariants}
            >
                <motion.article className="stat-card" variants={itemVariants}>
                    <div className="stat-top">
                        <p>What It Solves</p>
                    </div>
                    <h3>Reply Overload</h3>
                    <p className="helper-text">
                        Handle large comment volume without losing your response quality.
                    </p>
                </motion.article>

                <motion.article className="stat-card" variants={itemVariants}>
                    <div className="stat-top">
                        <p>What It Offers</p>
                    </div>
                    <h3>AI Draft Replies</h3>
                    <p className="helper-text">
                        Generate contextual replies from synced transcripts and comments.
                    </p>
                </motion.article>

                <motion.article className="stat-card" variants={itemVariants}>
                    <div className="stat-top">
                        <p>Why Creators Use It</p>
                    </div>
                    <h3>Consistency + Speed</h3>
                    <p className="helper-text">
                        Keep tone aligned while reducing manual effort across videos.
                    </p>
                </motion.article>
            </motion.div>

            <motion.section
                className="home-workflow"
                aria-label="How this system works"
                variants={containerVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.2 }}
            >
                <header className="home-workflow-header">
                    <motion.p className="home-quick-eyebrow" variants={itemVariants}>
                        How It Works
                    </motion.p>
                    <motion.h3 variants={itemVariants}>
                        From Raw YouTube Comments to Personalized Replies
                    </motion.h3>
                    <motion.p variants={itemVariants}>
                        The system follows a clear backend pipeline so creators can
                        understand exactly how replies are produced.
                    </motion.p>
                </header>

                <div className="home-workflow-journey">
                    {workflowSteps.map((step, index) => (
                        <motion.article
                            key={index}
                            className="home-workflow-step"
                            custom={index}
                            variants={workflowItemVariants}
                        >
                            <div className="home-workflow-icon">{step.icon}</div>
                            <div className="home-workflow-content">
                                <h4>{step.title}</h4>
                                <p>{step.description}</p>
                            </div>
                        </motion.article>
                    ))}
                </div>
            </motion.section>

            <motion.section
                className="home-faq"
                aria-label="Frequently Asked Questions"
                variants={containerVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.5 }}
            >
                <header className="home-workflow-header">
                    <motion.h3 variants={itemVariants}>
                        Frequently Asked Questions
                    </motion.h3>
                </header>
                <div className="faq-list">
                    {faqData.map((faq, index) => (
                        <FaqItem key={index} question={faq.question} answer={faq.answer} />
                    ))}
                </div>
            </motion.section>

        </motion.section>
    );
}