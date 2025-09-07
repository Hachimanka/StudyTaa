import React from "react";

export default function Home() {
  return (
    <div id="landingPage" className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-32 px-6 overflow-hidden">
        <div className="absolute inset-0 gradient-primary opacity-10"></div>
        <div className="max-w-7xl mx-auto text-center relative z-10">
          <div className="animate-fadeInUp">
            <h1 className="text-display text-primary mb-8 max-w-4xl mx-auto">
              Master Any Subject with{" "}
              <span className="gradient-primary bg-clip-text text-transparent">
                AI Intelligence
              </span>
            </h1>
          </div>
          <div className="animate-fadeInUp delay-200">
            <p className="text-subheading text-muted mb-12 max-w-3xl mx-auto">
              Transform your study sessions with intelligent summaries,
              interactive flashcards, and personalized learning analytics that
              adapt to your unique learning style.
            </p>
          </div>
          <div className="animate-fadeInUp delay-300 mb-16">
            <button className="btn-modern btn-primary text-body mr-4">
              Start Learning Free
            </button>
            <button className="btn-modern btn-secondary text-body">
              Watch Demo
            </button>
          </div>
          <div className="animate-float delay-400">
            <div className="text-6xl mb-4">📚</div>
            <div className="flex justify-center space-x-8 text-4xl">
              <span className="animate-float delay-500">🧠</span>
              <span className="animate-float delay-600">⚡</span>
              <span className="animate-float delay-700">🎯</span>
            </div>
          </div>
        </div>
      </section>

      {/* Fun Activities Section */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 animate-fadeInUp">
            <h2 className="text-heading text-primary mb-4">
              Interactive Learning Experience
            </h2>
            <p className="text-body text-muted max-w-2xl mx-auto">
              Engage with dynamic activities designed to make learning enjoyable
              and effective
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="glass-card p-8 interactive animate-slideInLeft">
              <div className="gradient-primary w-16 h-16 rounded-3xl flex items-center justify-center mb-6 animate-float">
                <span className="text-white text-3xl">🎯</span>
              </div>
              <h3 className="text-subheading text-primary mb-4">
                Quiz Challenges
              </h3>
              <p className="text-body text-muted mb-6">
                Test your knowledge with adaptive quizzes that adjust to your
                learning pace and provide instant feedback.
              </p>
              <button className="btn-modern btn-secondary text-caption">
                Try Now →
              </button>
            </div>
            <div className="glass-card p-8 interactive animate-fadeInUp delay-200">
              <div className="gradient-secondary w-16 h-16 rounded-3xl flex items-center justify-center mb-6 animate-float delay-100">
                <span className="text-white text-3xl">🧠</span>
              </div>
              <h3 className="text-subheading text-primary mb-4">
                Memory Games
              </h3>
              <p className="text-body text-muted mb-6">
                Boost retention with interactive memory exercises and brain
                training games tailored to your subjects.
              </p>
              <button className="btn-modern btn-secondary text-caption">
                Play Now →
              </button>
            </div>
            <div className="glass-card p-8 interactive animate-slideInRight delay-300">
              <div className="gradient-accent w-16 h-16 rounded-3xl flex items-center justify-center mb-6 animate-float delay-200">
                <span className="text-white text-3xl">🏆</span>
              </div>
              <h3 className="text-subheading text-primary mb-4">
                Study Streaks
              </h3>
              <p className="text-body text-muted mb-6">
                Build consistent study habits with daily challenges and
                achievement badges that motivate progress.
              </p>
              <button className="btn-modern btn-secondary text-caption">
                Start Streak →
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section
        id="features"
        className="py-24 px-6 bg-gradient-to-br from-slate-50 to-blue-50"
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 animate-fadeInUp">
            <h2 className="text-heading text-primary mb-4">
              Powerful Study Features
            </h2>
            <p className="text-body text-muted max-w-2xl mx-auto">
              Advanced AI-powered tools designed to accelerate your learning
              journey
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="glass-card p-6 text-center interactive animate-fadeInUp">
              <div className="gradient-primary w-20 h-20 rounded-3xl mx-auto mb-6 flex items-center justify-center animate-pulse-glow">
                <span className="text-white text-3xl">📝</span>
              </div>
              <h3 className="text-subheading text-primary mb-3">
                AI Summarizer
              </h3>
              <p className="text-body text-muted">
                Convert lengthy texts into concise, digestible summaries with
                key insights highlighted
              </p>
            </div>
            <div className="glass-card p-6 text-center interactive animate-fadeInUp delay-100">
              <div className="gradient-secondary w-20 h-20 rounded-3xl mx-auto mb-6 flex items-center justify-center animate-pulse-glow">
                <span className="text-white text-3xl">🃏</span>
              </div>
              <h3 className="text-subheading text-primary mb-3">
                Smart Flashcards
              </h3>
              <p className="text-body text-muted">
                Auto-generate intelligent flashcards from your study materials
                with spaced repetition
              </p>
            </div>
            <div className="glass-card p-6 text-center interactive animate-fadeInUp delay-200">
              <div className="gradient-accent w-20 h-20 rounded-3xl mx-auto mb-6 flex items-center justify-center animate-pulse-glow">
                <span className="text-white text-3xl">📚</span>
              </div>
              <h3 className="text-subheading text-primary mb-3">
                Digital Library
              </h3>
              <p className="text-body text-muted">
                Organize and access all your study materials in one centralized,
                searchable location
              </p>
            </div>
            <div className="glass-card p-6 text-center interactive animate-fadeInUp delay-300">
              <div className="gradient-primary w-20 h-20 rounded-3xl mx-auto mb-6 flex items-center justify-center animate-pulse-glow">
                <span className="text-white text-3xl">📊</span>
              </div>
              <h3 className="text-subheading text-primary mb-3">
                Learning Analytics
              </h3>
              <p className="text-body text-muted">
                Track progress with detailed insights and identify areas for
                improvement
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
