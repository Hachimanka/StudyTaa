import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import TopNav from "../components/TopNav";

export default function Landing() {
  return (
    <div id="landingPage" className="min-h-screen flex flex-col">
      <TopNav />

      {/* Hero Section */}
      <section className="relative py-32 px-6 overflow-hidden flex-grow">
        <div className="absolute inset-0 opacity-10"></div>
        <div className="max-w-7xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h1 className="text-display mb-8 max-w-4xl mx-auto text-10xl md:text-6xl font-extrabold leading-18">
              Master Any Subject with{" "}
              <span className="text-primary">
                AI Intelligence
              </span> 
            </h1>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
          >
            <p className="text-subheading text-muted mb-12 max-w-3xl mx-auto text-lg">
              Transform your study sessions with intelligent summaries,
              interactive flashcards, and personalized learning analytics that
              adapt to your unique learning style.
            </p>
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
            <button className="btn-modern btn-secondary text-body">
              Watch Demo
            </button>
          </motion.div>
        </div>
      </section>

      {/* Fun Activities Section */}
    <section className="py-24 px-6 section-surface bg-[#EDF1F6]">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-heading text-primary mb-4">
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
                icon: "🎯",
                title: "Quiz Challenges",
                text: "Test your knowledge with adaptive quizzes that adjust to your learning pace and provide instant feedback.",
                btn: "Try Now →",
              },
              {
                icon: "🧠",
                title: "Memory Games",
                text: "Boost retention with interactive memory exercises and brain training games tailored to your subjects.",
                btn: "Play Now →",
              },
              {
                icon: "🏆",
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
                
                className="glass-card p-8 interactive cursor-pointer"
              >
                <div className="w-16 h-16 rounded-3xl flex items-center justify-center mb-6 gradient-primary">
                  <span className="text-white text-3xl">{item.icon}</span>
                </div>
                <h3 className="text-subheading text-primary mb-4">{item.title}</h3>
                <p className="text-body text-muted mb-6">{item.text}</p>
                <button className="btn-modern btn-secondary text-caption">
                  {item.btn}
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section
        id="features"
        className="py-24 px-6 hero-surface"
      >
        <div className="max-w-7xl mx-auto ">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-heading text-primary mb-4">
              Powerful Study Features
            </h2>
            <p className="text-body text-muted max-w-2xl mx-auto">
              Advanced AI-powered tools designed to accelerate your learning
              journey
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: "📝", title: "AI Summarizer", text: "Convert lengthy texts into concise, digestible summaries with key insights highlighted" },
              { icon: "🃏", title: "Smart Flashcards", text: "Auto-generate intelligent flashcards from your study materials with spaced repetition" },
              { icon: "📚", title: "Digital Library", text: "Organize and access all your study materials in one centralized, searchable location" },
              { icon: "📊", title: "Learning Analytics", text: "Track progress with detailed insights and identify areas for improvement" },
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
                  <span className="text-white text-3xl">{item.icon}</span>
                </div>
                <h3 className="text-subheading text-primary mb-3">{item.title}</h3>
                <p className="text-body text-muted">{item.text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
    <section id="how-it-works" className="py-24 px-6 section-surface bg-[#FFFFFF]">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-heading text-primary mb-4">How It Works</h2>
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

  {/* About Us Section */}
  <section id="about" className="py-24 px-6 section-surface">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-heading text-primary mb-4">About Us</h2>
            <p className="text-body text-muted max-w-3xl mx-auto">
              StudyTa was created by passionate students and developers who
              believe learning should be smarter, interactive, and accessible
              for everyone. We combine technology and education to empower
              learners worldwide.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer-surface text-muted py-10 mt-16">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-3 gap-12">
          <div>
            <h3 className="text-lg font-bold text-heading mb-4">StudyTa</h3>
            <p className="text-sm text-muted">
              Your AI-powered study companion for smarter learning.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-heading mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#features" className="hover:text-heading transition">Features</a></li>
              <li><a href="#how-it-works" className="hover:text-heading transition">How It Works</a></li>
              <li><a href="#about" className="hover:text-heading transition">About Us</a></li>
              <li><a href="#contact" className="hover:text-heading transition">Contact</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-heading mb-4">Follow Us</h4>
            <div className="flex space-x-4 text-lg">
              <a href="#" className="hover:text-heading">🌐</a>
              <a href="#" className="hover:text-heading">🐦</a>
              <a href="#" className="hover:text-heading">📘</a>
            </div>
          </div>
        </div>
        <div className="text-center text-sm text-muted mt-8">
          © {new Date().getFullYear()} StudyTa. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
