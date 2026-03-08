import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { MapContainer, Marker, Popup, useMap } from "react-leaflet";
import ThemeAwareTileLayer from "../components/ThemeAwareTileLayer";
import L from "leaflet";
import "leaflet-routing-machine";
import "leaflet-routing-machine/dist/leaflet-routing-machine.css";
import { Truck, MapPin, LoaderCircle, RefreshCw, Plus, User } from "lucide-react";
import "leaflet/dist/leaflet.css";
import "./index.css";

// Fix Leaflet marker icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// Custom truck icon
const truckIcon = new L.Icon({
  iconUrl: "data:image/svg+xml;base64," + btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/>
      <path d="M15 18H9"/>
      <path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/>
      <circle cx="17" cy="18" r="2"/>
      <circle cx="7" cy="18" r="2"/>
    </svg>
  `),
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

// Create custom bin icon based on fill level
const createBinIcon = (level) => {
  const color = level >= 95 ? "#ef4444" : level >= 70 ? "#f59e0b" : "#10b981";
  return new L.Icon({
    iconUrl: "data:image/svg+xml;base64," + btoa(`
      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="${color}" stroke="white" stroke-width="2">
        <path d="M3 6h18l-1.5 14.5a2 2 0 0 1-2 1.5h-11a2 2 0 0 1-2-1.5L3 6Z"/>
        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
      </svg>
    `),
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    popupAnchor: [0, -28],
  });
};

// OSRM Routing Control Component
const RoutingControl = ({ waypoints }) => {
  const map = useMap();
  const routingRef = useRef(null);

  useEffect(() => {
    if (!map || !waypoints || waypoints.length < 2) return;

    // Remove existing routing control
    if (routingRef.current) {
      try {
        map.removeControl(routingRef.current);
      } catch (e) {
        console.error("Error removing routing control:", e);
      }
    }

    // Create new routing control with multiple waypoints
    const control = L.Routing.control({
      router: L.Routing.osrmv1({
        serviceUrl: 'https://router.project-osrm.org/route/v1'
      }),
      waypoints: waypoints.map(w => L.latLng(w.latitude, w.longitude)),
      lineOptions: {
        styles: [
          { color: "#000", weight: 9, opacity: 0.4 }, // Shadow
          { color: "#10b981", weight: 6, opacity: 1 } // Main line
        ],
        extendToWaypoints: true,
        missingRouteTolerance: 10
      },
      show: false, // Hide turn-by-turn instructions panel
      addWaypoints: false,
      routeWhileDragging: false,
      draggableWaypoints: false,
      fitSelectedRoutes: true,
      createMarker: () => null, // Don't create default markers
    });

    control.addTo(map);
    routingRef.current = control;

    control.on('routingerror', (e) => {
      console.error("Routing error:", e);
    });

    // Cleanup on unmount
    return () => {
      if (routingRef.current) {
        try {
          map.removeControl(routingRef.current);
        } catch (e) {
          console.error("Error cleaning up routing control:", e);
        }
      }
    };
  }, [map, waypoints]);

  return null;
};

export default function TruckMap() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [routes, setRoutes] = useState([]);
  const [bins, setBins] = useState([]);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [creating, setCreating] = useState(false);

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
      const [routesRes, binsRes] = await Promise.all([
        axios.get(`${import.meta.env.VITE_API_URL}/api/admin/truck-routes`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${import.meta.env.VITE_API_URL}/api/bins`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      setRoutes(routesRes.data);
      setBins(binsRes.data);
    } catch (err) {
      console.error("Error fetching data:", err);
      if (err.response?.status === 401 || err.response?.status === 403) {
        navigate("/login");
      }
    } finally {
      setLoading(false);
    }
  };

  const createRoutes = async () => {
    setCreating(true);
    const token = localStorage.getItem("token");

    try {
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/admin/truck-routes/create`,
        { threshold: 95 },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success(res.data.message);
      fetchData();
    } catch (err) {
      console.error("Error creating routes:", err);
      toast.error(err.response?.data?.message || "Failed to create routes");
    } finally {
      setCreating(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      Pending: "bg-blue-500/20 text-blue-400 border-blue-500/50",
      "In Progress": "bg-yellow-500/20 text-yellow-400 border-yellow-500/50",
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

  const fullBins = bins.filter((bin) => bin.level >= 95);
  const center = bins.length > 0 ? [bins[0].latitude, bins[0].longitude] : [9.8819128, 76.5262093];

  return (
    <div className="min-h-screen theme-bg theme-text p-4 pt-24 pb-24">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-black text-emerald-400 mb-2">Truck Route</h1>
            <p className="theme-text-muted text-sm">
              {fullBins.length} bins at ≥95% capacity • {routes.filter(r => r.status === "Pending").length} pending routes
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={fetchData}
              className="px-4 py-2 theme-glass-overlay hover:theme-glass-overlay-hover theme-border rounded-xl theme-text text-sm font-bold flex items-center gap-2 transition-all"
            >
              <RefreshCw size={18} />
            </button>
            <button
              onClick={createRoutes}
              disabled={creating || fullBins.length === 0}
              className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-sm font-bold rounded-xl shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all"
            >
              {creating ? <LoaderCircle className="animate-spin" size={18} /> : <Plus size={16} />}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Map */}
          <div className="lg:col-span-2 glass-panel rounded-2xl sm:rounded-3xl overflow-hidden h-[400px] sm:h-[500px] lg:h-[600px]">
            <MapContainer
              center={center}
              zoom={12}
              style={{ height: "100%", width: "100%" }}
              className="z-0"
            >
              <ThemeAwareTileLayer />

              {/* Render all bins */}
              {bins.map((bin) => (
                <Marker
                  key={bin._id}
                  position={[bin.latitude, bin.longitude]}
                  icon={createBinIcon(bin.level)}
                >
                  <Popup>
                    <div className="theme-text">
                      <p className="font-bold text-sm">{bin.name}</p>
                      <p className="text-xs theme-text-muted">{bin.placeName}</p>
                      <p className="text-xs mt-1 theme-text-muted">
                        Level: <span className="font-bold theme-text">{bin.level}%</span>
                      </p>
                      <p className="text-xs theme-text-muted">Type: {bin.wasteType}</p>
                    </div>
                  </Popup>
                </Marker>
              ))}

              {/* Render selected route with OSRM routing */}
              {selectedRoute && selectedRoute.bins && selectedRoute.bins.length > 0 && (
                <>
                  {/* OSRM turn-by-turn routing */}
                  <RoutingControl waypoints={selectedRoute.bins} />

                  {/* Truck marker at first bin */}
                  <Marker
                    position={[selectedRoute.bins[0].latitude, selectedRoute.bins[0].longitude]}
                    icon={truckIcon}
                  >
                    <Popup>
                      <div className="text-gray-900">
                        <p className="font-bold flex items-center gap-1">
                          <Truck size={14} /> Route Start
                        </p>
                        <p className="text-xs">Worker: {selectedRoute.assignedWorker?.name}</p>
                      </div>
                    </Popup>
                  </Marker>
                </>
              )}
            </MapContainer>
          </div>

          {/* Routes List */}
          <div className="glass-panel p-4 sm:p-6 rounded-2xl sm:rounded-3xl h-[400px] sm:h-[500px] lg:h-[600px] overflow-y-auto">
            <h2 className="text-base sm:text-lg font-bold mb-3 sm:mb-4 flex items-center gap-2">
              <Truck className="text-emerald-400 sm:w-5 sm:h-5" size={18}/> Active Routes
            </h2>

            {routes.length === 0 ? (
              <div className="text-center py-8 sm:py-12">
                <p className="theme-text-muted text-xs sm:text-sm">No routes created yet</p>
                <p className="theme-text-muted text-[10px] sm:text-xs mt-2">
                  {fullBins.length > 0
                    ? "Click 'Create Routes' to optimize collection"
                    : "No bins at ≥95% capacity"}
                </p>
              </div>
            ) : (
              <div className="space-y-2 sm:space-y-3">
                {routes.map((route) => (
                  <div
                    key={route._id}
                    onClick={() => setSelectedRoute(route)}
                    className={`p-3 sm:p-4 theme-glass-overlay theme-border rounded-xl sm:rounded-2xl cursor-pointer transition-all hover:theme-glass-overlay-hover ${
                      selectedRoute?._id === route._id ? "border-emerald-500" : ""
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-start gap-2 mb-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <User size={12} className="sm:w-4 sm:h-4 text-emerald-400 flex-shrink-0" />
                        <span className="text-xs sm:text-sm font-bold theme-text truncate">{route.assignedWorker?.name || "Unassigned"}</span>
                      </div>
                      <span className={`px-2 py-1 text-[10px] font-bold uppercase rounded-full border ${getStatusColor(route.status)}`}>
                        {route.status}
                      </span>
                    </div>

                    <div className="text-[10px] sm:text-xs theme-text-muted space-y-1">
                      <p className="flex items-center gap-1">
                        <MapPin size={10} className="sm:w-3 sm:h-3" />
                        {route.bins?.length || 0} stops • {route.totalDistance?.toFixed(1) || 0} km
                      </p>
                      <p className="text-[10px] theme-text-muted">
                        Created: {new Date(route.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
