import React, { useState, useEffect } from "react";
import axios from "axios";
import { 
  Plus, Calendar, Clock, MapPin, Users, CheckCircle, Search, 
  X, Loader, ArrowRight, UserCheck, UserMinus, Shield, Star,
  Trash2, Edit3, Filter, ChevronRight
} from "lucide-react";
import toast from "react-hot-toast";
import "./index.css";

// Modal Component
function Modal({ isOpen, onClose, children }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[2000] overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity" onClick={onClose} />
        <div className="relative glass-panel rounded-2xl shadow-2xl max-w-2xl w-full animate-scale-in border border-white/10" onClick={(e) => e.stopPropagation()}>
          {children}
        </div>
      </div>
    </div>
  );
}

export default function AdminCampaigns() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [participantSearch, setParticipantSearch] = useState("");
  const [loadingParticipants, setLoadingParticipants] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    date: "",
    time: "",
    type: "Cleanup",
    pointsAwarded: 50,
    location: {
      address: "",
      latitude: "",
      longitude: ""
    }
  });

  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/campaigns`);
      setCampaigns(response.data);
      setLoading(false);
    } catch (err) {
      console.error("Error:", err);
      toast.error("Failed to load campaigns.");
      setLoading(false);
    }
  };

  const handleCreateCampaign = async (e) => {
    e.preventDefault();
    try {
      await axios.post(
        `${import.meta.env.VITE_API_URL}/api/campaigns`,
        {
          ...formData,
          location: {
            ...formData.location,
            latitude: parseFloat(formData.location.latitude),
            longitude: parseFloat(formData.location.longitude)
          }
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Campaign created successfully!");
      setShowAddModal(false);
      resetForm();
      fetchCampaigns();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create campaign.");
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      date: "",
      time: "",
      type: "Cleanup",
      pointsAwarded: 50,
      location: { address: "", latitude: "", longitude: "" }
    });
  };

  const viewParticipants = async (campaign) => {
    setSelectedCampaign(campaign);
    setLoadingParticipants(true);
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/campaigns/${campaign._id}/participants`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setParticipants(response.data);
    } catch (err) {
      toast.error("Failed to load participants.");
    } finally {
      setLoadingParticipants(false);
    }
  };

  const markPresent = async (userId) => {
    try {
      await axios.post(
        `${import.meta.env.VITE_API_URL}/api/campaigns/${selectedCampaign._id}/mark-present`,
        { userId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Participant marked as present!");
      // Update local state
      setParticipants(prev => 
        prev.map(p => p.user._id === userId ? { ...p, status: "Present" } : p)
      );
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update status.");
    }
  };

  const filteredParticipants = participants.filter(p => 
    p.user.name.toLowerCase().includes(participantSearch.toLowerCase()) ||
    p.user.email.toLowerCase().includes(participantSearch.toLowerCase())
  );

  const getLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData({
            ...formData,
            location: {
              ...formData.location,
              latitude: position.coords.latitude.toFixed(6),
              longitude: position.coords.longitude.toFixed(6)
            }
          });
          toast.success("Location detected!");
        },
        () => toast.error("Failed to get location.")
      );
    }
  };

  if (loading) return <div className="min-h-screen theme-bg flex items-center justify-center"><Loader className="animate-spin text-emerald-400" size={40} /></div>;

  return (
    <div className="min-h-screen theme-bg theme-text p-4 pt-24 pb-12">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
              Campaign Management
            </h1>
            <p className="text-gray-400 text-sm">Create and oversee community environmental initiatives.</p>
          </div>
          <button 
            onClick={() => setShowAddModal(true)}
            className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-2 w-full md:w-auto justify-center"
          >
            <Plus size={20} /> Create Campaign
          </button>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Campaigns List */}
          <div className="lg:col-span-2 space-y-4">
            <div className="glass-panel rounded-2xl border border-white/10 overflow-hidden">
              <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
                <h3 className="font-bold flex items-center gap-2"><Calendar className="text-emerald-400" size={20} /> Active Campaigns</h3>
                <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">{campaigns.length} total</span>
              </div>
              <div className="divide-y divide-white/5">
                {campaigns.map(campaign => (
                  <div 
                    key={campaign._id} 
                    className={`p-6 hover:bg-white/5 transition-all cursor-pointer group ${selectedCampaign?._id === campaign._id ? 'bg-emerald-500/5' : ''}`}
                    onClick={() => viewParticipants(campaign)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-lg group-hover:text-emerald-400 transition-colors uppercase">{campaign.name}</h4>
                        <div className="flex flex-wrap gap-4 mt-2">
                          <span className="text-xs text-gray-400 flex items-center gap-1"><MapPin size={12}/> {campaign.location.address}</span>
                          <span className="text-xs text-gray-400 flex items-center gap-1"><Clock size={12}/> {new Date(campaign.date).toLocaleDateString()}</span>
                          <span className="text-xs text-gray-400 flex items-center gap-1"><Users size={12}/> {campaign.participants.length} joined</span>
                        </div>
                      </div>
                      <ChevronRight className={`text-gray-600 group-hover:text-emerald-400 transition-all ${selectedCampaign?._id === campaign._id ? 'rotate-90 text-emerald-400' : ''}`} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Participant Management */}
          <div className="lg:col-span-1">
            {selectedCampaign ? (
              <div className="glass-panel rounded-2xl border border-white/10 overflow-hidden sticky top-24">
                <div className="p-6 border-b border-white/10 bg-white/5">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="font-bold uppercase tracking-wider text-emerald-400">Participants</h3>
                    <X size={20} className="text-gray-500 cursor-pointer hover:text-white" onClick={() => setSelectedCampaign(null)}/>
                  </div>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                    <input 
                      type="text"
                      placeholder="Search users..."
                      value={participantSearch}
                      onChange={(e) => setParticipantSearch(e.target.value)}
                      className="w-full bg-black/20 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-xs focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="p-4 max-h-[500px] overflow-y-auto space-y-3 custom-scrollbar">
                  {loadingParticipants ? (
                    <div className="flex justify-center py-10"><Loader className="animate-spin text-emerald-400" /></div>
                  ) : filteredParticipants.length > 0 ? (
                    filteredParticipants.map(p => (
                      <div key={p._id} className="p-4 bg-white/5 rounded-xl border border-white/5 flex items-center justify-between group">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-xs font-bold text-emerald-400 uppercase">
                            {p.user.name.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-bold">{p.user.name}</p>
                            <span className="text-[10px] text-gray-500">{p.status === 'Present' ? 'CREDIT AWARDED' : 'JOINED'}</span>
                          </div>
                        </div>
                        {p.status === "Present" ? (
                          <div className="p-1 px-2 rounded-full bg-emerald-500/20 text-emerald-400">
                             <CheckCircle size={14} />
                          </div>
                        ) : (
                          <button 
                            onClick={() => markPresent(p.user._id)}
                            className="p-2 opacity-0 group-hover:opacity-100 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-all text-[10px] font-bold"
                          >
                             MARK PRESENT
                          </button>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-center py-10 text-gray-500 text-sm">No participants found.</p>
                  )}
                </div>
              </div>
            ) : (
              <div className="glass-panel rounded-2xl border-2 border-dashed border-white/5 p-12 text-center text-gray-600 flex flex-col items-center justify-center h-full">
                <Users size={48} className="mb-4 opacity-20" />
                <p className="text-sm">Select a campaign to manage participants and award points.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Campaign Modal */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)}>
        <div className="p-8">
          <div className="flex justify-between items-center mb-8">
             <h3 className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-400 uppercase">New Campaign</h3>
             <X size={24} className="text-gray-500 cursor-pointer hover:text-white" onClick={() => setShowAddModal(false)} />
          </div>

          <form onSubmit={handleCreateCampaign} className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Campaign Name</label>
                <input 
                  type="text" 
                  required
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-sm focus:outline-none focus:border-emerald-500 mt-1"
                  placeholder="e.g. Green Earth Cleanup"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Description</label>
                <textarea 
                  required
                  rows="3"
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-sm focus:outline-none focus:border-emerald-500 mt-1 resize-none"
                  placeholder="Describe the goals and activity..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Date</label>
                  <input 
                    type="date" 
                    required
                    value={formData.date}
                    onChange={e => setFormData({...formData, date: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-sm focus:outline-none focus:border-emerald-500 mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Time</label>
                  <input 
                    type="time" 
                    required
                    value={formData.time}
                    onChange={e => setFormData({...formData, time: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-sm focus:outline-none focus:border-emerald-500 mt-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Type</label>
                  <select 
                    value={formData.type}
                    onChange={e => setFormData({...formData, type: e.target.value})}
                    className="w-full bg-slate-800 border border-white/10 rounded-xl p-4 text-sm focus:outline-none focus:border-emerald-500 mt-1"
                  >
                    <option value="Cleanup">Cleanup</option>
                    <option value="Awareness">Awareness</option>
                    <option value="Tree Plantation">Tree Plantation</option>
                    <option value="Waste Collection">Waste Collection</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Points Bonus</label>
                  <input 
                    type="number" 
                    value={formData.pointsAwarded}
                    onChange={e => setFormData({...formData, pointsAwarded: parseInt(e.target.value)})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-sm focus:outline-none focus:border-emerald-500 mt-1"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Location Address</label>
                <input 
                  type="text" 
                  required
                  value={formData.location.address}
                  onChange={e => setFormData({...formData, location: {...formData.location, address: e.target.value}})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-sm focus:outline-none focus:border-emerald-500 mt-1"
                  placeholder="Street name, City..."
                />
              </div>

              <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                 <div className="flex justify-between items-center mb-4">
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Coordinates</span>
                    <button type="button" onClick={getLocation} className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-1 hover:text-emerald-300">
                      <MapPin size={12}/> Auto-Detect
                    </button>
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <input 
                      type="text" 
                      placeholder="Latitude"
                      required
                      value={formData.location.latitude}
                      onChange={e => setFormData({...formData, location: {...formData.location, latitude: e.target.value}})}
                      className="bg-black/40 border border-white/10 rounded-lg p-3 text-xs focus:border-emerald-500 outline-none"
                    />
                    <input 
                      type="text" 
                      placeholder="Longitude"
                      required
                      value={formData.location.longitude}
                      onChange={e => setFormData({...formData, location: {...formData.location, longitude: e.target.value}})}
                      className="bg-black/40 border border-white/10 rounded-lg p-3 text-xs focus:border-emerald-500 outline-none"
                    />
                 </div>
              </div>
            </div>

            <button type="submit" className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-xl transition-all shadow-xl shadow-emerald-500/20 uppercase tracking-widest mt-4">
              Publish Campaign
            </button>
          </form>
        </div>
      </Modal>
    </div>
  );
}
