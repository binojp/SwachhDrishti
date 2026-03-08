import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  MapPin, AlertTriangle, Map as MapIcon, Thermometer, Trash2, Clock, CheckCircle,
  Eye, Users, DollarSign, Crown, Medal, Trophy, Star, ChevronRight, Plus, X,
  ArrowUpRight, ArrowDownRight, Zap, Shield, LayoutDashboard, Activity, Search, UserPlus, ShoppingBag
} from "lucide-react";

import TrashMap from "./Heatmap";
import BinsMap from "./BinsMap";
import "./index.css";

// Modal Component
function Modal({ isOpen, onClose, children }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[2000] overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity"
          onClick={onClose}
        />
        <div className="relative glass-panel rounded-2xl shadow-2xl max-w-2xl w-full animate-scale-in border border-white/10" onClick={(e) => e.stopPropagation()}>
          {children}
        </div>
      </div>
    </div>
  );
}

// Stats Card Component
function StatsCard({ icon: Icon, title, value, change, changeType, color, delay }) {
  return (
    <div 
      className="glass-panel rounded-2xl p-6 relative overflow-hidden group hover:bg-white/5 transition-all duration-300"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity ${color.replace('bg-', 'text-')}`}>
        <Icon size={120} />
      </div>
      
      <div className="flex items-start justify-between mb-4 relative z-10">
        <div className={`p-3 rounded-xl bg-white/5 text-white border border-white/10`}>
          <Icon className="w-6 h-6" />
        </div>
        {change && (
          <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold ${
            changeType === 'up' 
              ? 'bg-emerald-500/20 text-emerald-400' 
              : 'bg-red-500/20 text-red-400'
          }`}>
            {changeType === 'up' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {change}%
          </div>
        )}
      </div>
      <div className="relative z-10">
        <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">{title}</p>
        <p className="text-3xl font-black text-white">{value}</p>
      </div>
    </div>
  );
}

// Status Badge Component
function StatusBadge({ status }) {
  const colors = {
    resolved: "bg-emerald-500/20 text-emerald-400 border-emerald-500/50",
    reported: "bg-blue-500/20 text-blue-400 border-blue-500/50",
    pending: "bg-amber-500/20 text-amber-400 border-amber-500/50",
    rejected: "bg-red-500/20 text-red-400 border-red-500/50",
  };
  
  return (
    <span className={`px-3 py-1 text-[10px] font-bold uppercase rounded-full border ${colors[status] || colors.pending}`}>
      {status}
    </span>
  );
}

// AdminDash Component
export default function AdminDash() {
  const navigate = useNavigate();
  const [reportFilter, setReportFilter] = useState("all");
  const [mapToggle, setMapToggle] = useState("heatmap");
  const [dashboardStats, setDashboardStats] = useState({});
  const [recentReports, setRecentReports] = useState([]);
  const [topMembers, setTopMembers] = useState([]);
  const [hotspots, setHotspots] = useState([]);
  const [fineDetails, setFineDetails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [bins, setBins] = useState([]);
  const [showAddBin, setShowAddBin] = useState(false);
  const [showAddWorker, setShowAddWorker] = useState(false);
  const [binForm, setBinForm] = useState({
    name: "",
    placeName: "",
    latitude: "",
    longitude: "",
    level: 0,
    capacity: 100,
    wasteType: "plastic",
  });
  const [workerForm, setWorkerForm] = useState({ name: "", email: "", password: "", role: "worker" });
  const [locationMethod, setLocationMethod] = useState("manual");
  const [mapCenter] = useState([9.5916, 76.5221]);

  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchData = async () => {
      if (!token) {
        setError("No token found. Please log in.");
        setLoading(false);
        return;
      }

      try {
        const statsResponse = await axios.get(`${import.meta.env.VITE_API_URL}/api/dashboard-stats`, { headers: { Authorization: `Bearer ${token}` } });
        setDashboardStats(statsResponse.data);

        const reportsResponse = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/reports${reportFilter !== "all" ? `?status=${reportFilter}` : ""}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        const transformedReports = reportsResponse.data.map((report) => ({
          id: report._id,
          title: report.title,
          location: report.location || `${report.latitude}, ${report.longitude}`,
          latitude: report.latitude,
          longitude: report.longitude,
          reportedBy: report.user?.name || report.user?.email || "Unknown User",
          status: report.status.toLowerCase(),
          priority: report.severity.toLowerCase(),
          date: new Date(report.createdAt).toLocaleDateString(),
        }));
        setRecentReports(transformedReports);

        const finesResponse = await axios.get(`${import.meta.env.VITE_API_URL}/api/fines`, { headers: { Authorization: `Bearer ${token}` } });
        setFineDetails(finesResponse.data);

        const membersResponse = await axios.get(`${import.meta.env.VITE_API_URL}/api/top-members`, { headers: { Authorization: `Bearer ${token}` } });
        // Client-side filter to ensure only Users are in leaderboard
        const filteredMembers = membersResponse.data.filter(m => m.role !== 'admin' && m.role !== 'worker'); 
        setTopMembers(filteredMembers);

        const hotspotsResponse = await axios.get(`${import.meta.env.VITE_API_URL}/api/reports/hotspots`, { headers: { Authorization: `Bearer ${token}` } });
        setHotspots(hotspotsResponse.data);

        setLoading(false);
      } catch (err) {
        console.error("Fetch Error:", err);
        setLoading(false);
      }
    };

    fetchData();
  }, [token, reportFilter]);

  // Fetch bins
  useEffect(() => {
    const fetchBins = async () => {
      if (mapToggle === "bins" && token) {
        try {
          const binsResponse = await axios.get(`${import.meta.env.VITE_API_URL}/api/bins`, { headers: { Authorization: `Bearer ${token}` } });
          setBins(binsResponse.data);
        } catch (err) {
          console.error("Error fetching bins:", err);
        }
      }
    };
    fetchBins();
  }, [mapToggle, token]);

  const handleAddBin = async (e) => {
    e.preventDefault();
    try {
      await axios.post(
        `${import.meta.env.VITE_API_URL}/api/bins`,
        {
          name: binForm.name,
          placeName: binForm.placeName,
          latitude: parseFloat(binForm.latitude),
          longitude: parseFloat(binForm.longitude),
          level: parseInt(binForm.level),
          capacity: parseInt(binForm.capacity),
          wasteType: binForm.wasteType,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Bin added successfully!");
      setShowAddBin(false);
      setBinForm({ name: "", placeName: "", latitude: "", longitude: "", level: 0, capacity: 100, wasteType: "plastic" });
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add bin");
    }
  };

  const handleAddWorker = async (e) => {
    e.preventDefault();
    try {
      // Use standard register or admin create endpoint. 
      // Using /api/admin/add as it was used in AddAdmin.jsx which likely supports role assignment.
      await axios.post(
        `${import.meta.env.VITE_API_URL}/api/admin/add`, 
        workerForm,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Worker added successfully!");
      setShowAddWorker(false);
      setWorkerForm({ name: "", email: "", password: "", role: "worker" });
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add worker");
    }
  };

  const handleGetCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setBinForm({
            ...binForm,
            latitude: position.coords.latitude.toFixed(6),
            longitude: position.coords.longitude.toFixed(6),
          });
          setLocationMethod("current");
        },
        (error) => toast.error("Failed to get location")
      );
    }
  };

  const getRankIcon = (rank) => {
    if (rank === 1) return <Crown className="w-5 h-5 text-yellow-400" />;
    if (rank === 2) return <Medal className="w-5 h-5 text-gray-300" />;
    if (rank === 3) return <Trophy className="w-5 h-5 text-amber-600" />;
    return <Star className="w-4 h-4 text-emerald-500" />;
  };

  if (loading) return (
    <div className="min-h-screen theme-bg flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"/>
        <p className="text-emerald-400 font-bold uppercase tracking-widest">Loading Dashboard...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen theme-bg theme-text p-4 pt-24 pb-12">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 animate-fade-in-down">
          <div>
            <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
              Command Center
            </h1>
            <p className="text-gray-400 text-sm">Universal Waste Management System v2.0</p>
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
             <button onClick={() => setShowAddWorker(true)} className="glass-panel flex-1 md:flex-initial justify-center px-4 py-2 rounded-xl flex items-center gap-2 border border-emerald-500/30 hover:bg-emerald-500/20 transition-all text-emerald-400 font-bold text-xs">
                <UserPlus size={16}/> Add Worker
             </button>
             <div className="glass-panel px-4 py-2 rounded-full flex items-center gap-2 border border-white/10 hidden sm:flex">
               <Activity className="text-emerald-400 animate-pulse" size={16} />
               <span className="text-xs font-bold text-gray-300">SYSTEM ONLINE</span>
             </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 animate-fade-in-up">
          <StatsCard
            icon={AlertTriangle}
            title="Reports Today"
            value={dashboardStats.reportsToday || 0}
            change={15}
            changeType="up"
            color="bg-orange-500"
            delay={0}
          />
          <StatsCard
            icon={Eye}
            title="Pending Review"
            value={dashboardStats.needReview || 0}
            change={8}
            changeType="down"
            color="bg-amber-500"
            delay={100}
          />
          <StatsCard
            icon={CheckCircle}
            title="Resolved Waste"
            value={dashboardStats.resolvedToday || 0}
            change={23}
            changeType="up"
            color="bg-emerald-500"
            delay={200}
          />
          <StatsCard
            icon={Users}
            title="Active Recyclers"
            value={(dashboardStats.totalActiveUsers || 0).toLocaleString()}
            change={12}
            changeType="up"
            color="bg-blue-500"
            delay={300}
          />
          <StatsCard
            icon={ShoppingBag}
            title="Marketplace Requests"
            value={dashboardStats.pendingMarketplace || 0}
            color="bg-purple-500"
            delay={400}
          />
        </div>


        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-8">
          
          {/* LEFT: Reports & Map */}
          <div className="lg:col-span-2 space-y-8 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
            
            {/* Recent Reports */}
            <div className="glass-panel rounded-2xl border border-white/10 overflow-hidden">
              <div className="p-6 border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <LayoutDashboard className="text-emerald-400" size={20} /> Recent Incidents
                </h3>
                
                {/* Filters */}
                <div className="flex bg-black/20 rounded-xl p-1 gap-1 overflow-x-auto w-fit max-w-full">
                  {["all", "pending", "resolved"].map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setReportFilter(filter)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold uppercase whitespace-nowrap transition-all ${
                        reportFilter === filter
                          ? "bg-white/10 text-white shadow-sm"
                          : "text-gray-500 hover:text-gray-300"
                      }`}
                    >
                      {filter}
                    </button>
                  ))}
                </div>
              </div>

              <div className="max-h-[400px] overflow-y-auto p-4 space-y-3 custom-scrollbar">
                {recentReports.length > 0 ? (
                  recentReports.map(report => (
                    <div key={report.id} className="p-4 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl transition-all group flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-bold text-sm text-gray-200">{report.title}</h4>
                          <StatusBadge status={report.status} />
                        </div>
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                          <MapPin size={10} className="flex-shrink-0" /> {report.location}
                        </p>
                        <p className="text-xs text-gray-600 mt-1">By: {report.reportedBy} • {report.date}</p>
                      </div>
                      <button 
                        onClick={() => navigate(`/admin/report/${report.id}`)}
                        className="p-2 bg-white/5 hover:bg-emerald-500/20 text-gray-400 hover:text-emerald-400 rounded-lg transition-all"
                      >
                        <Eye size={16} />
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-10 text-gray-500">
                    <p>No reports found.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Map Section */}
            <div className="glass-panel rounded-2xl border border-white/10 overflow-hidden">
              <div className="p-6 border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <MapIcon className="text-emerald-400" size={20} /> Waste Grid
                </h3>
                <div className="flex bg-black/20 rounded-xl p-1 gap-1 w-fit">
                   {["heatmap", "bins"].map(mode => (
                     <button
                       key={mode}
                       onClick={() => setMapToggle(mode)}
                       className={`px-3 py-1 rounded-lg text-xs font-bold uppercase transition-all ${
                         mapToggle === mode ? "bg-emerald-500 text-white" : "text-gray-500 hover:text-gray-300"
                       }`}
                     >
                       {mode === 'heatmap' ? 'Heatmap' : 'Smart Bins'}
                     </button>
                   ))}
                </div>
              </div>
              <div className="h-96 relative bg-[#050b14]">
                 {mapToggle === "heatmap" ? (
                   <TrashMap className="w-full h-full" />
                 ) : (
                   <>
                     <BinsMap mapCenter={mapCenter} bins={bins} isEmbedded={true} />
                     <button
                       onClick={() => setShowAddBin(true)}
                       className="absolute top-4 right-4 z-[1000] flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-xl text-xs font-bold hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20"
                     >
                       <Plus size={14} /> Add Bin
                     </button>
                   </>
                 )}
              </div>
            </div>
          </div>

          {/* RIGHT: Sidebar */}
          <div className="space-y-8 animate-fade-in-up" style={{ animationDelay: '400ms' }}>
            
            {/* Top Contributors */}
            <div className="glass-panel rounded-2xl p-6 border border-white/10">
               <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
                 <Trophy className="text-yellow-400" size={20} /> Top Recyclers
               </h3>
               <div className="space-y-4">
                 {topMembers.slice(0, 5).map((member) => (
                   <div key={member.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all">
                      <div className="w-8">{getRankIcon(member.rank)}</div>
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center text-xs font-bold">
                        {member.name.charAt(0)}
                      </div>
                      <div className="flex-1">
                         <p className="text-sm font-bold text-gray-200">{member.name}</p>
                         <p className="text-[10px] text-gray-500">{member.reportsThisMonth} reports</p>
                      </div>
                      <span className="text-xs font-bold text-emerald-400">{member.points} pts</span>
                   </div>
                 ))}
               </div>
            </div>
            
            {/* Hotspot Locations */}
            <div className="glass-panel rounded-2xl p-6 border border-white/10">
               <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
                 <MapPin className="text-red-400" size={20} /> Hotspot Locations
               </h3>
               <div className="space-y-6">
                 {hotspots.length > 0 ? (
                   hotspots.map((spot) => {
                     const maxCount = Math.max(...hotspots.map(h => h.count));
                     const percentage = (spot.count / maxCount) * 100;
                     
                     return (
                       <div key={spot._id} className="space-y-2">
                         <div className="flex justify-between items-center text-xs">
                           <span className="font-bold text-gray-300 truncate max-w-[150px]">{spot._id}</span>
                           <span className="text-red-400 font-black">{spot.count} Reports</span>
                         </div>
                         <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                           <div 
                             className="h-full bg-gradient-to-r from-red-500/50 to-red-500 transition-all duration-1000"
                             style={{ width: `${percentage}%` }}
                           />
                         </div>
                       </div>
                     );
                   })
                 ) : (
                   <div className="text-center py-4 text-gray-500 text-xs">
                     No hotspots detected yet.
                   </div>
                 )}
               </div>
            </div>


          </div>
        </div>

      </div>

      {/* Add Bin Modal */}
      <Modal isOpen={showAddBin} onClose={() => setShowAddBin(false)}>
        <div className="p-6 text-white">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold">Deploy Smart Bin</h3>
            <button onClick={() => setShowAddBin(false)} className="text-gray-500 hover:text-white"><X size={20}/></button>
          </div>
          <form onSubmit={handleAddBin} className="space-y-4">
             <div className="grid grid-cols-2 gap-4">
               <div>
                  <label className="text-xs text-gray-400 font-bold uppercase ml-1">Bin Name</label>
                  <input 
                    type="text" 
                    value={binForm.name} 
                    onChange={e => setBinForm({...binForm, name: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm focus:outline-none focus:border-emerald-500 mt-1"
                    placeholder="e.g. Central Mall Bin"
                  />
               </div>
               <div>
                  <label className="text-xs text-gray-400 font-bold uppercase ml-1">Type</label>
                  <select
                     value={binForm.wasteType}
                     onChange={e => setBinForm({...binForm, wasteType: e.target.value})}
                     className="w-full bg-slate-800 border border-white/10 rounded-xl p-3 text-sm focus:outline-none focus:border-emerald-500 mt-1"
                  >
                     <option value="plastic">Plastic</option>
                     <option value="organic">Organic</option>
                     <option value="glass">Glass</option>
                     <option value="metal">Metal</option>
                     <option value="paper">Paper</option>
                     <option value="electronics">Electronics</option>
                     <option value="hazardous">Hazardous</option>
                     <option value="Mixed">Mixed Waste</option>
                     <option value="Other">Other</option>
                  </select>
               </div>
             </div>
             <div>
                <label className="text-xs text-gray-400 font-bold uppercase ml-1">Location Name</label>
                <input 
                  type="text" 
                  value={binForm.placeName} 
                  onChange={e => setBinForm({...binForm, placeName: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm focus:outline-none focus:border-emerald-500 mt-1"
                  placeholder="e.g. Sector 5 Market"
                />
             </div>
             
             <div className="p-4 bg-white/5 rounded-xl border border-white/10">
               <div className="flex justify-between items-center mb-4">
                 <span className="text-xs font-bold text-gray-400 uppercase">Coordinates</span>
                 <button type="button" onClick={handleGetCurrentLocation} className="text-xs text-emerald-400 font-bold flex items-center gap-1 hover:text-emerald-300">
                   <MapPin size={12}/> Auto-Detect
                 </button>
               </div>
               <div className="grid grid-cols-2 gap-4">
                 <input 
                    type="text"
                    value={binForm.latitude}
                    onChange={e => setBinForm({...binForm, latitude: e.target.value})}
                    placeholder="Lat"
                    className="bg-black/20 border border-white/10 rounded-lg p-2 text-xs"
                 />
                 <input 
                    type="text"
                    value={binForm.longitude}
                    onChange={e => setBinForm({...binForm, longitude: e.target.value})}
                    placeholder="Lng"
                    className="bg-black/20 border border-white/10 rounded-lg p-2 text-xs"
                 />
               </div>
             </div>

             <button type="submit" className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-500/20 mt-2">
               Deploy Bin
             </button>
          </form>
        </div>
      </Modal>

      {/* Add Worker Modal */}
      <Modal isOpen={showAddWorker} onClose={() => setShowAddWorker(false)}>
        <div className="p-6 text-white">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-400">Recruit Field Worker</h3>
            <button onClick={() => setShowAddWorker(false)} className="text-gray-500 hover:text-white"><X size={20}/></button>
          </div>
          <form onSubmit={handleAddWorker} className="space-y-4">
             <div>
                <label className="text-xs text-gray-400 font-bold uppercase ml-1">Name</label>
                <input 
                  type="text" 
                  value={workerForm.name} 
                  onChange={e => setWorkerForm({...workerForm, name: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm focus:outline-none focus:border-emerald-500 mt-1"
                  required
                />
             </div>
             <div>
                <label className="text-xs text-gray-400 font-bold uppercase ml-1">Email</label>
                <input 
                  type="email" 
                  value={workerForm.email} 
                  onChange={e => setWorkerForm({...workerForm, email: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm focus:outline-none focus:border-emerald-500 mt-1"
                  required
                />
             </div>
             <div>
                <label className="text-xs text-gray-400 font-bold uppercase ml-1">Password</label>
                <input 
                  type="password" 
                  value={workerForm.password} 
                  onChange={e => setWorkerForm({...workerForm, password: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm focus:outline-none focus:border-emerald-500 mt-1"
                  required
                />
             </div>
             <button type="submit" className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-500/20 mt-2">
               Create Worker Account
             </button>
          </form>
        </div>
      </Modal>

    </div>
  );
}