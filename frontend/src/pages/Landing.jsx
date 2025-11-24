import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import TopNav from "../components/TopNav";

// Inline SVG icons adapted for React (use currentColor for theming)
const IconQuiz = (
  <svg viewBox="0 0 14 14" className="w-10 h-10 themed-icon" aria-hidden>
    <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
      <path d="M13.48 7.516a6.5 6.5 0 1 1-6.93-7" />
      <path d="M9.79 8.09A3 3 0 1 1 5.9 4.21M7 7l2.5-2.5m2 .5l-2-.5l-.5-2l2-2l.5 2l2 .5z" />
    </g>
  </svg>
);

const IconMemory = (
  <svg viewBox="0 0 48 48" className="w-10 h-10 themed-icon" aria-hidden>
    <g fill="none" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="4.667"
        d="M19.036 44c-.98-3.195-2.458-5.578-4.435-7.147c-2.965-2.353-7.676-.89-9.416-3.318c-1.74-2.428 1.219-6.892 2.257-9.526c1.039-2.634-3.98-3.565-3.394-4.313c.39-.499 2.927-1.937 7.609-4.316C12.987 7.794 17.9 4 26.398 4C39.144 4 44 14.806 44 21.68c0 6.872-5.88 14.276-14.256 15.873c-.749 1.09.331 3.24 3.24 6.447"
      />
      <path
        strokeLinejoin="round"
        strokeWidth="4"
        d="M19.5 14.5c-.654 2.534-.46 4.314.583 5.339c1.042 1.024 2.818 1.695 5.328 2.01c-.57 3.269.125 4.802 2.083 4.6c1.958-.201 3.135-1.015 3.53-2.44c3.06.86 4.719.14 4.976-2.16c.385-3.45-1.475-6.201-2.238-6.201c-.762 0-2.738-.093-2.738-1.148s-2.308-1.65-4.391-1.65s-.83-1.405-3.69-.85c-1.907.37-3.055 1.203-3.443 2.5Z"
        clipRule="evenodd"
      />
      <path strokeLinecap="round" strokeWidth="4" d="M30.5 25.5c-1.017.631-2.412 1.68-3 2.5c-1.469 2.05-2.66 3.298-2.92 4.608" />
    </g>
  </svg>
);

const IconStreaks = (
  <svg viewBox="0 0 24 24" className="w-10 h-10 themed-icon" aria-hidden>
    <path
      fill="currentColor"
      d="M5.09 10.121A5.251 5.251 0 0 1 1 5V3.75C1 2.784 1.784 2 2.75 2h2.364c.236-.586.81-1 1.48-1h10.812c.67 0 1.244.414 1.48 1h2.489c.966 0 1.75.784 1.75 1.75V5a5.252 5.252 0 0 1-4.219 5.149a7.01 7.01 0 0 1-4.644 5.478l.231 3.003a.5.5 0 0 0 .034.031c.079.065.303.203.836.282c.838.124 1.637.81 1.637 1.807v.75h2.25a.75.75 0 0 1 0 1.5H4.75a.75.75 0 0 1 0-1.5H7v-.75c0-.996.8-1.683 1.637-1.807c.533-.08.757-.217.836-.282a.5.5 0 0 0 .034-.031l.231-3.003A7.012 7.012 0 0 1 5.09 10.12ZM6.5 2.594V9a5.5 5.5 0 1 0 11 0V2.594a.094.094 0 0 0-.094-.094H6.594a.094.094 0 0 0-.094.094Zm4.717 13.363l-.215 2.793l-.001.021l-.003.043a1.212 1.212 0 0 1-.022.147c-.05.237-.194.567-.553.86c-.348.286-.853.5-1.566.605a.478.478 0 0 0-.274.136a.264.264 0 0 0-.083.188v.75h7v-.75a.264.264 0 0 0-.083-.188a.478.478 0 0 0-.274-.136c-.713-.105-1.218-.32-1.567-.604c-.358-.294-.502-.624-.552-.86a1.22 1.22 0 0 1-.025-.19l-.001-.022l-.215-2.793a7.069 7.069 0 0 1-1.566 0ZM19 8.578A3.751 3.751 0 0 0 21.625 5V3.75a.25.25 0 0 0-.25-.25H19ZM5 3.5H2.75a.25.25 0 0 0-.25.25V5A3.752 3.752 0 0 0 5 8.537Z"
    />
  </svg>
);

const IconSummarizer = (
  <svg viewBox="0 0 16 16" className="w-10 h-10 themed-icon" aria-hidden>
    <path
      fill="currentColor"
      d="M5 1a.5.5 0 0 1 .5.5V2h2v-.5a.5.5 0 0 1 1 0V2h2v-.5a.5.5 0 0 1 1 0V2A1.5 1.5 0 0 1 13 3.5v2.536a2.547 2.547 0 0 0-1 .406V3.5a.5.5 0 0 0-.5-.5h-7a.5.5 0 0 0-.5.5v10a.5.5 0 0 0 .5.5h1.547v.002a1.59 1.59 0 0 0 .068.998H4.5A1.5 1.5 0 0 1 3 13.5v-10A1.5 1.5 0 0 1 4.5 2v-.5A.5.5 0 0 1 5 1Zm5 7c.107 0 .206.034.288.091L9.378 9H6a.5.5 0 0 1 0-1h4Zm-3.004 3.435A.5.5 0 0 0 6.5 11H6a.5.5 0 0 0 0 1h.5a.498.498 0 0 0 .157-.025c.097-.189.21-.37.339-.54ZM6 5a.5.5 0 0 0 0 1h4a.5.5 0 0 0 0-1H6Zm6.338 2.455a1.56 1.56 0 0 1 2.207 2.207l-4.289 4.288a2.777 2.777 0 0 1-1.29.731l-1.211.303a.61.61 0 0 1-.74-.74l.304-1.21c.122-.489.374-.935.73-1.29l4.289-4.289Z"
    />
  </svg>
);

const IconFlashcards = (
  <svg viewBox="0 0 24 24" className="w-10 h-10 themed-icon" aria-hidden>
    <path
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="m3.604 7.197l7.138-3.109a.96.96 0 0 1 1.27.527l4.924 11.902a1 1 0 0 1-.514 1.304L9.285 20.93a.96.96 0 0 1-1.271-.527L3.09 8.5a1 1 0 0 1 .514-1.304zM15 4h1a1 1 0 0 1 1 1v3.5M20 6c.264.112.52.217.768.315a1 1 0 0 1 .53 1.311L19 13"
    />
  </svg>
);

const IconLibrary = (
  <svg viewBox="0 0 256 256" className="w-10 h-10 themed-icon" aria-hidden>
    <path
      fill="currentColor"
      d="m231.65 194.55l-33.19-157.8a16 16 0 0 0-19-12.39l-46.81 10.06a16.08 16.08 0 0 0-12.3 19l33.19 157.8A16 16 0 0 0 169.16 224a16.25 16.25 0 0 0 3.38-.36l46.81-10.06a16.09 16.09 0 0 0 12.3-19.03ZM136 50.15v-.09l46.8-10l3.33 15.87L139.33 66Zm6.62 31.47l46.82-10.05l3.34 15.9L146 97.53Zm6.64 31.57l46.82-10.06l13.3 63.24l-46.82 10.06ZM216 197.94l-46.8 10l-3.33-15.87l46.8-10.07l3.33 15.85v.09ZM104 32H56a16 16 0 0 0-16 16v160a16 16 0 0 0 16 16h48a16 16 0 0 0 16-16V48a16 16 0 0 0-16-16ZM56 48h48v16H56Zm0 32h48v96H56Zm48 128H56v-16h48v16Z"
    />
  </svg>
);

const IconAnalytics = (
  <svg viewBox="0 0 32 32" className="w-10 h-10 themed-icon" aria-hidden>
    <path fill="currentColor" d="M4 2H2v26a2 2 0 0 0 2 2h26v-2H4Z" />
    <path fill="currentColor" d="M30 9h-7v2h3.59L19 18.59l-4.29-4.3a1 1 0 0 0-1.42 0L6 21.59L7.41 23L14 16.41l4.29 4.3a1 1 0 0 0 1.42 0l8.29-8.3V16h2Z" />
  </svg>
);

export default function Landing() {
  return (
    <div
      id="landingPage"
      className="min-h-screen flex flex-col overflow-y-auto snap-y snap-mandatory"
    >
      {/* Hero Section containing TopNav + header content */}
      <section className="relative h-screen overflow-hidden flex flex-col snap-start">
        {/* Ensure nav renders above decorative overlay */}
        <TopNav />
        <div className="absolute inset-0 opacity-10 pointer-events-none z-0"></div>
        <div className="flex flex-col flex-grow px-6 max-w-7xl w-full mx-auto text-center justify-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <div className="page-header-group mb-8 max-w-4xl mx-auto">
              <h1 className="text-5xl font-bold page-title">
              Master Any Subject with{" "}
              <span className="text-primary">
                AI Intelligence
              </span> 
              </h1>
              <p className="text-subheading text-muted max-w-3xl mx-auto text-lg page-subtitle mt-4">
                Transform your study sessions with intelligent summaries,
                interactive flashcards, and personalized learning analytics that
                adapt to your unique learning style.
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
          >
            {/* Removed duplicate paragraph moved inside group */}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            viewport={{ once: true }}
            className="mb-16"
          >
            <Link
              to="/register"
              className="btn-modern btn-primary text-body mr-4"
            >
              Get Started Free
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Fun Activities Section */}
    <section className="h-screen px-6 section-surface bg-[#EDF1F6] flex items-center snap-start">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-heading text-primary mb-4 text-3xl">
              Interactive Learning Experience
            </h2>
            <p className="text-body text-muted max-w-2xl mx-auto">
              Engage with dynamic activities designed to make learning enjoyable
              and effective
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: IconQuiz,
                title: "Quiz Challenges",
                text: "Test your knowledge with adaptive quizzes that adjust to your learning pace and provide instant feedback.",
                btn: "Try Now →",
              },
              {
                icon: IconMemory,
                title: "Memory Games",
                text: "Boost retention with interactive memory exercises and brain training games tailored to your subjects.",
                btn: "Play Now →",
              },
              {
                icon: IconStreaks,
                title: "Study Streaks",
                text: "Build consistent study habits with daily challenges and achievement badges that motivate progress.",
                btn: "Start Streak →",
              },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 60 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: i * 0.2 }}
                viewport={{ once: true }}
                whileHover={{ scale: 1.05, y: -8, boxShadow: "0 12px 24px rgba(0,0,0,0.15)", transition: { type: "spring", stiffness: 300 } }}
                
                className="glass-card p-8 interactive cursor-pointer flex flex-col items-center text-center"
              >
                <div className="w-16 h-16 rounded-3xl flex items-center justify-center mb-6 gradient-primary">
                  {item.icon}
                </div>
                <h3 className="text-subheading text-primary mb-4">{item.title}</h3>
                <p className="text-body text-muted mb-6">{item.text}</p>
                <Link to="/login" className="btn-modern btn-secondary text-caption">
                  {item.btn}
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section
        id="features"
        className="h-screen px-6 hero-surface flex items-center snap-start"
      >
        <div className="max-w-7xl mx-auto ">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-heading text-primary mb-4 text-3xl">
              Powerful Study Features
            </h2>
            <p className="text-body text-muted max-w-2xl mx-auto">
              Advanced AI-powered tools designed to accelerate your learning
              journey
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: IconSummarizer, title: "AI Summarizer", text: "Convert lengthy texts into concise, digestible summaries with key insights highlighted" },
              { icon: IconFlashcards, title: "Smart Flashcards", text: "Auto-generate intelligent flashcards from your study materials with spaced repetition" },
              { icon: IconLibrary, title: "Digital Library", text: "Organize and access all your study materials in one centralized, searchable location" },
              { icon: IconAnalytics, title: "Learning Analytics", text: "Track progress with detailed insights and identify areas for improvement" },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 60 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: i * 0.2 }}
                viewport={{ once: true }}
                whileHover={{ scale: 1.05, y: -8, boxShadow: "0 12px 24px rgba(0,0,0,0.15)",transition: { type: "spring", stiffness: 300 } }}
                className="glass-card p-6 text-center interactive cursor-pointer"
              >
                <div className="w-20 h-20 rounded-3xl mx-auto mb-6 flex items-center justify-center gradient-primary">
                  {item.icon}
                </div>
                <h3 className="text-subheading text-primary mb-3">{item.title}</h3>
                <p className="text-body text-muted">{item.text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
    <section id="how-it-works" className="h-screen px-6 section-surface bg-[#FFFFFF] flex items-center snap-start">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-heading text-primary mb-4 text-3xl">How It Works</h2>
            <p className="text-body text-muted max-w-2xl mx-auto">
              Simple steps to start your learning journey with StudyTa
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: "1", title: "Sign Up", text: "Create your free account in seconds and join the StudyTa community." },
              { step: "2", title: "Choose Features", text: "Access quizzes, flashcards, and AI tools tailored to your subjects." },
              { step: "3", title: "Track Progress", text: "Monitor your study habits with analytics and streaks to stay motivated." },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 60 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: i * 0.2 }}
                viewport={{ once: true }}
                whileHover={{ scale: 1.05, y: -8, boxShadow: "0 12px 24px rgba(0,0,0,0.15)", transition: { type: "spring", stiffness: 300 } }}
                className="glass-card p-8 text-center cursor-pointer"
              >
                <div className="text-4xl font-bold text-primary mb-4">
                  {item.step}
                </div>
                <h3 className="text-subheading text-primary mb-3">
                  {item.title}
                </h3>
                <p className="text-body text-muted">{item.text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

  {/* About + Footer Combined */}
  <section
    id="about"
    className="h-screen px-6 section-surface bg-[#FFFFFF] flex flex-col snap-start"
  >
    <div className="max-w-7xl w-full mx-auto flex-grow flex items-center justify-center text-center">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <h2 className="text-heading text-primary mb-4 text-3xl">About Us</h2>
        <p className="text-body text-muted max-w-3xl mx-auto">
          StudyTa was created by passionate students and developers who
          believe learning should be smarter, interactive, and accessible for
          everyone. We combine technology and education to empower learners
          worldwide.
        </p>
      </motion.div>
    </div>
    <footer id="contact" className="footer-surface text-muted py-8 mt-0">
      <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-3 gap-8">
        <div>
          <h3 className="text-lg font-bold text-heading mb-3">StudyTa</h3>
          <p className="text-sm text-muted">
            Your AI-powered study companion for smarter learning.
          </p>
        </div>
        <div>
          <h4 className="font-semibold text-heading mb-3">Quick Links</h4>
          <ul className="space-y-2 text-sm">
            <li><a href="#features" className="hover:text-heading transition">Features</a></li>
            <li><a href="#how-it-works" className="hover:text-heading transition">How It Works</a></li>
            <li><a href="#about" className="hover:text-heading transition">About Us</a></li>
            <li><a href="#contact" className="hover:text-heading transition">Contact</a></li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold text-heading mb-3">Follow Us</h4>
          <div className="flex space-x-4 text-lg">
            <a href="#" className="hover:text-heading">🌐</a>
            <a href="#" className="hover:text-heading">🐦</a>
            <a href="#" className="hover:text-heading">📘</a>
          </div>
        </div>
      </div>
      <div className="text-center text-xs text-muted mt-6">
        © {new Date().getFullYear()} StudyTa. All rights reserved.
      </div>
    </footer>
  </section>
    </div>
  );
}
