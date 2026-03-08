"use client";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import { Gift, ShoppingBag, Leaf, Award, Zap, LoaderCircle, CheckCircle, Clock, ShieldCheck } from "lucide-react";
import "./index.css";

const rewardsData = [
  { points: 50, title: "Eco-Pen", description: "Made from recycled paper.", icon: <Award className="w-5 h-5" /> },
  { points: 500, title: "Seed Packet", description: "Plant a tree.", icon: <Leaf className="w-5 h-5" /> },
  { points: 1000, title: "Coffee Discounts", description: "Get 20% off at partner cafes.", icon: <ShoppingBag className="w-5 h-5" /> },
  { points: 1500, title: "Phone Case", description: "Recycled plastic case.", icon: <Zap className="w-5 h-5" /> },
  { points: 2000, title: "Gift Voucher", description: "₹500 Online Shopping.", icon: <Gift className="w-5 h-5" /> },
];

export default function RewardsPage() {
  const navigate = useNavigate();
  const [userData, setUserData] = useState({ totalPoints: 0, redeemedRewards: [] });
  const [loading, setLoading] = useState(true);

  const fetchUserData = async () => {
    const token = localStorage.getItem("token");
    if (!token) return navigate("/login");
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/user`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUserData(res.data);
    } catch (err) {
      console.error("Error fetching user data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    fetchUserData(); 
  }, []);

  const redeemReward = async (reward) => {
    if (!confirm(`Redeem ${reward.title} for ${reward.points} credits?`)) return;
    
    try {
      const token = localStorage.getItem("token");
      const res = await axios.patch(
        `${import.meta.env.VITE_API_URL}/api/user`,
        { reward },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setUserData(prev => ({
        ...prev,
        totalPoints: res.data.totalPoints,
        pointsRemaining: res.data.pointsRemaining,
        redeemedRewards: res.data.redeemedRewards
      }));

      toast.success("🎉 Reward redeemed successfully!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Redemption failed");
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center theme-bg">
      <LoaderCircle className="animate-spin text-emerald-400" size={48} />
    </div>
  );

  return (
    <div className="min-h-screen theme-bg theme-text p-4 pt-24 pb-24 overflow-x-hidden">
      
      {/* Header */}
      <div className="max-w-4xl mx-auto mb-8 text-center animate-fade-in-up">
        <h1 className="text-3xl font-black text-emerald-400 mb-2 tracking-tight">Green Credits Marketplace</h1>
        <p className="text-gray-400">Exchange your recycling efforts for real-world rewards.</p>
      </div>

      {/* BALANCE CARD */}
      <div className="max-w-4xl mx-auto glass-panel p-8 rounded-3xl mb-12 relative overflow-hidden animate-scale-in">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2" />
        
        <div className="text-center relative z-10">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Available Balance</p>
          <div className="flex items-center justify-center gap-2">
            <Zap className="text-yellow-400 fill-yellow-400" size={40} />
            <span className="text-6xl md:text-7xl font-black theme-text">{userData.pointsRemaining ?? 0}</span>
          </div>
          <p className="text-emerald-400 font-bold mt-2">Green Credits</p>
        </div>
      </div>

      {/* REWARDS GRID */}
      <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
        {rewardsData.map((reward, idx) => {
          const canAfford = (userData.totalPoints ?? 0) >= reward.points;
          return (
            <div 
              key={reward.title} 
              className="bg-white/5 backdrop-blur-md border border-white/10 p-5 rounded-2xl flex items-center justify-between group hover:bg-white/10 transition-all"
              style={{ animationDelay: `${idx * 100}ms` }}
            >
              <div className="flex gap-4 items-center">
                <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-xl group-hover:scale-110 transition-transform">
                  {reward.icon}
                </div>
                <div>
                  <h3 className="font-bold theme-text text-sm">{reward.title}</h3>
                  <p className="text-xs text-gray-400 mb-1">{reward.description}</p>
                  <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-wide">{reward.points} GC</p>
                </div>
              </div>
              <button
                disabled={!canAfford}
                onClick={() => redeemReward(reward)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  canAfford 
                  ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 active:scale-95" 
                  : "theme-glass-overlay theme-text-muted cursor-not-allowed"
                }`}
              >
                REDEEM
              </button>
            </div>
          );
        })}
      </div>

      {/* HISTORY SECTION */}
      <div className="max-w-4xl mx-auto">
        <h2 className="text-lg font-bold theme-text mb-6 flex items-center gap-2">
          <Clock className="text-emerald-400" size={20} /> History
        </h2>
        
        {userData.redeemedRewards && userData.redeemedRewards.length > 0 ? (
          <div className="space-y-3">
            {[...userData.redeemedRewards].reverse().map((item, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5 animate-fade-in-up">
                <div className="flex items-center gap-4">
                   <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg">
                      <CheckCircle size={16} />
                   </div>
                   <div className="flex flex-col">
                    <span className="font-bold text-gray-200 text-sm">{item.title}</span>
                    <span className="text-[10px] text-gray-500">
                      {new Date(item.redeemedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <span className="font-bold text-red-400 text-xs">-{item.points} GC</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 border border-dashed border-white/10 rounded-2xl bg-white/5">
            <ShoppingBag className="mx-auto text-gray-600 mb-2" size={32} />
            <p className="text-gray-500 text-xs font-bold uppercase">No rewards claimed yet</p>
          </div>
        )}
      </div>
    </div>
  );
}