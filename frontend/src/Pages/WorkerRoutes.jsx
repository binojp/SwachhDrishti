import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { MapContainer, Marker, Popup, useMap } from "react-leaflet";
import ThemeAwareTileLayer from "../components/ThemeAwareTileLayer";
import L from "leaflet";
import "leaflet-routing-machine";
import "leaflet-routing-machine/dist/leaflet-routing-machine.css";
import { MapPin, LoaderCircle, Navigation, CheckCircle, Clock, Package } from "lucide-react";
import "leaflet/dist/leaflet.css";
import "./index.css";

// Fix Leaflet marker icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// Create numbered marker icons
const createNumberedIcon = (number) => {
  return new L.DivIcon({
    className: "custom-numbered-icon",
    html: `
      <div style="
        background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        color: white;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        font-size: 14px;
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      ">
        ${number}
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
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

export default function WorkerRoutes() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [routes, setRoutes] = useState([]);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchRoutes();
  }, []);

  const fetchRoutes = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/worker/assigned-routes`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setRoutes(res.data);
      if (res.data.length > 0 && !selectedRoute) {
        setSelectedRoute(res.data[0]);
      }
    } catch (err) {
      console.error("Error fetching routes:", err);
      if (err.response?.status === 401 || err.response?.status === 403) {
        navigate("/login");
      }
    } finally {
      setLoading(false);
    }
  };

  const updateRouteStatus = async (routeId, status) => {
    setUpdating(true);
    const token = localStorage.getItem("token");

    try {
      await axios.patch(
        `${import.meta.env.VITE_API_URL}/api/worker/routes/${routeId}/status`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success(`Route ${status.toLowerCase()} successfully!`);
      fetchRoutes();
    } catch (err) {
      console.error("Error updating route:", err);
      toast.error(err.response?.data?.message || "Failed to update route");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen theme-bg flex items-center justify-center">
        <LoaderCircle className="animate-spin text-emerald-400" size={48} />
      </div>
    );
  }

  if (routes.length === 0) {
    return (
      <div className="min-h-screen theme-bg theme-text flex items-center justify-center p-4">
        <div className="text-center">
          <Package className="mx-auto text-gray-600 mb-4" size={64} />
          <h2 className="text-2xl font-bold theme-text-muted mb-2">No Routes Assigned</h2>
          <p className="theme-text-muted text-sm">Check back later for new collection routes</p>
        </div>
      </div>
    );
  }

  const center = selectedRoute?.bins?.[0]
    ? [selectedRoute.bins[0].latitude, selectedRoute.bins[0].longitude]
    : [9.8819128, 76.5262093];

  return (
    <div className="min-h-screen theme-bg theme-text p-4 pt-24 pb-24">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-black text-emerald-400 mb-2">My Collection Routes</h1>
          <p className="theme-text-muted text-sm">{routes.length} assigned route(s)</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Map */}
          <div className="lg:col-span-2 glass-panel rounded-3xl overflow-hidden h-[600px]">
            {selectedRoute && selectedRoute.bins && selectedRoute.bins.length > 0 ? (
              <MapContainer
                center={center}
                zoom={13}
                style={{ height: "100%", width: "100%" }}
                className="z-0"
              >
                <ThemeAwareTileLayer />

                {/* OSRM turn-by-turn routing */}
                <RoutingControl waypoints={selectedRoute.bins} />

                {/* Numbered markers for each bin */}
                {selectedRoute.bins.map((bin, index) => (
                  <Marker
                    key={bin._id}
                    position={[bin.latitude, bin.longitude]}
                    icon={createNumberedIcon(index + 1)}
                  >
                    <Popup>
                      <div className="text-gray-900">
                        <p className="font-bold">Stop {index + 1}: {bin.name}</p>
                        <p className="text-xs">{bin.placeName}</p>
                        <p className="text-xs mt-1">
                          Level: <span className="font-bold text-red-600">{bin.level}%</span>
                        </p>
                        <p className="text-xs">Type: {bin.wasteType}</p>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            ) : (
              <div className="h-full flex items-center justify-center bg-white/5">
                <p className="text-gray-500">Select a route to view map</p>
              </div>
            )}
          </div>

          {/* Route Details */}
          <div className="glass-panel p-6 rounded-3xl h-[600px] overflow-y-auto">
            {/* Route Selector */}
            <div className="mb-6">
              <label className="text-xs text-gray-400 font-bold uppercase mb-2 block">Select Route</label>
              <select
                value={selectedRoute?._id || ""}
                onChange={(e) => {
                  const route = routes.find((r) => r._id === e.target.value);
                  setSelectedRoute(route);
                }}
                className="w-full theme-glass-overlay theme-border rounded-xl p-3 theme-text text-sm focus:outline-none focus:border-emerald-500"
              >
                {routes.map((route, index) => (
                  <option key={route._id} value={route._id}>
                    Route {index + 1} - {route.bins?.length || 0} stops ({route.status})
                  </option>
                ))}
              </select>
            </div>

            {selectedRoute && (
              <>
                {/* Route Info */}
                <div className="bg-white/5 p-4 rounded-xl mb-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Navigation className="text-emerald-400" size={20} />
                    <h3 className="font-bold text-lg">Route Details</h3>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Total Stops:</span>
                      <span className="font-bold">{selectedRoute.bins?.length || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Distance:</span>
                      <span className="font-bold">{selectedRoute.totalDistance?.toFixed(1) || 0} km</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Status:</span>
                      <span className={`px-2 py-1 text-[10px] font-bold uppercase rounded-full ${
                        selectedRoute.status === "Pending" ? "bg-blue-500/20 text-blue-400" :
                        selectedRoute.status === "In Progress" ? "bg-yellow-500/20 text-yellow-400" :
                        "bg-emerald-500/20 text-emerald-400"
                      }`}>
                        {selectedRoute.status}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3 mb-6">
                  {selectedRoute.status === "Pending" && (
                    <button
                      onClick={() => updateRouteStatus(selectedRoute._id, "In Progress")}
                      disabled={updating}
                      className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {updating ? <LoaderCircle className="animate-spin" size={16} /> : <Navigation size={16} />}
                      Start Route
                    </button>
                  )}
                  {selectedRoute.status === "In Progress" && (
                    <button
                      onClick={() => updateRouteStatus(selectedRoute._id, "Completed")}
                      disabled={updating}
                      className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {updating ? <LoaderCircle className="animate-spin" size={16} /> : <CheckCircle size={16} />}
                      Complete Route
                    </button>
                  )}
                </div>

                {/* Stops List */}
                <div>
                  <h4 className="text-sm font-bold theme-text-muted uppercase mb-3 flex items-center gap-2">
                    <MapPin size={14} /> Collection Stops
                  </h4>
                  <div className="space-y-2">
                    {selectedRoute.bins?.map((bin, index) => (
                      <div
                        key={bin._id}
                        className="p-3 theme-glass-overlay theme-border rounded-xl hover:theme-glass-overlay-hover transition-all"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-6 h-6 bg-emerald-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                            {index + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-sm truncate">{bin.name}</p>
                            <p className="text-xs text-gray-400 truncate">{bin.placeName}</p>
                            <div className="flex items-center gap-3 mt-1">
                              <span className="text-[10px] text-gray-500">
                                Level: <span className="text-red-400 font-bold">{bin.level}%</span>
                              </span>
                              <span className="text-[10px] text-gray-500">{bin.wasteType}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
