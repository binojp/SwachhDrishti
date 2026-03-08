import React, { useState, useEffect } from "react";
import axios from "axios";
import { 
  MapPin, Calendar, Clock, Tag, Users, CheckCircle, 
  ChevronRight, Search, Filter, Loader, Navigation, AlertCircle 
} from "lucide-react";
import toast from "react-hot-toast";
import "./index.css";

// Haversine formula to calculate distance between two coordinates in km
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const deg2rad = (deg) => deg * (Math.PI / 180);

export default function Campaigns() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState(null);
  const [filterRange, setFilterRange] = useState(10); // Default 10km
  const [searchQuery, setSearchQuery] = useState("");
  const [joiningId, setJoiningId] = useState(null);

  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  useEffect(() => {
    // Get user's current location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lon: position.coords.longitude,
          });
        },
        (error) => {
          console.error("Error getting location:", error);
          toast.error("Could not get your location. Proximity filtering may not work accurately.");
        }
      );
    }
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/campaigns`);
      setCampaigns(response.data);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching campaigns:", err);
      toast.error("Failed to load campaigns.");
      setLoading(false);
    }
  };

  const handleJoin = async (campaignId) => {
    if (!token) {
      toast.error("Please log in to join campaigns.");
      return;
    }
    setJoiningId(campaignId);
    try {
      await axios.post(
        `${import.meta.env.VITE_API_URL}/api/campaigns/${campaignId}/join`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Joined campaign successfully!");
      fetchCampaigns(); // Refresh to update participant count and status
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to join campaign.");
    } finally {
      setJoiningId(null);
    }
  };

  const filteredCampaigns = campaigns.filter((campaign) => {
    const matchesSearch = campaign.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         campaign.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (userLocation && filterRange > 0) {
      const distance = calculateDistance(
        userLocation.lat,
        userLocation.lon,
        campaign.location.latitude,
        campaign.location.longitude
      );
      return matchesSearch && distance <= filterRange;
    }
    return matchesSearch;
  });

  if (loading) {
    return (
      <div className="min-h-screen theme-bg flex items-center justify-center">
        <Loader className="animate-spin text-emerald-400" size={40} />
      </div>
    );
  }

  return (
    <div className="min-h-screen theme-bg theme-text p-4 pt-24 pb-12">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400 mb-2">
              Community Campaigns
            </h1>
            <p className="text-gray-400">Join local environmental initiatives and earn points.</p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
              <input
                type="text"
                placeholder="Search campaigns..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-emerald-500 w-full md:w-64"
              />
            </div>
            
            <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-4 py-2">
              <Navigation size={18} className="text-emerald-400" />
              <select 
                value={filterRange}
                onChange={(e) => setFilterRange(Number(e.target.value))}
                className="bg-transparent focus:outline-none text-sm font-bold"
              >
                <option value={5}>Within 5km</option>
                <option value={10}>Within 10km</option>
                <option value={20}>Within 20km</option>
                <option value={50}>Within 50km</option>
                <option value={0}>All Areas</option>
              </select>
            </div>
          </div>
        </div>

        {filteredCampaigns.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredCampaigns.map((campaign, idx) => {
              const distance = userLocation 
                ? calculateDistance(userLocation.lat, userLocation.lon, campaign.location.latitude, campaign.location.longitude).toFixed(1)
                : null;
              
              const isParticipant = campaign.participants.some(p => p.user?.toString() === user.id || p.user?._id === user.id);
              const isPresent = campaign.participants.some(p => (p.user?.toString() === user.id || p.user?._id === user.id) && p.status === "Present");

              return (
                <div 
                  key={campaign._id} 
                  className="glass-panel rounded-2xl border border-white/10 overflow-hidden group hover:border-emerald-500/50 transition-all duration-300 flex flex-col animate-fade-in-up"
                  style={{ animationDelay: `${idx * 100}ms` }}
                >
                  <div className="relative h-48 bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 flex items-center justify-center overflow-hidden">
                    <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-all" />
                    <div className="relative z-10 text-center p-6">
                      <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 backdrop-blur-md border border-white/20 flex items-center justify-center mx-auto mb-4">
                        <Calendar className="text-emerald-400" size={32} />
                      </div>
                      <span className="px-3 py-1 rounded-full bg-emerald-500 text-white text-[10px] font-bold uppercase tracking-widest">
                        {campaign.type}
                      </span>
                    </div>
                  </div>

                  <div className="p-6 flex-1 flex flex-col">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-xl font-bold group-hover:text-emerald-400 transition-colors uppercase">{campaign.name}</h3>
                      <div className="text-right">
                        <p className="text-emerald-400 font-black">+{campaign.pointsAwarded} pts</p>
                      </div>
                    </div>

                    <p className="text-gray-400 text-sm mb-6 line-clamp-2">{campaign.description}</p>

                    <div className="space-y-3 mb-8">
                      <div className="flex items-center gap-3 text-sm text-gray-300">
                        <MapPin size={16} className="text-emerald-400" />
                        <span>{campaign.location.address} {distance && <span className="text-gray-500 text-xs text-nowrap">({distance} km away)</span>}</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-gray-300">
                        <Clock size={16} className="text-emerald-400" />
                        <span>{new Date(campaign.date).toLocaleDateString()} at {campaign.time}</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-gray-300">
                        <Users size={16} className="text-emerald-400" />
                        <span>{campaign.participants.length} joined</span>
                      </div>
                    </div>

                    <div className="mt-auto">
                      {isPresent ? (
                        <div className="w-full py-3 bg-emerald-500/20 border border-emerald-500/50 text-emerald-400 rounded-xl font-bold flex items-center justify-center gap-2">
                          <CheckCircle size={18} /> Points Credited
                        </div>
                      ) : isParticipant ? (
                        <div className="w-full py-3 bg-white/5 border border-white/10 text-gray-400 rounded-xl font-bold flex items-center justify-center gap-2">
                          <CheckCircle size={18} /> Already Joined
                        </div>
                      ) : (
                        <button
                          onClick={() => handleJoin(campaign._id)}
                          disabled={joiningId === campaign._id}
                          className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
                        >
                          {joiningId === campaign._id ? "Joining..." : "Join Campaign"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-20 glass-panel rounded-3xl border border-white/10">
            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle size={40} className="text-gray-500" />
            </div>
            <h3 className="text-2xl font-bold mb-2">No campaigns found</h3>
            <p className="text-gray-500">Try adjusting your search or range filters.</p>
          </div>
        )}
      </div>
    </div>
  );
}
