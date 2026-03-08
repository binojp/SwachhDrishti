import React, { useState, useEffect, useMemo } from 'react';
import { MapContainer, Marker, Popup, useMap } from 'react-leaflet';
import ThemeAwareTileLayer from '../components/ThemeAwareTileLayer';
import L from 'leaflet';
import 'leaflet-routing-machine';
import 'leaflet/dist/leaflet.css';

// --- Fix for Leaflet Default Icons in React ---
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
let DefaultIcon = L.icon({
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// --- ROUTING ENGINE COMPONENT ---
const RoutingMachine = ({ waypoints }) => {
  const map = useMap();

  useEffect(() => {
    if (!map || waypoints.length < 2) return;

    const routingControl = L.Routing.control({
      waypoints: waypoints,
      lineOptions: {
        styles: [{ color: '#27ae60', weight: 6, opacity: 0.8 }]
      },
      show: false, // Keeps the UI clean by hiding text instructions
      addWaypoints: false,
      draggableWaypoints: false,
      fitSelectedRoutes: true,
    }).addTo(map);

    return () => map.removeControl(routingControl);
  }, [map, waypoints]);

  return null;
};

// --- MAIN DASHBOARD APP ---
const SmartRouteAI = () => {
  // Central Depot: Changanassery
  const depot = [9.4667, 76.5500]; 

  // Localized Bin Data
  const [bins, setBins] = useState([
    { id: 1, name: "Changanassery Town", pos: [9.4667, 76.5500], fill: 85 },
    { id: 2, name: "Kurichy Outpost", pos: [9.5068, 76.5266], fill: 30 },
    { id: 3, name: "Thengana Junction", pos: [9.4750, 76.5750], fill: 90 },
    { id: 4, name: "Pathamuttom (Saintgits)", pos: [9.5119, 76.5503], fill: 20 },
    { id: 5, name: "Kurichy (MC Road)", pos: [9.5031, 76.5305], fill: 95 },
  ]);

  const FILL_THRESHOLD = 80;

  // Logic to build the route: Depot -> Full Bins -> Depot
  const activeWaypoints = useMemo(() => {
    const criticalStops = bins
      .filter(bin => bin.fill >= FILL_THRESHOLD)
      .map(bin => L.latLng(bin.pos[0], bin.pos[1]));
    
    // Always start and end at the Depot
    return [L.latLng(depot[0], depot[1]), ...criticalStops, L.latLng(depot[0], depot[1])];
  }, [bins]);

  const updateFillLevel = (id, val) => {
    setBins(bins.map(b => b.id === id ? { ...b, fill: parseInt(val) } : b));
  };

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif' }}>
      
      {/* SIDEBAR CONTROL PANEL */}
      <div style={{ width: '380px', background: '#1a1a1a', color: 'white', padding: '20px', overflowY: 'auto', boxShadow: '4px 0 10px rgba(0,0,0,0.3)', zIndex: 1000 }}>
        <h1 style={{ color: '#2ecc71', marginBottom: '5px' }}>Smart Route AI</h1>
        <p style={{ opacity: 0.7, fontSize: '14px' }}>Smart Logistics: Changanassery Cluster</p>
        <hr style={{ borderColor: '#333', margin: '20px 0' }} />
        
        {bins.map(bin => (
          <div key={bin.id} style={{ marginBottom: '15px', padding: '15px', background: '#262626', borderRadius: '10px', borderLeft: bin.fill >= FILL_THRESHOLD ? '5px solid #e74c3c' : '5px solid #2ecc71' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span style={{ fontWeight: '600' }}>{bin.name}</span>
              <span style={{ color: bin.fill >= FILL_THRESHOLD ? '#e74c3c' : '#2ecc71' }}>{bin.fill}%</span>
            </div>
            <input 
              type="range" min="0" max="100" value={bin.fill} 
              style={{ width: '100%', cursor: 'pointer' }}
              onChange={(e) => updateFillLevel(bin.id, e.target.value)} 
            />
          </div>
        ))}

        <div style={{ marginTop: '30px', padding: '15px', background: '#2ecc71', color: '#1a1a1a', borderRadius: '10px', fontWeight: 'bold' }}>
          <div style={{ fontSize: '12px', textTransform: 'uppercase' }}>Current Route Status</div>
          <div style={{ fontSize: '18px' }}>{activeWaypoints.length - 2} Pickups Scheduled</div>
        </div>
      </div>

      {/* MAP VIEW */}
      <div style={{ flex: 1, position: 'relative' }}>
        <MapContainer center={[9.8819128, 76.5262093]} zoom={13} style={{ height: '100%', width: '100%' }}>
          <ThemeAwareTileLayer />
          
          {bins.map(bin => (
            <Marker key={bin.id} position={bin.pos}>
              <Popup>
                <strong>{bin.name}</strong><br />
                Status: {bin.fill}% Full
              </Popup>
            </Marker>
          ))}

          <RoutingMachine waypoints={activeWaypoints} />
        </MapContainer>
      </div>
    </div>
  );
};

export default SmartRouteAI;