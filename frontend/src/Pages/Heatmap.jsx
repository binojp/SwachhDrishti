import React, { useState, useEffect, Component } from "react";
import { MapContainer, Marker, Popup, ZoomControl } from "react-leaflet";
import ThemeAwareTileLayer from "../components/ThemeAwareTileLayer";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// --- WASTE TYPE ICON DEFINITIONS ---
// Custom HTML div icons with waste type illustrations
const getWasteTypeIcon = (wasteType) => {
  const wasteTypeConfig = {
    plastic: {
      emoji: "🥤",
      bgColor: "#3B82F6", // Blue
      borderColor: "#1E40AF",
    },
    organic: {
      emoji: "🍎",
      bgColor: "#10B981", // Emerald
      borderColor: "#047857",
    },
    glass: {
      emoji: "🧪",
      bgColor: "#06B6D4", // Cyan
      borderColor: "#0891B2",
    },
    metal: {
      emoji: "🔧",
      bgColor: "#64748B", // Slate
      borderColor: "#475569",
    },
    paper: {
      emoji: "📄",
      bgColor: "#F59E0B", // Amber
      borderColor: "#B45309",
    },
    electronics: {
      emoji: "💻",
      bgColor: "#8B5CF6", // Violet
      borderColor: "#6D28D9",
    },
    hazardous: {
      emoji: "☣️",
      bgColor: "#EF4444", // Red
      borderColor: "#B91C1C",
    },
    Mixed: {
      emoji: "🗑️",
      bgColor: "#6B7280", // Gray
      borderColor: "#4B5563",
    },
    Other: {
      emoji: "📦",
      bgColor: "#1F2937",
      borderColor: "#111827",
    },
  };

  const config = wasteTypeConfig[wasteType] || wasteTypeConfig.Mixed;
  
  // Create custom HTML div icon with waste type illustration
  const iconHtml = `
    <div style="
      background: linear-gradient(135deg, ${config.bgColor} 0%, ${config.borderColor} 100%);
      border: 3px solid white;
      border-radius: 50%;
      width: 45px;
      height: 45px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 26px;
      box-shadow: 0 3px 10px rgba(0,0,0,0.4), 0 0 0 2px ${config.borderColor};
      cursor: pointer;
      transition: all 0.2s ease;
      position: relative;
    ">
      ${config.emoji}
    </div>
  `;

  return L.divIcon({
    html: iconHtml,
    className: "custom-waste-icon",
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40],
  });
};

// Error Boundary Component
class ErrorBoundary extends Component {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ textAlign: "center", padding: "20px", color: "#b91c1c" }}>
          Something went wrong while rendering the map.
        </div>
      );
    }
    return this.props.children;
  }
}

const TrashMap = () => {
  const [reports, setReports] = useState([]);
  const [error, setError] = useState("");
  const navigate = useNavigate();
const mapCenter = [9.8819128, 76.5262093];
  // Get user role from localStorage
  const getUserRole = () => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        return user.role || "user";
      } catch {
        return "user";
      }
    }
    return "user";
  };

  // Get the correct report details route based on user role
  const getReportRoute = (reportId) => {
    const role = getUserRole();
    if (role === "worker") {
      return `/worker/report/${reportId}`;
    } else if (["admin", "superadmin"].includes(role)) {
      return `/admin/report/${reportId}`;
    } else {
      return `/user/report/${reportId}`;
    }
  };

  // Add custom CSS for waste type icons
  useEffect(() => {
    const iconStyle = document.createElement("style");
    iconStyle.textContent = `
      .custom-waste-icon {
        background: transparent !important;
        border: none !important;
      }
      .custom-waste-icon div {
        transition: all 0.2s ease;
      }
      .custom-waste-icon:hover div {
        transform: scale(1.2);
        box-shadow: 0 4px 15px rgba(0,0,0,0.5) !important;
      }
    `;
    iconStyle.setAttribute('data-waste-icons', 'true');
    
    if (!document.head.querySelector('style[data-waste-icons]')) {
      document.head.appendChild(iconStyle);
    }
    
    return () => {
      const existingStyle = document.head.querySelector('style[data-waste-icons]');
      if (existingStyle && document.head.contains(existingStyle)) {
        document.head.removeChild(existingStyle);
      }
    };
  }, []);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const token = localStorage.getItem("token");
        
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/reports`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        const validReports = response.data.filter(
          (report) =>
            typeof report.latitude === "number" &&
            typeof report.longitude === "number" &&
            !isNaN(report.latitude) &&
            !isNaN(report.longitude) &&
            report.status !== "Resolved" // Filter out resolved reports
        );
        setReports(validReports);
      } catch (err) {
        setError("Failed to fetch reports. Please try again.");
      }
    };
    fetchReports();
  }, [navigate]);

  return (
    <ErrorBoundary>
      <div style={{ position: "relative", height: "100vh", width: "100%" }}>
        {error && (
          <div style={{
            position: "absolute", top: "10px", left: "50%", transform: "translateX(-50%)",
            backgroundColor: "#fee2e2", color: "#b91c1c", padding: "8px 16px",
            borderRadius: "4px", zIndex: 1000,
          }}>
            {error}
          </div>
        )}
        
        <MapContainer
          center={mapCenter}
          zoom={13}
          style={{ height: "100%", width: "100%" }}
          scrollWheelZoom={true}
          zoomControl={false}
        >
          <ThemeAwareTileLayer />
          <ZoomControl position="bottomright" />
          
          {reports.map((report) => (
            <Marker
              key={report._id}
              position={[report.latitude, report.longitude]}
              icon={getWasteTypeIcon(report.wasteType || "Mixed")}
            >
              <Popup>
                <div style={{ fontFamily: "sans-serif", width: "200px" }}>
                  <h3 style={{ margin: "0 0 8px", fontSize: "14px", fontWeight: "bold" }}>{report.title}</h3>
                  <p style={{ fontSize: "11px", margin: "3px 0", color: "#666" }}>
                    <strong>Waste Type:</strong> {report.wasteType || "Mixed"}
                  </p>
                  <p style={{ fontSize: "11px", margin: "3px 0", color: "#666" }}>
                    <strong>Severity:</strong> {report.severity || "Not specified"}
                  </p>
                  <p style={{ fontSize: "11px", margin: "3px 0", color: "#666" }}>
                    <strong>Status:</strong> {report.status || "Reported"}
                  </p>
                  
                  {report.mediaUrls && report.mediaUrls.length > 0 && (
                    <div style={{ marginTop: "8px" }}>
                      {report.mediaUrls[0].match(/\.(mp4|webm)$/) ? (
                        <video
                          src={`${import.meta.env.VITE_API_URL}${report.mediaUrls[0]}`}
                          style={{ width: "100%", borderRadius: "4px" }}
                        />
                      ) : (
                        <img
                          src={`${import.meta.env.VITE_API_URL}${report.mediaUrls[0]}`}
                          alt="Report"
                          style={{ width: "100%", borderRadius: "4px", maxHeight: "100px", objectFit: "cover" }}
                        />
                      )}
                    </div>
                  )}

                  {/* --- WORKING NAVIGATION BUTTON --- */}
                  <button
                    onClick={() => navigate(getReportRoute(report._id))}
                    style={{
                      width: "100%", padding: "10px", border: "none",
                      backgroundColor: "#10b981", color: "white", fontWeight: "bold",
                      cursor: "pointer", marginTop: "12px", borderRadius: "6px",
                    }}
                  >
                    View Full Details
                  </button>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </ErrorBoundary>
  );
};

export default TrashMap;