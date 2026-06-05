import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Code2,
  Sparkles,
  BookOpen,
  GitBranch,
  Info,
  Heart
} from "lucide-react";
import Card from "../components/ui/Card";
import ThemeToggle from "../components/ui/ThemeToggle";
import logo from "../assets/logo.png";
import GlowRingLogo from "../components/ui/GlowRingLogo";


// Reusable Community & Contributors Section Components
import TeamCard from "../components/about/TeamCard";
import ContributorsGrid from "../components/about/ContributorsGrid";
import ContributionCTA from "../components/about/ContributionCTA";

export const About = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleBack = () => {
    navigate(user ? "/dashboard" : "/");
  };

  const coreModules = [
    {
      title: "GitRank",
      desc: "Live Git analytics dashboard tracking pull requests, commits, and peer code reviews dynamically.",
      icon: GitBranch,
      color: "text-blue-400 bg-blue-500/10 border-blue-500/20"
    },
    {
      title: "CodingVerse",
      desc: "Competitive algorithmic sandbox containing daily code challenges, test suites, and XP tracking.",
      icon: Code2,
      color: "text-purple-400 bg-purple-500/10 border-purple-500/20"
    },
    {
      title: "CodingOwl",
      desc: "Consistency study buddy tracking focus sessions, Pomodoro timers, and streak preservation.",
      icon: BookOpen,
      color: "text-orange-400 bg-orange-500/10 border-orange-500/20"
    },
    {
      title: "RankHer",
      desc: "Specialized initiative dashboard highlighting and celebrating achievements of women in technology.",
      icon: Sparkles,
      color: "text-pink-400 bg-pink-500/10 border-pink-500/20"
    }
  ];



  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#070B16] text-slate-800 dark:text-slate-100 relative overflow-hidden flex flex-col font-sans transition-colors duration-300">
      
      {/* Background Animated Blobs (optimized with radial gradients instead of expensive blur filters) */}
      <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-blob-purple-strong pointer-events-none animate-blob transform-gpu" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-blob-blue-strong pointer-events-none animate-blob [animation-delay:3s] transform-gpu" />
      <div className="absolute top-[35%] left-[25%] w-[40vw] h-[40vw] bg-blob-indigo-strong pointer-events-none animate-pulse-slow transform-gpu" />

      {/* Standalone Header */}
      <header className="w-full h-16 border-b border-slate-200/40 dark:border-slate-800/40 bg-white/60 dark:bg-slate-950/60 backdrop-blur-xl flex items-center justify-between px-6 sticky top-0 z-50 transition-colors duration-300">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-[34px] h-[34px] rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center bg-slate-100 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 shadow-md">
            <img src={logo} alt="RankerHub Logo" className="w-full h-full object-cover" />
          </div>
          <span className="font-caesar text-2xl tracking-widest text-slate-900 dark:text-white">
            RankerHub
          </span>
        </Link>

        <div className="flex items-center gap-4">
          <ThemeToggle />

          <button
            onClick={handleBack}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800/50 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition duration-200 text-xs font-bold cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Close
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-6 py-12 md:py-16 space-y-16 relative z-10">
        
        {/* Title Block */}
        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeInUp}
          className="flex flex-col md:flex-row items-center justify-between gap-8 md:gap-12 max-w-4xl mx-auto text-left"
        >
          <div className="flex-1 space-y-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20">
              About the Project
            </span>
            <h1 className="text-4xl sm:text-5xl font-black tracking-tight leading-[1.1] text-transparent bg-clip-text bg-gradient-to-r from-violet-600 dark:from-violet-400 via-indigo-500 dark:via-indigo-300 to-blue-600 dark:to-blue-400 my-0">
              Developer Gamification
            </h1>
            <p className="text-sm md:text-base text-slate-600 dark:text-slate-400 leading-relaxed font-semibold">
              RankerHub is a premium performance-driven dashboard and algorithmic arena built to track coding frequency, analyze Git activity, build consistency streaks, and verify developer progress.
            </p>
          </div>
          
          <div className="flex-shrink-0">
            <GlowRingLogo
              logoSrc={logo}
              type="logo"
              className="w-48 h-48 md:w-56 md:h-56 shadow-2xl transition-transform duration-300 hover:scale-105"
            />
          </div>
        </motion.div>

        {/* Project Description & Modules */}
        <motion.section 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeInUp}
          className="space-y-8"
        >
          <Card className="p-6 bg-white/40 dark:bg-slate-950/30 border-slate-200/50 dark:border-slate-800/50 backdrop-blur-md">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <Info className="w-5 h-5 text-violet-500" /> Platform Overview
            </h2>
            <div className="space-y-4 text-slate-600 dark:text-slate-400 text-sm leading-relaxed font-semibold">
              <p>
                Created as a modern gamified utility, RankerHub connects developers directly to automated commit metrics, algorithm sandboxes, and social verification badges. The dashboard integrates seamlessly with public development timelines to compile a global XP rating.
              </p>
              <p>
                Our system prioritizes data isolation, focusing only on public contribution logs, lines of code changed, and study companion focus timelines. Whether checking daily quests or verifying achievements, RankerHub is engineered to empower software developers on their learning journey.
              </p>
            </div>
          </Card>

          {/* Core Modules Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {coreModules.map((mod, idx) => {
              const Icon = mod.icon;
              return (
                <div
                  key={idx}
                  className="p-5 rounded-2xl border border-slate-200/40 dark:border-slate-800/40 bg-white/40 dark:bg-slate-900/10 hover:bg-slate-100/50 dark:hover:bg-slate-900/20 transition-all duration-300 flex items-start gap-4"
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${mod.color} flex-shrink-0`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white my-0">{mod.title}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed my-0 font-medium">
                      {mod.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.section>


        {/* Community & Contributors Section */}
        <motion.section
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeInUp}
          className="space-y-12 pt-8 border-t border-slate-200/40 dark:border-slate-800/40 relative"
        >
          {/* Subtle Background Glow for Community Section */}
          <div className="absolute top-[20%] right-[-10%] w-[35vw] h-[35vw] bg-blob-indigo pointer-events-none transform-gpu" />

          {/* Section Header */}
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20 shadow-sm">
              <Sparkles className="w-3.5 h-3.5" /> Open Source Community
            </span>
            <h2 className="text-3xl md:text-4xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-violet-600 dark:from-violet-400 via-indigo-500 dark:via-indigo-300 to-blue-600 dark:to-blue-400 my-0">
              Built By Community
            </h2>
            <p className="text-xs md:text-sm text-slate-550 dark:text-slate-400 font-semibold max-w-lg mx-auto">
              RankerHub is built on open-source collaboration. Meet the core creators, collaborators, and community developers who make it happen.
            </p>
          </div>

          {/* Owners Section */}
          <div className="space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 tracking-tight">
              <span className="w-1.5 h-4 bg-violet-500 rounded-full"></span>
              Project Owners
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <TeamCard
                username="indresh404"
                avatar="https://github.com/indresh404.png"
                role="Co-Founder & Developer"
                profileLink="https://github.com/indresh404"
                description="Creator of RankerHub and core architect behind the platform."
                isOwner={true}
                links={{
                  github: "https://github.com/indresh404",
                  linkedin: "https://www.linkedin.com/in/indresh-suresh-093646399",
                  instagram: "https://www.instagram.com/indresh_suresh/",
                  email: "mailto:indreshsuresh95@gmail.com"
                }}
              />
              <TeamCard
                username="divyagsharma2006-blip"
                avatar="https://github.com/divyagsharma2006-blip.png"
                role="Co-Founder & Product/Design"
                profileLink="https://github.com/divyagsharma2006-blip"
                description="Helping improve RankerHub through collaboration, features, and community contributions."
                isOwner={true}
                links={{
                  github: "https://github.com/divyagsharma2006-blip",
                  linkedin: "https://www.linkedin.com/in/divya-sharma-57673536b",
                  instagram: "https://www.instagram.com/_s.divyaaaa/",
                  email: "mailto:indreshsuresh95@gmail.com"
                }}
              />
            </div>
          </div>

          {/* Contributors Section */}
          <div className="space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 tracking-tight">
              <span className="w-1.5 h-4 bg-blue-500 rounded-full"></span>
              Community Contributors
            </h3>
            <ContributorsGrid fadeInUp={fadeInUp} staggerContainer={staggerContainer} />
          </div>

          {/* Want to Contribute CTA Section */}
          <ContributionCTA />

        </motion.section>

      </main>

      {/* Simple Mini Footer */}
      <footer className="w-full py-8 border-t border-slate-200/40 dark:border-slate-800/40 text-center text-[10px] text-slate-500 font-bold bg-slate-100/20 dark:bg-slate-950/20 relative z-10">
        <p className="my-0 flex items-center justify-center gap-1">
          Made with <Heart className="w-3 h-3 text-red-500 fill-red-500" /> by Indresh Suresh & Divya Sharma © 2026 RankerHub.
        </p>
      </footer>

    </div>
  );
};

export default About;
