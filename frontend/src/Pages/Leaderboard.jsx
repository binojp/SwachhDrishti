import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { LoaderCircle, Trophy, Leaf, Zap, Award } from "lucide-react";
import "./index.css";

export default function Leaderboard() {
  const navigate = useNavigate();
  const [topMembers, setTopMembers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        // Fetch top members (Public)
        const membersResponse = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/top-members`,
          {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          }
        );
        setTopMembers(membersResponse.data);

        // Fetch current user data (Only if logged in)
        if (token) {
          try {
            const userResponse = await axios.get(
              `${import.meta.env.VITE_API_URL}/api/user`,
              {
                headers: { Authorization: `Bearer ${token}` },
              }
            );
            
            const userData = userResponse.data;
            const userRank = membersResponse.data.findIndex(
              (member) => member.id === userData.id || member.id.toString() === userData.id.toString()
            );
            
            setCurrentUser({
              id: userData.id,
              name: userData.name || "You",
              points: userData.monthlyPoints || 0,
              totalPoints: userData.totalPoints || 0,
              rank: userRank >= 0 ? userRank + 1 : membersResponse.data.length + 1,
            });
          } catch (e) {
            console.warn("User stats fetch failed");
          }
        }

        setLoading(false);
      } catch (err) {
        console.error("Fetch Error:", err.response?.data || err.message);
        setError(err.response?.data?.message || "Failed to fetch data");
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getRankMedal = (rank) => {
    if (rank === 1) return <Trophy className="text-yellow-400 w-6 h-6" />;
    if (rank === 2) return <Trophy className="text-gray-300 w-6 h-6" />;
    if (rank === 3) return <Trophy className="text-amber-600 w-6 h-6" />;
    return <span className="font-bold text-gray-500 text-lg">#{rank}</span>;
  };

  if (loading) {
    return (
      <div className="min-h-screen theme-bg flex items-center justify-center">
        <LoaderCircle className="animate-spin text-emerald-400" size={48} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen theme-bg flex items-center justify-center p-4">
        <div className="text-center glass-panel p-8 rounded-2xl">
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={() => navigate("/login")}
            className="bg-emerald-500 text-white px-6 py-2 rounded-lg hover:bg-emerald-600"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  const currentMonth = new Date().toLocaleString("default", { month: "long" });

  return (
    <div className="min-h-screen theme-bg theme-text p-4 pt-24 pb-24 overflow-x-hidden">
      
      {/* Header */}
      <div className="max-w-4xl mx-auto text-center mb-8 animate-fade-in-up">
        <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400 mb-2">
          Top Eco-Recyclers
        </h1>
        <p className="theme-text-muted">Competing to save the planet, one device at a time.</p>
      </div>

      {/* Current User Stats */}
      {currentUser && (
        <div className="max-w-4xl mx-auto glass-panel p-6 rounded-2xl mb-8 flex flex-col sm:flex-row justify-around gap-6 animate-scale-in border border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.1)]">
          <div className="text-center">
            <span className="block text-xs text-emerald-400 uppercase tracking-widest mb-1">Your Rank</span>
            <span className="text-3xl font-black text-white">#{currentUser.rank}</span>
          </div>
          <div className="text-center border-l border-white/10 pl-6">
            <span className="block text-xs text-gray-400 uppercase tracking-widest mb-1">Monthly Credits</span>
            <span className="text-3xl font-black text-white">{currentUser.points.toLocaleString()}</span>
          </div>
          <div className="text-center border-l border-white/10 pl-6">
            <span className="block text-xs text-gray-400 uppercase tracking-widest mb-1">Carbon Saved</span>
            <span className="text-3xl font-black text-emerald-400 flex items-center justify-center gap-1">
              {(currentUser.totalPoints / 10).toFixed(1)} <span className="text-sm font-normal text-gray-500">kg</span>
            </span>
          </div>
        </div>
      )}

      {/* Leaderboard List */}
      <div className="max-w-4xl mx-auto glass-panel rounded-2xl overflow-hidden theme-border">
        <div className="p-4 border-b theme-border theme-glass-overlay flex justify-between items-center">
          <h2 className="font-bold theme-text flex items-center gap-2">
            <Award className="text-emerald-400" size={18} /> {currentMonth} Leaders
          </h2>
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold border border-emerald-500/20">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            LIVE UPDATES
          </div>
        </div>

        <div className="divide-y divide-white/5">
          {topMembers.length > 0 ? (
            topMembers.map((member, index) => (
              <div
                key={member.id}
                className={`flex items-center p-5 transition-all hover:bg-white/5 ${
                  currentUser && (member.id === currentUser.id || member.id.toString() === currentUser.id.toString())
                    ? "bg-emerald-500/10 border-l-4 border-emerald-500"
                    : ""
                }`}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="w-12 text-center flex justify-center">
                  {getRankMedal(member.rank)}
                </div>
                
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center text-white text-sm font-bold mr-4 shadow-lg shadow-emerald-500/20">
                  {member.name.charAt(0).toUpperCase()}
                </div>
                
                <div className="flex-1">
                  <p className="font-bold text-white text-sm">{member.name}</p>
                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    <Leaf size={10} className="text-emerald-400" />
                    {member.reportsThisMonth || 0} items this month
                  </p>
                </div>
                
                <div className="text-right">
                  <p className="text-white font-bold">{member.points.toLocaleString()} GC</p>
                  <p className="text-[10px] text-gray-500">{(member.points / 10).toFixed(1)} kg CO₂ saved</p>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center theme-text-muted">
              <Zap className="mx-auto mb-2 theme-text-muted" size={24} />
              <p>No recyclers yet this month. Be the first!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
