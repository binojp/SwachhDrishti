import React, { useEffect, useState, useMemo, useRef } from "react";
import axios from "axios";
import { 
  RefreshCw, Battery, Smartphone, Laptop, Trash2, Zap, Cpu, 
  Navigation, MapPin, ChevronRight, List, Map as MapIcon, 
  Clock, CheckCircle, Info, ArrowLeft, Play, X, Leaf
} from "lucide-react";
import { MapContainer, Marker, Popup, useMap, useMapEvents } from "react-leaflet";
import ThemeAwareTileLayer from "../components/ThemeAwareTileLayer";
import L from "leaflet";
import "leaflet-routing-machine";
import "leaflet-routing-machine/dist/leaflet-routing-machine.css";
import { renderToStaticMarkup } from "react-dom/server";
import "leaflet/dist/leaflet.css";
// --- MAP RESIZER ---
const MapResizer = () => {
  const map = useMap();
  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 500);
    return () => clearTimeout(timer);
  }, [map]);
  return null;
};

// --- HELPERS ---
const getDistance = (lat1, lon1, lat2, lon2) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 0;
  const R = 6371; // km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
};

// --- ROUTING COMPONENT ---
const RoutingControl = ({ start, end, onRouteFound }) => {
  const map = useMap();
  const routingRef = useRef(null);

  useEffect(() => {
    if (!map || !start || !end) return;

    // Use stringified coordinates for dependency check to avoid ref issues
    const startCoord = `${start[0]},${start[1]}`;
    const endCoord = `${end[0]},${end[1]}`;

    if (routingRef.current) {
      try {
        map.removeControl(routingRef.current);
      } catch (e) {}
    }

    const control = L.Routing.control({
      router: L.Routing.osrmv1({
        serviceUrl: 'https://router.project-osrm.org/route/v1'
      }),
      waypoints: [
        L.latLng(start[0], start[1]),
        L.latLng(end[0], end[1])
      ],
      lineOptions: {
        styles: [
          { color: "#000", weight: 9, opacity: 0.4 }, 
          { color: "#10b981", weight: 6, opacity: 1 }
        ],
        extendToWaypoints: true,
        missingRouteTolerance: 10
      },
      show: false,
      addWaypoints: false,
      routeWhileDragging: false,
      draggableWaypoints: false,
      fitSelectedRoutes: true,
      createMarker: () => null,
    });

    control.addTo(map);
    routingRef.current = control;

    control.on('routesfound', (e) => {
      const routes = e.routes;
      if (routes && routes.length > 0) {
        onRouteFound(routes[0].summary);
      }
    });

    control.on('routingerror', (e) => {
      console.error("Routing error:", e);
      onRouteFound({ error: true });
    });

    // Explicitly trigger routing calculation
    try {
      control.route();
    } catch (e) {
      console.error("Routing calculation failed:", e);
    }

    return () => {
      if (routingRef.current && map) {
        try {
          map.removeControl(routingRef.current);
          routingRef.current = null;
        } catch (e) {}
      }
    };
  }, [map, start[0], start[1], end[0], end[1]]); 

  return null;
};

// --- CUSTOM ICONS GENERATOR ---
const createCustomIcon = (type, level, isPulse = false) => {
  let IconComponent = Trash2;
  let color = "#10b981"; // Emerald

  if (type === "plastic") { IconComponent = Trash2; color = "#3b82f6"; }
  else if (type === "organic") { IconComponent = Leaf; color = "#10b981"; }
  else if (type === "glass") { IconComponent = Zap; color = "#38bdf8"; }
  else if (type === "metal") { IconComponent = Cpu; color = "#94a3b8"; }
  else if (type === "paper") { IconComponent = List; color = "#fbbf24"; }
  else if (type === "electronics") { IconComponent = Smartphone; color = "#a855f7"; }
  else if (type === "hazardous") { IconComponent = Info; color = "#f87171"; }

  if (level >= 90) color = "#ef4444";

  const iconHtml = renderToStaticMarkup(
    <div className={`relative flex items-center justify-center w-10 h-10 bg-slate-900/90 backdrop-blur-md border-2 rounded-full shadow-lg transition-transform hover:scale-110 ${isPulse ? "animate-bounce" : ""}`} style={{ borderColor: color, boxShadow: `0 0 15px ${color}44` }}>
      <IconComponent size={20} color={color} />
      {level >= 90 && (
        <span className="absolute -top-1 -right-1 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
        </span>
      )}
    </div>
  );

  return L.divIcon({
    html: iconHtml,
    className: "custom-marker-icon",
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -20]
  });
};

const BinsMap = ({ isEmbedded = false }) => {
  const [bins, setBins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [userLocation, setUserLocation] = useState(null);
  const [selectedType, setSelectedType] = useState(null); // Step 1: Selection
  const [viewMode, setViewMode] = useState("map"); // 'map' or 'list'
  const [selectedBin, setSelectedBin] = useState(null); // For navigation
  const [routeInfo, setRouteInfo] = useState(null);
  const [isNavigating, setIsNavigating] = useState(false);

  const token = localStorage.getItem("token");

// --- FETCH BINS ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        const binsRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/bins`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        setBins(binsRes.data);
      } catch (err) {
        setError("Failed to load bins");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [token]);

  // --- GEOLOCATION ---
  useEffect(() => {
    if (navigator.geolocation) {
      const watchId = navigator.geolocation.watchPosition(
        (pos) => {
           // Threshold to avoid jitter
           setUserLocation(prev => {
              if (!prev) return [pos.coords.latitude, pos.coords.longitude];
              const dist = getDistance(prev[0], prev[1], pos.coords.latitude, pos.coords.longitude);
              if (dist < 0.005) return prev; // Ignore movements < 5m
              return [pos.coords.latitude, pos.coords.longitude];
           });
        },
        () => setUserLocation([9.8819128, 76.5262093]),
        { enableHighAccuracy: true }
      );
      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, []);

  const handleRouteFound = React.useCallback((summary) => {
    setRouteInfo(summary);
  }, []);

  // --- CALCULATE BINS WITH DISTANCE ---
  const sortedBins = useMemo(() => {
    const filtered = selectedType && selectedType !== "All" 
      ? bins.filter(b => b.wasteType === selectedType) 
      : bins;

    if (!userLocation) return filtered;

    return filtered.map(b => ({
      ...b,
      distance: getDistance(userLocation[0], userLocation[1], b.latitude, b.longitude)
    })).sort((a, b) => a.distance - b.distance);
  }, [bins, selectedType, userLocation]);

  // --- RENDER SELECTION SCREEN ---
  if (!selectedType && !isEmbedded) {
    const types = [
      { id: "plastic", name: "Plastic", icon: Trash2, color: "text-blue-400", bg: "bg-blue-400/10" },
      { id: "organic", name: "Organic", icon: Leaf, color: "text-emerald-400", bg: "bg-emerald-400/10" },
      { id: "glass", name: "Glass", icon: Zap, color: "text-cyan-400", bg: "bg-cyan-400/10" },
      { id: "metal", name: "Metal", icon: Cpu, color: "text-slate-400", bg: "bg-slate-400/10" },
      { id: "paper", name: "Paper", icon: List, color: "text-amber-400", bg: "bg-amber-400/10" },
      { id: "electronics", name: "Electronics", icon: Smartphone, color: "text-purple-400", bg: "bg-purple-400/10" },
      { id: "hazardous", name: "Hazardous", icon: Info, color: "text-red-400", bg: "bg-red-400/10" },
      { id: "All", name: "All Waste", icon: Trash2, color: "theme-text", bg: "theme-glass-overlay" }
    ];

    return (
      <div className="min-h-screen theme-bg flex flex-col items-center justify-center p-6 pt-24">
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[120px]" />
        </div>

        <div className="relative z-10 text-center mb-12 animate-fade-in-down">
          <h1 className="text-4xl font-black theme-text mb-4">What are you disposing today?</h1>
          <p className="theme-text-muted font-bold uppercase tracking-widest text-xs">Select a category to find compatible bins</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 w-full max-w-4xl relative z-10">
          {types.map((type, idx) => (
            <button
              key={type.id}
              onClick={() => setSelectedType(type.id)}
              className="glass-panel p-8 rounded-3xl group flex flex-col items-center gap-4 transition-all hover:scale-105 hover:border-emerald-500/50 animate-fade-in-up"
              style={{ animationDelay: `${idx * 0.1}s` }}
            >
              <div className={`p-5 rounded-2xl ${type.bg} transition-transform group-hover:scale-110`}>
                <type.icon className={type.color} size={32} />
              </div>
              <span className="font-black theme-text">{type.name}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`${isEmbedded ? "relative w-full h-full" : "fixed inset-0 h-[100dvh] theme-bg theme-text flex flex-col md:flex-row pt-16"}`}>
      
      {/* Sidebar - Desktop / Drawer - Mobile */}
      <div className={`z-20 glass-panel md:w-[400px] flex flex-col h-full border-r border-white/10 ${isNavigating ? "hidden md:flex" : ""}`}>
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black flex items-center gap-2">
              <Navigation className="text-emerald-400" size={20} />
              Nearest Bins
            </h2>
            <p className="text-[10px] theme-text-muted font-black uppercase tracking-widest">Compatible with: {selectedType}</p>
          </div>
          <button 
            onClick={() => {setSelectedType(null); setSelectedBin(null); setIsNavigating(false);}}
            className="p-2 theme-glass-overlay hover:theme-glass-overlay-hover rounded-xl theme-gray transition-all"
          >
            <ArrowLeft size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar">
          {loading ? (
            <div className="flex flex-col items-center justify-center p-12 text-gray-500">
              <RefreshCw className="animate-spin mb-4" />
              <p className="font-bold">Searching...</p>
            </div>
          ) : sortedBins.length === 0 ? (
            <div className="text-center p-8">
              <Info className="mx-auto text-gray-500 mb-2" />
              <p className="text-gray-400 font-bold">No bins found for this type</p>
            </div>
          ) : (
            sortedBins.map(bin => (
              <div 
                key={bin._id}
                onClick={() => setSelectedBin(bin)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                  selectedBin?._id === bin._id 
                    ? "bg-emerald-500/10 border-emerald-500/50" 
                    : "bg-white/5 border-white/5 hover:bg-white/[0.08]"
                }`}
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-bold text-white tracking-tight">{bin.name}</h3>
                    <div className="flex items-center gap-1.5 mt-1">
                      <MapPin size={12} className="text-emerald-400" />
                      <span className="text-[10px] text-gray-400 font-bold truncate max-w-[150px]">{bin.placeName}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-emerald-400 font-black text-sm">{bin.distance ? bin.distance.toFixed(1) : "?.?"} km</p>
                    <p className="text-[10px] text-gray-500 font-bold uppercase">Distance</p>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-24 bg-gray-700 h-1.5 rounded-full overflow-hidden">
                      <div className={`h-full ${bin.level > 80 ? "bg-red-500" : "bg-emerald-500"}`} style={{ width: `${bin.level}%` }} />
                    </div>
                    <span className="text-[10px] font-black">{bin.level}%</span>
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); setSelectedBin(bin); setIsNavigating(true); }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 rounded-lg text-white font-black text-[10px] transition-all shadow-lg shadow-emerald-500/20"
                  >
                    <Navigation size={12} /> ROUTE
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Map View */}
      <div className="flex-1 relative">
        <MapContainer
          center={userLocation || [9.8819128, 76.5262093]}
          zoom={14}
          style={{ height: "100%", width: "100%", zIndex: 1 }}
          zoomControl={false}
        >
          <ThemeAwareTileLayer />
          <MapResizer />
          
          {/* User Marker */}
          {userLocation && (
            <Marker position={userLocation} icon={L.divIcon({
              html: renderToStaticMarkup(<div className="w-4 h-4 bg-emerald-500 rounded-full ring-4 ring-emerald-500/30 animate-pulse" />),
              className: "user-marker",
              iconSize: [20, 20]
            })} />
          )}

          {/* Bin Markers */}
          {sortedBins.map((bin) => (
            <Marker
              key={bin._id}
              position={[bin.latitude, bin.longitude]}
              icon={createCustomIcon(bin.wasteType, bin.level, selectedBin?._id === bin._id)}
              eventHandlers={{ click: () => setSelectedBin(bin) }}
            >
              <Popup className="glass-popup">
                <div className="p-1">
                  <h4 className="font-bold theme-text text-xs mb-1">{bin.name}</h4>
                  <p className="text-[10px] text-emerald-400 font-black uppercase">{bin.level}% Full</p>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* Routing Control - Show if bin is selected, even if not fully in "navigation mode" */}
          {selectedBin && userLocation && (
            <RoutingControl 
              start={userLocation} 
              end={[selectedBin.latitude, selectedBin.longitude]} 
              onRouteFound={handleRouteFound}
            />
          )}

          {/* Map Controls */}
          <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
            <button 
              onClick={() => setUserLocation(null)} // Trigger re-center (simplified)
              className="p-3 glass-panel rounded-2xl theme-text hover:theme-glass-overlay-hover transition-all shadow-xl"
            >
              <MapPin size={20} />
            </button>
          </div>
        </MapContainer>

        {/* Navigation Indicator / Header Overlay */}
        {isNavigating && selectedBin && (
          <div className="absolute top-6 left-1/2 -translate-x-1/2 z-[1000] w-[90%] md:w-auto">
            <div className="glass-panel p-4 rounded-3xl border border-emerald-500/30 shadow-2xl flex items-center justify-between gap-8 md:min-w-[400px]">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-emerald-500 rounded-2xl shadow-lg ring-4 ring-emerald-500/20 animate-pulse">
                  <Navigation className="text-white" size={24} />
                </div>
                <div>
                  <h3 className="font-black text-white leading-tight">Navigating to {selectedBin.name}</h3>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">
                      {routeInfo?.error ? "Route Failed" : (routeInfo ? `${(routeInfo.totalDistance / 1000).toFixed(1)} km` : "Calculating...")}
                    </span>
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                      {routeInfo?.error ? "Check connection" : (routeInfo ? `${Math.round(routeInfo.totalTime / 60)} mins` : "...")}
                    </span>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setIsNavigating(false)}
                className="p-3 bg-red-500/20 hover:bg-red-500/40 text-red-500 rounded-2xl transition-all"
              >
                <X size={20} />
              </button>
            </div>
          </div>
        )}

        {/* Action Bar (Mobile Bottom) */}
        {!isNavigating && selectedBin && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[1000] w-[90%] md:hidden">
            <div className="glass-panel p-4 rounded-3xl border border-white/10 flex items-center justify-between">
              <div>
                <p className="text-xs font-black text-white">{selectedBin.name}</p>
                <p className="text-[10px] text-emerald-400 font-bold">{selectedBin.distance?.toFixed(1)} km away</p>
              </div>
              <button 
                onClick={() => setIsNavigating(true)}
                className="px-6 py-3 bg-emerald-500 text-white rounded-2xl font-black text-sm shadow-xl shadow-emerald-500/20 active:scale-95 transition-all"
              >
                START
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BinsMap;