import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  MapPin, Award, AlertTriangle, Map as MapIcon, Thermometer, Trash2, Clock, CheckCircle,
  AlertCircle, XCircle, Star, ChevronRight, LogOut, Eye, TrendingUp, Target, Zap, Users,
  Medal, Calendar, Plus, X, Upload, MapPinned, Navigation, Loader, Shield, Activity
} from "lucide-react";
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend,
} from "chart.js";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import TrashMap from "./Heatmap";
import "./index.css";

// --- Green Spot Icon for WasteMap ---
const greenSpotIcon = new L.Icon({
  iconUrl: "https://maps.google.com/mapfiles/ms/icons/green-dot.png",
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

// User location icon
const userLocationIcon = new L.Icon({
  iconUrl: "https://maps.google.com/mapfiles/ms/icons/blue-dot.png",
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

// Modal Component
function Modal({ isOpen, onClose, children }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[2000] overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/80 dark:bg-black/80 light:bg-black/60 backdrop-blur-md transition-opacity" onClick={onClose} />
        <div className="relative glass-panel rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-scale-in theme-border">
          {children}
        </div>
      </div>
    </div>
  );
}

// Report Form Component
function ReportForm({ token, onReportSubmitted, onClose, userLocation }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("report");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [locationName, setLocationName] = useState("");
  const [severity, setSeverity] = useState("Low");
  const [media, setMedia] = useState(null);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (userLocation && userLocation.latitude && userLocation.longitude) {
      setLatitude(userLocation.latitude.toString());
      setLongitude(userLocation.longitude.toString());
      if (userLocation.name) setLocationName(userLocation.name);
    }
  }, [userLocation]);

  const handleUseMyLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLatitude(position.coords.latitude.toString());
          setLongitude(position.coords.longitude.toString());
          fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${position.coords.latitude}&lon=${position.coords.longitude}`)
            .then((res) => res.json())
            .then((data) => {
              if (data.display_name) setLocationName(data.display_name);
            })
            .catch((err) => console.error("Geocoding error:", err));
        },
        () => setError("Unable to get your location. Please enter manually."),
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    } else {
      setError("Geolocation is not supported by your browser.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !description || !type || !media) {
      setError("All fields are required, including media");
      return;
    }

    setIsSubmitting(true);
    const formData = new FormData();
    formData.append("title", title);
    formData.append("description", description);
    formData.append("type", type);
    if (latitude) formData.append("latitude", latitude);
    if (longitude) formData.append("longitude", longitude);
    if (locationName) formData.append("location", locationName);
    if (type === "report") formData.append("severity", severity);
    formData.append("media", media);

    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/reports`, formData, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" },
      });
      onReportSubmitted();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to submit report");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 theme-text">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-400">Submit Waste Incident</h2>
          <p className="text-sm theme-text-muted mt-1">Report improper disposal or request cleanup</p>
        </div>
        <button onClick={onClose} className="p-2 hover:theme-glass-overlay-hover rounded-full transition-colors">
          <X className="w-5 h-5 theme-gray-muted" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="bg-red-500/20 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg text-sm flex items-start gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-5">
          <div className="md:col-span-2">
            <label className="block text-xs font-bold theme-text-muted uppercase ml-1 mb-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full theme-glass-overlay theme-border rounded-xl px-4 py-3 text-sm theme-text focus:border-emerald-500 focus:outline-none transition-colors"
              placeholder="e.g. Pile of plastic bottles or metal scraps"
              required
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-bold theme-text-muted uppercase ml-1 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full theme-glass-overlay theme-border rounded-xl px-4 py-3 text-sm theme-text focus:border-emerald-500 focus:outline-none transition-colors resize-none"
              rows="4"
              placeholder="Provide details about the waste..."
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold theme-text-muted uppercase ml-1 mb-1">Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full theme-glass-overlay theme-border rounded-xl px-4 py-3 text-sm theme-text focus:border-emerald-500 focus:outline-none transition-colors"
            >
              <option value="report">Report Issue</option>
              <option value="cleanup">Cleanup Activity</option>
            </select>
          </div>

          {type === "report" && (
            <div>
              <label className="block text-xs font-bold theme-text-muted uppercase ml-1 mb-1">Severity</label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value)}
                className="w-full theme-glass-overlay theme-border rounded-xl px-4 py-3 text-sm theme-text focus:border-emerald-500 focus:outline-none transition-colors"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>
          )}

          <div className="md:col-span-2">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold theme-text-muted uppercase ml-1">Location</label>
              <button type="button" onClick={handleUseMyLocation} className="flex items-center gap-1 text-xs text-emerald-400 font-bold hover:text-emerald-300">
                <Navigation className="w-3 h-3" /> Use My Location
              </button>
            </div>
            <div className="relative">
              <MapPinned className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 theme-gray-muted" />
              <input
                type="text"
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                className="w-full theme-glass-overlay theme-border rounded-xl pl-11 pr-4 py-3 text-sm theme-text focus:border-emerald-500 focus:outline-none transition-colors"
                placeholder="Enter location name"
              />
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-bold theme-text-muted uppercase ml-1 mb-1">Evidence Upload</label>
            <div className="border-2 border-dashed theme-border rounded-xl p-6 text-center hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-colors">
              <input
                type="file"
                accept="image/*,video/*"
                onChange={(e) => setMedia(e.target.files[0])}
                className="hidden"
                id="media-upload"
                required
              />
              <label htmlFor="media-upload" className="cursor-pointer flex flex-col items-center">
                <Upload className="w-10 h-10 text-emerald-400 mb-2" />
                <span className="text-sm font-medium theme-text-secondary">{media ? media.name : "Click to upload proof"}</span>
              </label>
            </div>
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <button type="button" onClick={onClose} className="flex-1 px-6 py-3 theme-border theme-gray rounded-xl font-bold hover:theme-glass-overlay-hover transition-colors">Cancel</button>
          <button type="submit" disabled={isSubmitting} className="flex-1 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-bold hover:shadow-lg hover:shadow-emerald-500/20 transition-all">
            {isSubmitting ? "Submitting..." : "Submit Report"}
          </button>
        </div>
      </form>
    </div>
  );
}

// Stats Card
function StatsCard({ icon: Icon, label, value, trend, color }) {
  return (
    <div className="glass-panel p-6 rounded-2xl border border-white/10 hover:border-emerald-500/30 transition-all group">
      <div className="flex items-start justify-between">
        <div className={`p-3 rounded-xl bg-white/5 text-white group-hover:bg-emerald-500/20 transition-colors`}>
          <Icon className="w-6 h-6" />
        </div>
        {trend && (
          <div className="flex items-center gap-1 text-emerald-400 text-xs font-bold bg-emerald-500/10 px-2 py-1 rounded-full">
            <TrendingUp className="w-3 h-3" /> {trend}
          </div>
        )}
      </div>
      <div className="mt-4">
        <p className="theme-text-muted text-xs font-bold uppercase tracking-widest">{label}</p>
        <p className="text-3xl font-black theme-text mt-1">{value}</p>
      </div>
    </div>
  );
}

export default function UserDash() {
  const navigate = useNavigate();
  const [mapToggle, setMapToggle] = useState("heatmap");
  const [userStats, setUserStats] = useState({});
  const [recentReports, setRecentReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [userLocation, setUserLocation] = useState(null);

  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchCityDetails = async (lat, lon) => {
      try {
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
        const data = await response.json();
        const addr = data.address || {};
        
        // Dynamic detection of the most relevant place name
        const cityDisplay = addr.city || addr.town || addr.village || addr.suburb || 
                            addr.neighbourhood || addr.hamlet || addr.locality || 
                            data.display_name.split(',')[0] || "My Location";

        setUserLocation({
          latitude: lat,
          longitude: lon,
          name: data.display_name,
          city: cityDisplay
        });
      } catch (err) {
        console.error("Geocoding error:", err);
        setUserLocation(prev => ({ ...prev, city: "Location Detected" }));
      }
    };

    const requestUserLocation = () => {
       if (navigator.geolocation) {
         navigator.geolocation.getCurrentPosition(
           (position) => {
             fetchCityDetails(position.coords.latitude, position.coords.longitude);
           },
           async (error) => {
             console.log("GPS access denied or failed, trying IP fallback...", error.message);
             // FALLBACK: IP-based Geolocation (No city hardcoding)
             try {
               const ipRes = await fetch('https://ipapi.co/json/');
               const ipData = await ipRes.json();
               if (ipData.latitude && ipData.longitude) {
                 setUserLocation({
                   latitude: ipData.latitude,
                   longitude: ipData.longitude,
                   name: `${ipData.city}, ${ipData.region}`,
                   city: ipData.city || "Nearby"
                 });
               }
             } catch (ipErr) {
               console.error("IP Geolocaiton failed:", ipErr);
             }
           },
           { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
         );
       }
    };
    requestUserLocation();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      if (!token) return navigate("/login");
      try {
        const [userRes, reportsRes] = await Promise.all([
          axios.get(`${import.meta.env.VITE_API_URL}/api/user`, { headers: { Authorization: `Bearer ${token}` } }),
          axios.get(`${import.meta.env.VITE_API_URL}/api/reports`, { headers: { Authorization: `Bearer ${token}` } })
        ]);
        setUserStats(userRes.data);
        
        // Filter reports for this user
        const myReports = reportsRes.data.filter(r => r.user?._id === userRes.data.id).slice(0, 5);
        setRecentReports(myReports);
        
        setLoading(false);
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    };
    fetchData();
  }, [token, navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  if (loading) return <div className="min-h-screen theme-bg flex items-center justify-center"><Loader className="animate-spin text-emerald-400" size={40} /></div>;

  return (
    <div className="min-h-screen theme-bg theme-text p-4 pt-24 pb-12">
      
      {/* Header */}
      <div className="max-w-7xl mx-auto flex justify-between items-center mb-8 animate-fade-in-down">
         <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 p-[2px]">
               <div className="w-full h-full rounded-full theme-bg flex items-center justify-center">
                  <span className="text-xl font-bold text-white">{userStats.name?.charAt(0) || "U"}</span>
               </div>
            </div>
            <div>
               <h1 className="text-2xl font-bold theme-text">Welcome, {userStats.name || "Recycler"}</h1>
               <p className="text-sm theme-text-muted flex items-center gap-1"><MapPin size={12}/> {userLocation?.city || "Detecting location..."}</p>
            </div>
         </div>
         <button onClick={handleLogout} className="p-2 theme-glass-overlay hover:bg-red-500/10 theme-gray hover:text-red-400 rounded-xl transition-all"><LogOut size={20}/></button>
      </div>

      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-6 animate-fade-in-up">
           <StatsCard icon={Award} label="Green Credits" value={userStats.totalPoints || 0} trend={`+${userStats.monthlyPoints || 0}`} />
           <StatsCard icon={Zap} label="Impact Score" value={((userStats.totalPoints || 0) / 10).toFixed(1) + " kg"} />
           <StatsCard icon={Target} label="Month Rank" value={`#${userStats.rank || "-"}`} />
           <div className="glass-panel p-6 rounded-2xl flex flex-col justify-center items-center text-center border-2 border-dashed border-emerald-500/30 hover:bg-emerald-500/5 transition-all cursor-pointer theme-border" onClick={() => setIsReportModalOpen(true)}>
              <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/20 mb-2">
                 <Plus className="text-white" size={24} />
              </div>
              <p className="text-sm font-bold text-emerald-400">New Report</p>
           </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
           {/* Map */}
           <div className="lg:col-span-2 glass-panel rounded-2xl theme-border overflow-hidden h-[400px] animate-fade-in-up delay-100">
              <div className="p-4 border-b theme-border flex justify-between items-center theme-glass-overlay">
                 <h3 className="font-bold flex items-center gap-2"><MapIcon className="text-emerald-400" size={18} /> Waste Heatmap</h3>
              </div>
              <TrashMap className="w-full h-full" />
           </div>

           {/* Recent Activity */}
           <div className="glass-panel rounded-2xl theme-border p-6 animate-fade-in-up delay-200">
              <h3 className="font-bold flex items-center gap-2 mb-4"><Activity className="text-blue-400" size={18} /> Recent Activity</h3>
              <div className="space-y-4">
                 {recentReports.length > 0 ? recentReports.map(r => (
                    <div key={r._id} className="p-3 rounded-xl bg-white/5 border border-white/5 flex items-center gap-3 group">
                       <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400"><CheckCircle size={16}/></div>
                       <div className="flex-1">
                          <p className="text-sm font-bold theme-text-secondary">{r.title}</p>
                          <p className="text-[10px] theme-text-muted">{new Date(r.createdAt).toLocaleDateString()}</p>
                       </div>
                       <div className="flex items-center gap-3">
                         <span className="text-xs font-bold text-emerald-500">{r.status}</span>
                         <button onClick={() => navigate(`/user/report/${r._id}`)} className="p-1.5 theme-glass-overlay rounded-lg theme-gray hover:text-emerald-400 hover:bg-emerald-500/20 transition-all opacity-50 group-hover:opacity-100">
                            <Eye size={14}/>
                         </button>
                       </div>
                    </div>
                 )) : <p className="theme-text-muted text-center py-4">No recent activity.</p>}
              </div>
           </div>
        </div>
      </div>

      <Modal isOpen={isReportModalOpen} onClose={() => setIsReportModalOpen(false)}>
         <ReportForm token={token} onClose={() => setIsReportModalOpen(false)} onReportSubmitted={() => {
            setIsReportModalOpen(false);
            window.location.reload(); 
         }} userLocation={userLocation} />
      </Modal>

    </div>
  );
}
