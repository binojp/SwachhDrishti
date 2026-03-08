import React, { useState, useEffect } from "react";
import { MapContainer, Marker, useMapEvents, useMap } from "react-leaflet";
import ThemeAwareTileLayer from "../components/ThemeAwareTileLayer";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix default marker icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// Map Size Fix Component (for modals)
function MapSizeFix() {
  const map = useMap();
  useEffect(() => {
    // Multiple attempts to fix size, as modal rendering can be tricky
    const timers = [
      setTimeout(() => map.invalidateSize(), 100),
      setTimeout(() => map.invalidateSize(), 300),
      setTimeout(() => map.invalidateSize(), 500),
    ];
    return () => timers.forEach(timer => clearTimeout(timer));
  }, [map]);
  return null;
}

// Click Handler Component
function ClickHandler({ onLocationSelect }) {
  const [position, setPosition] = useState(null);
  
  useMapEvents({
    click(e) {
      const newPos = e.latlng;
      setPosition(newPos);
      if (onLocationSelect) {
        onLocationSelect(newPos);
      }
    },
  });

  // Custom selection marker icon
  const selectionIcon = L.divIcon({
    html: `
      <div style="
        width: 28px;
        height: 28px;
        background: #3B82F6;
        border: 4px solid white;
        border-radius: 50%;
        box-shadow: 0 3px 12px rgba(59, 130, 246, 0.5);
        position: relative;
        animation: pulse-ring 2s infinite;
      ">
        <div style="
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 10px;
          height: 10px;
          background: white;
          border-radius: 50%;
        "></div>
      </div>
      <style>
        @keyframes pulse-ring {
          0% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7); }
          70% { box-shadow: 0 0 0 10px rgba(59, 130, 246, 0); }
          100% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0); }
        }
      </style>
    `,
    className: "custom-location-marker",
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });

  return position ? <Marker position={position} icon={selectionIcon} /> : null;
}

// Main Location Picker Map Component
export default function LocationPickerMap({ 
  center = [9.8819128, 76.5262093], 
  onLocationSelect,
  initialPosition 
}) {
  const [isMounted, setIsMounted] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState(initialPosition || null);

  // Delay mounting to ensure modal is fully rendered
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsMounted(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Update selected position when initialPosition changes
  useEffect(() => {
    if (initialPosition) {
      setSelectedPosition(initialPosition);
    }
  }, [initialPosition]);

  const handleLocationSelect = (latlng) => {
    setSelectedPosition(latlng);
    if (onLocationSelect) {
      onLocationSelect(latlng);
    }
  };

  if (!isMounted) {
    return (
      <div className="h-64 w-full bg-gray-100 rounded-xl flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-sm text-gray-600">Loading map...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-64 w-full rounded-xl overflow-hidden border-2 border-indigo-200 shadow-md bg-gray-50">
      {/* Instruction Label */}
      <div style={{
        position: "absolute",
        top: 12,
        left: "50%",
        transform: "translateX(-50%)",
        background: "linear-gradient(135deg, #3B82F6 0%, #6366F1 100%)",
        color: "white",
        padding: "8px 20px",
        borderRadius: "24px",
        zIndex: 1000,
        fontSize: "13px",
        fontWeight: "700",
        boxShadow: "0 4px 15px rgba(59, 130, 246, 0.3)",
        border: "2px solid rgba(255, 255, 255, 0.3)",
        backdropFilter: "blur(8px)"
      }}>
        📍 Click on the map to select location
      </div>

      {/* Coordinates Display */}
      {selectedPosition && (
        <div style={{
          position: "absolute",
          bottom: 16,
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 1000,
          background: "rgba(255, 255, 255, 0.95)",
          backdropFilter: "blur(8px)",
          padding: "8px 16px",
          borderRadius: "24px",
          boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
          display: "flex",
          gap: 12,
          alignItems: "center",
          width: "max-content",
          border: "1px solid rgba(59, 130, 246, 0.2)"
        }}>
          <span style={{ 
            fontSize: "12px", 
            fontWeight: "600", 
            color: "#1F2937",
            fontFamily: "monospace"
          }}>
            {selectedPosition.lat.toFixed(6)}, {selectedPosition.lng.toFixed(6)}
          </span>
          <div style={{
            width: "6px",
            height: "6px",
            background: "#10B981",
            borderRadius: "50%",
            animation: "pulse 2s infinite"
          }}></div>
        </div>
      )}

      <MapContainer
        key={`location-picker-${isMounted}-${selectedPosition?.lat}-${selectedPosition?.lng}`}
        center={selectedPosition ? [selectedPosition.lat, selectedPosition.lng] : center}
        zoom={13}
        style={{ height: "100%", width: "100%", zIndex: 1 }}
        scrollWheelZoom={true}
        zoomControl={true}
      >
        <MapSizeFix />
        <ThemeAwareTileLayer />
        <ClickHandler onLocationSelect={handleLocationSelect} />
      </MapContainer>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        .custom-location-marker {
          cursor: pointer;
        }
      `}</style>
    </div>
  );
}
