import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Zap, MapPin, Award, Leaf, TrendingUp, Cpu } from "lucide-react";

const FeatureCard = ({ icon: Icon, title, description, delay }) => (
  <div 
    className="theme-glass-overlay backdrop-blur-md theme-border p-6 rounded-2xl hover:theme-glass-overlay-hover transition-all duration-300 hover:-translate-y-2 group"
    style={{ animationDelay: `${delay}ms` }}
  >
    <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
      <Icon className="text-emerald-400 w-6 h-6" />
    </div>
    <h3 className="text-xl font-bold theme-text mb-2">{title}</h3>
    <p className="theme-text-muted text-sm leading-relaxed">{description}</p>
  </div>
);

const StatCard = ({ value, label, delay }) => (
  <div 
    className="text-center p-6 theme-glass-overlay backdrop-blur-md rounded-2xl theme-border animate-scale-in"
    style={{ animationDelay: `${delay}ms` }}
  >
    <h4 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400 mb-2">
      {value}
    </h4>
    <p className="theme-text-muted uppercase tracking-widest text-xs font-bold">{label}</p>
  </div>
);

export default function Home() {
  return (
    <div className="min-h-screen theme-bg theme-text overflow-hidden relative selection:bg-emerald-500/30">
      
      {/* Background Gradients */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-emerald-500/20 rounded-full blur-[120px] animate-pulse-slow" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-[150px] animate-pulse-slow" style={{ animationDelay: "2s" }} />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 pt-32 pb-20">
        
        {/* Hero Section */}
        <div className="text-center max-w-4xl mx-auto mb-24">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-8 animate-fade-in-up">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-emerald-400 text-xs font-bold tracking-wider uppercase">Haxplore 2025 Innovation</span>
          </div>
          
          <h1 className="text-6xl md:text-8xl font-black mb-8 leading-tight tracking-tight animate-fade-in-up" style={{ animationDelay: "100ms" }}>
            Revolutionizing <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400">Waste</span> <br />
            For A Better Future.
          </h1>
          
          <p className="text-xl theme-text-muted mb-12 max-w-2xl mx-auto leading-relaxed animate-fade-in-up" style={{ animationDelay: "200ms" }}>
            The smartest way to manage waste. Scan scraps, find nearest bins with AI, earn Green Credits, and track your environmental impact in real-time.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up" style={{ animationDelay: "300ms" }}>
            <Link 
              to="/report" 
              className="px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl font-bold text-lg shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:-translate-y-1 transition-all flex items-center gap-2"
            >
              <Zap className="w-5 h-5" />
              Start Scanning
            </Link>
            <Link 
              to="/binmap" 
              className="px-8 py-4 bg-white/5 border border-white/10 backdrop-blur-md rounded-xl font-bold text-lg hover:bg-white/10 hover:-translate-y-1 transition-all flex items-center gap-2"
            >
              <MapPin className="w-5 h-5" />
              Find Bins
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-32">
          <StatCard value="25.8 T" label="Waste Diverted" delay={400} />
          <StatCard value="120 K" label="Green Credits" delay={500} />
          <StatCard value="2.5 K +" label="Active Recyclers" delay={600} />
          <StatCard value="450" label="Smart Bins" delay={700} />
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-6">
          <FeatureCard 
            icon={Cpu} 
            title="AI Recognition" 
            description="Instantly identify waste types, assess recyclability, and calculate carbon impact with our advanced Gemini-powered scanner."
            delay={800}
          />
          <FeatureCard 
            icon={MapPin} 
            title="Smart Locator" 
            description="Find the nearest specific waste bins. Filter by plastic, organic, or other waste disposal points instantly."
            delay={900}
          />
          <FeatureCard 
            icon={Award} 
            title="Gamified Rewards" 
            description="Earn Green Credits for every item recycled. Compete on the leaderboard and redeem for eco-friendly products."
            delay={1000}
          />
        </div>

      </div>
    </div>
  );
}
