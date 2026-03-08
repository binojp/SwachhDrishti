import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { MapPin, Home, Calendar, Plus, X, LoaderCircle, Zap, Shield, Award, Leaf } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import {
  MapContainer,
  Marker,
  Popup,
  useMapEvents,
} from "react-leaflet";
import ThemeAwareTileLayer from "../components/ThemeAwareTileLayer";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./index.css";

// Fix Leaflet marker icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const LocationPicker = ({ setLocation, setLocationName }) => {
  const [position, setPosition] = useState(null);

  const MapClickHandler = () => {
    const map = useMapEvents({
      click(e) {
        const { lat, lng } = e.latlng;
        setPosition([lat, lng]);
        setLocation({ lat, lon: lng });
        map.setView([lat, lng], 13);
        axios
          .get(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
          )
          .then((response) => {
            const address = response.data.display_name || "Unknown location";
            setLocationName(address);
          })
          .catch(() => setLocationName("Unable to fetch location name"));
      },
    });
    return position ? (
      <Marker position={position}>
        <Popup>Selected Location</Popup>
      </Marker>
    ) : null;
  };

  return <MapClickHandler />;
};

export default function Profile() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [homeAddress, setHomeAddress] = useState(null);
  const [collections, setCollections] = useState([]);
  const [showAddHome, setShowAddHome] = useState(false);
  const [showScheduleCollection, setShowScheduleCollection] = useState(false);
  const [location, setLocation] = useState(null);
  const [locationName, setLocationName] = useState("");
  const [userData, setUserData] = useState(null);
  const [formData, setFormData] = useState({
    address: "",
    city: "",
    pincode: "",
    scheduledDate: "",
    wasteType: "electronics",
    notes: "",
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    try {
      const [homeRes, collectionsRes, userRes] = await Promise.all([
        axios.get(`${import.meta.env.VITE_API_URL}/api/profile/home`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${import.meta.env.VITE_API_URL}/api/profile/collections`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${import.meta.env.VITE_API_URL}/api/user`, { headers: { Authorization: `Bearer ${token}` } })
      ]);

      if (homeRes.data.homeAddress) {
        setHomeAddress(homeRes.data.homeAddress);
        setFormData((prev) => ({
          ...prev,
          address: homeRes.data.homeAddress.address || "",
          city: homeRes.data.homeAddress.city || "",
          pincode: homeRes.data.homeAddress.pincode || "",
        }));
      }
      setCollections(collectionsRes.data);
      setUserData(userRes.data);
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleTrackLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setLocation({ lat: latitude, lon: longitude });
        try {
          const res = await axios.get(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`);
          const address = res.data.display_name || "Detected Location";
          setLocationName(address);
          setFormData((prev) => ({ ...prev, address }));
        } catch (err) {
          setLocationName(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
        }
      },
      async (error) => {
        console.log("GPS failed, trying IP fallback...");
        try {
          const ipRes = await fetch('https://ipapi.co/json/');
          const ipData = await ipRes.json();
          if (ipData.latitude && ipData.longitude) {
            const lat = ipData.latitude;
            const lon = ipData.longitude;
            setLocation({ lat, lon });
            const addr = `${ipData.city}, ${ipData.region}, ${ipData.country_name}`;
            setLocationName(addr);
            setFormData((prev) => ({ ...prev, address: addr, city: ipData.city }));
            toast.success("Location estimated via network");
          } else {
            toast.error("Could not detect location. Please select on map.");
          }
        } catch (ipErr) {
          toast.error("Error getting location. Please select on map.");
        }
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const handleAddHome = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");

    if (!formData.address.trim()) {
      setErrors({ address: "Address is required" });
      return;
    }

    try {
      await axios.post(
        `${import.meta.env.VITE_API_URL}/api/profile/home`,
        {
          address: formData.address,
          city: formData.city,
          pincode: formData.pincode,
          latitude: location?.lat,
          longitude: location?.lon,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success("Home address updated successfully!");
      setShowAddHome(false);
      fetchData();
    } catch (err) {
      console.error("Error adding home:", err);
      setErrors({ server: err.response?.data?.message || "Failed to add home address" });
    }
  };

  const handleScheduleCollection = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");

    if (!formData.scheduledDate) {
      setErrors({ scheduledDate: "Scheduled date is required" });
      return;
    }

    try {
      await axios.post(
        `${import.meta.env.VITE_API_URL}/api/profile/collection`,
        {
          scheduledDate: formData.scheduledDate,
          wasteType: formData.wasteType,
          notes: formData.notes,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success("Collection scheduled successfully!");
      setShowScheduleCollection(false);
      setFormData((prev) => ({ ...prev, scheduledDate: "", wasteType: "electronics", notes: "" }));
      fetchData();
    } catch (err) {
      console.error("Error scheduling collection:", err);
      setErrors({ server: err.response?.data?.message || "Failed to schedule collection" });
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      Scheduled: "bg-blue-500/20 text-blue-400 border-blue-500/50",
      Assigned: "bg-yellow-500/20 text-yellow-400 border-yellow-500/50",
      "In Progress": "bg-purple-500/20 text-purple-400 border-purple-500/50",
      Completed: "bg-emerald-500/20 text-emerald-400 border-emerald-500/50",
      Cancelled: "bg-red-500/20 text-red-400 border-red-500/50",
    };
    return colors[status] || "bg-gray-500/20 text-gray-400 border-gray-500/50";
  };

  if (loading) {
    return (
      <div className="min-h-screen theme-bg flex items-center justify-center">
        <LoaderCircle className="animate-spin text-emerald-400" size={48} />
      </div>
    );
  }

  const badges = [
    { name: "Recycling Rookie", description: "First item recycled", earned: (userData?.totalPoints || 0) > 0, icon: Leaf },
    { name: "Waste Warrior", description: "500+ Green Credits", earned: (userData?.totalPoints || 0) >= 500, icon: Zap },
    { name: "Carbon Crusher", description: "1000+ Green Credits", earned: (userData?.totalPoints || 0) >= 1000, icon: Shield },
    { name: "Planet Protector", description: "2000+ Green Credits", earned: (userData?.totalPoints || 0) >= 2000, icon: Award },
  ];

  return (
    <div className="min-h-screen theme-bg theme-text p-4 pt-24 pb-28 md:pb-24 overflow-x-hidden">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN: Profile & Status */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* USER CARD */}
          <div className="glass-panel p-6 rounded-3xl text-center relative overflow-hidden group">
            <div className="absolute inset-0 bg-emerald-500/10 blur-3xl group-hover:bg-emerald-500/20 transition-all opacity-50" />
            <div className="relative">
              <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 p-1 mb-4 shadow-lg shadow-emerald-500/30">
                <div className="w-full h-full rounded-full theme-bg flex items-center justify-center">
                   <span className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-500">
                     {userData?.name?.charAt(0).toUpperCase() || "U"}
                   </span>
                </div>
              </div>
              <h2 className={`text-xl font-bold bg-clip-text text-transparent ${theme === 'dark' ? 'bg-gradient-to-r from-white to-gray-300' : 'bg-gradient-to-r from-gray-900 to-gray-600'}`}>
                 {userData?.name || "Recycler"}
              </h2>
              <p className="text-xs text-emerald-400 font-bold tracking-widest uppercase mt-1">Level {(userData?.totalPoints || 0) > 1000 ? "Pro" : "Novice"}</p>
              
              <div className="mt-6 grid grid-cols-2 border-t border-white/10 pt-4 divide-x divide-white/10">
                 <div className="text-center pr-3">
                    <p className="text-xl md:text-2xl font-bold text-white">{userData?.totalPoints || 0}</p>
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider">Credits</p>
                 </div>
                 <div className="text-center pl-3">
                    <p className="text-xl md:text-2xl font-bold text-emerald-400">{((userData?.totalPoints || 0) / 10).toFixed(1)}</p>
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider">Kg CO₂</p>
                 </div>
              </div>
            </div>
          </div>

          {/* BADGES */}
          <div className="glass-panel p-6 rounded-3xl">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Achievements</h3>
            <div className="grid grid-cols-2 gap-3">
              {badges.map((badge) => (
                <div 
                  key={badge.name} 
                  className={`p-3 rounded-xl border flex flex-col items-center text-center gap-2 transition-all hover:scale-[1.02] ${
                    badge.earned 
                    ? "bg-emerald-500/10 border-emerald-500/30 theme-text" 
                    : "theme-glass-overlay theme-border theme-text-muted grayscale opacity-50"
                  }`}
                >
                  <badge.icon size={18} className={badge.earned ? "text-emerald-400" : "theme-text-muted"} />
                  <div className="min-w-0">
                    <p className="text-[10px] md:text-xs font-bold leading-tight truncate">{badge.name}</p>
                    {badge.earned && <p className="text-[8px] md:text-[10px] text-emerald-500/80 mt-1 font-medium">Unlocked</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* RECYCLING HUB - PREMIUM STYLING */}
          <div className="glass-panel p-6 rounded-3xl relative overflow-hidden group hover:border-emerald-500/30 transition-all">
             <div className="absolute top-[-20px] right-[-20px] opacity-[0.03] rotate-12 group-hover:rotate-6 transition-transform">
                <Home size={180} />
             </div>

             <div className="relative z-10">
               <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="font-bold text-xl flex items-center gap-2">
                       <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg">
                          <MapPin size={18} />
                       </div>
                       Recycling Hub
                    </h3>
                    <p className="text-xs text-gray-400 mt-1">Pickup point for your collections</p>
                  </div>
                  <button 
                    onClick={() => setShowAddHome(true)} 
                    className="px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-bold rounded-xl border border-emerald-500/30 transition-all hover:scale-105"
                  >
                    {homeAddress ? "Update" : "Add Address"}
                  </button>
               </div>
               
               {homeAddress ? (
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white/5 border border-white/5 p-5 rounded-2xl backdrop-blur-sm">
                       <p className="text-[10px] uppercase font-bold text-emerald-500/60 mb-2 tracking-widest leading-none">Primary Address</p>
                       <p className="text-sm font-medium theme-text-secondary leading-relaxed">{homeAddress.address}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                       <div className="bg-white/5 border border-white/5 p-4 rounded-2xl flex flex-col justify-center">
                          <p className="text-[10px] uppercase font-bold text-gray-500 mb-1 tracking-widest">City</p>
                          <p className="text-sm font-bold theme-text">{homeAddress.city}</p>
                       </div>
                       <div className="bg-white/5 border border-white/5 p-4 rounded-2xl flex flex-col justify-center">
                          <p className="text-[10px] uppercase font-bold text-gray-500 mb-1 tracking-widest">ZIP Code</p>
                          <p className="text-sm font-bold theme-text">{homeAddress.pincode}</p>
                       </div>
                    </div>
                 </div>
               ) : (
                  <div className="text-center py-8 border-2 border-dashed border-white/10 rounded-2xl bg-white/5">
                    <p className="text-gray-400 text-sm">No address configured. Add one to enable pickups.</p>
                  </div>
               )}
             </div>
          </div>

          {/* COLLECTIONS LIST */}
          <div className="glass-panel p-6 rounded-3xl min-h-[400px]">
               <div className="flex justify-between items-center mb-6">
                  <h3 className="font-bold text-lg flex items-center gap-2">
                    <Calendar size={20} className="text-emerald-400" /> Pickups
                  </h3>
                  {homeAddress && (
                    <button onClick={() => setShowScheduleCollection(true)} className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 hover:-translate-y-1 transition-all">
                      + Schedule Pickup
                    </button>
                  )}
               </div>

               <div className="space-y-3">
                  {collections.length > 0 ? (
                    collections.map((col) => (
                      <div key={col._id} className="p-4 theme-glass-overlay border theme-border rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-white/10 transition-all">
                         <div className="flex gap-4 items-center w-full sm:w-auto">
                            <div className="text-center theme-glass-overlay p-2 rounded-lg min-w-[50px]">
                              <p className="text-[10px] font-bold theme-text-muted uppercase leading-tight">{new Date(col.scheduledDate).toLocaleString('default', { month: 'short' })}</p>
                              <p className="text-lg font-black theme-text leading-tight">{new Date(col.scheduledDate).getDate()}</p>
                            </div>
                            <div className="flex-1 min-w-0">
                               <p className="font-bold text-sm theme-text capitalize truncate">{col.wasteType} Collection</p>
                               <p className="text-xs theme-text-muted line-clamp-1">{col.notes || "No additional notes"}</p>
                            </div>
                         </div>
                         <div className="w-full sm:w-auto flex justify-end">
                            <span className={`px-3 py-1 text-[9px] font-bold uppercase rounded-full border whitespace-nowrap ${getStatusColor(col.status)}`}>
                              {col.status}
                            </span>
                         </div>
                      </div>
                    ))
                 ) : (
                    <div className="text-center py-12">
                      <p className="theme-text-muted text-sm">No active pickups. Schedule one to get started!</p>
                    </div>
                 )}
               </div>
            </div>
        </div>
      </div>

      {/* MODALS */}
      {showAddHome && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[1000] p-4">
          <div className="glass-panel w-full max-w-md p-6 rounded-3xl border theme-border">
            <h3 className="text-xl font-bold theme-text mb-4">My Waste Hub</h3>
            <form onSubmit={handleAddHome} className="space-y-4">
              <textarea 
                placeholder="Street Address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full theme-glass-overlay border theme-border rounded-xl p-3 theme-text placeholder:theme-text-muted focus:outline-none focus:border-emerald-500"
                required
              />
              <div className="grid grid-cols-2 gap-3">
                 <input 
                   placeholder="City"
                   value={formData.city}
                   onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                   className="w-full theme-glass-overlay border theme-border rounded-xl p-3 theme-text placeholder:theme-text-muted focus:outline-none focus:border-emerald-500"
                 />
                 <input 
                   placeholder="Pincode"
                   value={formData.pincode}
                   onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                   className="w-full theme-glass-overlay border theme-border rounded-xl p-3 theme-text placeholder:theme-text-muted focus:outline-none focus:border-emerald-500"
                 />
              </div>
              
              <button type="button" onClick={handleTrackLocation} className="w-full py-3 theme-glass-overlay hover:bg-emerald-500/10 border theme-border rounded-xl text-emerald-500 text-xs font-bold flex items-center justify-center gap-2">
                 <MapPin size={16} /> Auto-Detect Location
              </button>
              
              {location && (
                  <div className="h-40 rounded-xl overflow-hidden border theme-border">
                    <MapContainer
                      center={[location.lat, location.lon]}
                      zoom={13}
                      style={{ height: "100%", width: "100%" }}
                    >
                      <ThemeAwareTileLayer />
                      <LocationPicker setLocation={setLocation} setLocationName={setLocationName} />
                    </MapContainer>
                  </div>
              )}

              <div className="flex gap-3 mt-4">
                <button type="button" onClick={() => setShowAddHome(false)} className="flex-1 py-3 theme-glass-overlay theme-text-muted font-bold rounded-xl hover:bg-white/10">Cancel</button>
                <button type="submit" className="flex-1 py-3 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-600">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showScheduleCollection && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[1000] p-4">
          <div className="glass-panel w-full max-w-md p-6 rounded-3xl border theme-border">
            <h3 className="text-xl font-bold theme-text mb-4">Schedule Pickup</h3>
            <form onSubmit={handleScheduleCollection} className="space-y-4">
              <div>
                <label className="text-xs theme-text-muted font-bold uppercase ml-1">Date</label>
                <input 
                  type="datetime-local"
                  value={formData.scheduledDate}
                  onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                  className="w-full theme-glass-overlay border theme-border rounded-xl p-3 theme-text mt-1 focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs theme-text-muted font-bold uppercase ml-1">Waste Type</label>
                  <select 
                    value={formData.wasteType}
                    onChange={(e) => setFormData({ ...formData, wasteType: e.target.value })}
                    className="w-full theme-glass-overlay border theme-border rounded-xl p-3 theme-text mt-1 focus:outline-none focus:border-emerald-500"
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

              <textarea 
                  placeholder="Notes (e.g., Heavy items, call before arrival)"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full theme-glass-overlay border theme-border rounded-xl p-3 theme-text placeholder:theme-text-muted focus:outline-none focus:border-emerald-500"
                  rows={3}
              />

              <div className="flex gap-3 mt-4">
                <button type="button" onClick={() => setShowScheduleCollection(false)} className="flex-1 py-3 theme-glass-overlay theme-text-muted font-bold rounded-xl hover:bg-white/10">Cancel</button>
                <button type="submit" className="flex-1 py-3 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-600">Confirm Pickup</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
