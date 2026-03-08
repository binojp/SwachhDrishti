import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  MapContainer,
  Marker,
  useMapEvents,
} from "react-leaflet";
import ThemeAwareTileLayer from "../components/ThemeAwareTileLayer";
import {
  Trash2,
  Camera,
  UploadCloud,
  MapPin,
  X,
  LoaderCircle,
  ShieldCheck,
  ShieldAlert,
  Zap,
  Battery,
  Smartphone,
  Laptop,
  Cpu,
  AlertCircle
} from "lucide-react";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import "../index.css"; 

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const fileToBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result.split(",")[1]);
    reader.onerror = (error) => reject(error);
  });

const MediaPreview = ({ file, onRemove, analysisStatus }) => {
  const [previewUrl, setPreviewUrl] = useState(null);
  const fileType = file.type.split("/")[0];

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  if (!previewUrl) return null;

  return (
    <div className="relative w-full h-48 md:h-64 rounded-2xl overflow-hidden group border border-white/20 shadow-lg">
      {fileType === "image" ? (
        <img src={previewUrl} alt="preview" className="w-full h-full object-cover" />
      ) : (
        <video src={previewUrl} className="w-full h-full object-cover" />
      )}
      
      {analysisStatus !== "idle" && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center transition-opacity">
          {analysisStatus === "analyzing" && (
            <div className="flex flex-col items-center gap-2">
              <LoaderCircle className="animate-spin text-emerald-400 w-12 h-12" />
              <p className="text-emerald-400 font-mono text-sm animate-pulse">SCANNING...</p>
            </div>
          )}
          {analysisStatus === "verified" && (
            <ShieldCheck className="text-emerald-400 w-16 h-16 drop-shadow-[0_0_15px_rgba(52,211,153,0.8)]" />
          )}
          {analysisStatus === "invalid" && (
            <ShieldAlert className="text-red-400 w-16 h-16 drop-shadow-[0_0_15px_rgba(248,113,113,0.8)]" />
          )}
        </div>
      )}

      <button
        type="button"
        onClick={onRemove}
        className="absolute top-2 right-2 p-2 bg-red-500/80 backdrop-blur-md text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
      >
        <X size={16} />
      </button>
    </div>
  );
};

const FileUploader = ({ files, maxFiles, mode, onFilesSelected, onRemove, analysisStatus }) => {
  const fileInputRef = useRef(null);

  const handleFileChange = (event) => {
    const selected = Array.from(event.target.files);
    if (files.length + selected.length <= maxFiles) {
      onFilesSelected(selected);
    } else {
      toast.error(`Max ${maxFiles} file(s) allowed.`);
    }
  };

  return (
    <div className="w-full">
      {files.length === 0 ? (
        <>
          <div
            onClick={() => fileInputRef.current?.click()}
            className="w-full h-48 border-2 border-dashed border-emerald-500/30 rounded-2xl flex flex-col items-center justify-center text-emerald-400 cursor-pointer hover:bg-emerald-500/10 hover:border-emerald-500/60 transition-all group"
          >
            <div className="p-4 bg-emerald-500/10 rounded-full mb-3 group-hover:scale-110 transition-transform">
              <UploadCloud size={32} className="text-emerald-400" />
            </div>
            <p className="text-lg font-semibold text-gray-200">
              {mode === "report" ? "Scan Waste" : "Upload Cleanup Proof"}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Supports JPG, PNG • Max {maxFiles} file(s)
            </p>
          </div>
        </>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {files.map((file, index) => (
            <MediaPreview
              key={index}
              file={file}
              onRemove={() => onRemove(index)}
              analysisStatus={mode === "report" ? analysisStatus : "idle"}
            />
          ))}
        </div>
      )}
      <input
        ref={fileInputRef}
        type="file"
        multiple={maxFiles > 1}
        onChange={handleFileChange}
        className="hidden"
        accept="image/*,video/*"
        capture="environment"
      />
    </div>
  );
};

const LocationPicker = ({ setLocation, setLocationName, setLocationError }) => {
  const [position, setPosition] = useState(null);

  const MapClickHandler = () => {
    const map = useMapEvents({
      click(e) {
        const { lat, lng } = e.latlng;
        setPosition([lat, lng]);
        setLocation({ lat, lon: lng });
        setLocationError("");
        map.setView([lat, lng], 13);
        axios
          .get(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18`)
          .then((res) => setLocationName(res.data.display_name || "Custom Point"))
          .catch(() => setLocationName("Unknown location"));
      },
    });
    return position ? <Marker position={position} /> : null;
  };

  return (
    <div className="h-[200px] w-full rounded-2xl overflow-hidden border border-white/10 shadow-inner">
      <MapContainer center={[9.8819128, 76.5262093]} zoom={13} style={{ height: "100%", width: "100%" }}>
        <ThemeAwareTileLayer />
        <MapClickHandler />
      </MapContainer>
    </div>
  );
};

const SmartResultCard = ({ data }) => {
  if (!data) return null;
  
  if (data.is_waste === false) {
    return (
      <div className="bg-red-500/10 border border-red-500/30 p-5 rounded-2xl mt-4 animate-[fadeIn_0.5s_ease-out]">
        <div className="flex items-center gap-3 text-red-400 mb-2">
          <AlertCircle size={24} />
          <h3 className="font-bold text-lg">Not Manageable Waste</h3>
        </div>
        <p className="text-gray-400 text-sm italic">"{data.description}"</p>
        <p className="text-red-400/80 text-xs mt-3 font-semibold uppercase tracking-wider border-t border-red-500/20 pt-3">
          Verification Failed • Claim Rejected
        </p>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-emerald-900/50 to-slate-900/50 border border-emerald-500/30 p-5 rounded-2xl mt-4 animate-[fadeIn_0.5s_ease-out]">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-emerald-400 font-bold text-lg flex items-center gap-2">
            <Zap size={20} className="fill-emerald-400" />
            Waste Detected
          </h3>
          <p className="text-gray-400 text-sm">{data.item_type || "Waste Item"}</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-white">+{data.estimated_value_credits || 10}</p>
          <p className="text-xs text-emerald-400 font-mono">CREDITS</p>
        </div>
      </div>
      
      {/* YOLO Detections disabled for Railway Hosting */}
      {/* 
      {data.yolo_detections && data.yolo_detections.length > 0 && (
        <div className="mb-4">
          <div className="flex flex-wrap gap-2">
            {data.yolo_detections.map((det, i) => (
              <span key={i} className="px-2 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-md text-[7px] text-emerald-400 font-medium">
                {det.class.toUpperCase()} ({Math.round(det.confidence * 100)}%)
              </span>
            ))}
          </div>
        </div>
      )} 
      */}
      
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="bg-white/5 p-3 rounded-xl border border-white/5">
          <p className="text-gray-500 text-xs mb-1">Type</p>
          <p className="text-white font-medium">{data.item_type || "General"}</p>
        </div>
        <div className="bg-white/5 p-3 rounded-xl border border-white/5">
          <p className="text-gray-500 text-xs mb-1">Carbon Mitigated</p>
          <p className="text-emerald-400 font-medium">{data.carbon_saved_kg || 0.5} kg</p>
        </div>
      </div>
    </div>
  );
};

export default function UploadPage() {
  const [mode, setMode] = useState("report");
  const [files, setFiles] = useState([]);
  const [analysisStatus, setAnalysisStatus] = useState("idle");
  const [aiData, setAiData] = useState(null);
  const [analysisError, setAnalysisError] = useState("");
  const [location, setLocation] = useState(null);
  const [locationName, setLocationName] = useState("");
  const [isTracking, setIsTracking] = useState(false);
  const [locationError, setLocationError] = useState("");
  const [showMap, setShowMap] = useState(false);
  const [formData, setFormData] = useState({ title: "", description: "", severity: "Low", wasteType: "Mixed" });
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  const handleFileSelection = async (selected) => {
    const newFiles = mode === "report" ? [selected[0]] : [...files, ...selected].slice(0, 2);
    setFiles(newFiles);

    if (mode !== "report") return;

    setAnalysisStatus("analyzing");
    setAnalysisError("");
    setAiData(null);

    try {
      const file = selected[0];
      const formData = new FormData();
      formData.append("media", file);

      const token = localStorage.getItem("token");
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/reports/analyze`, 
        formData,
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data" 
          }
        }
      );

      const result = response.data;
      
      if (result.gemini) {
        if (result.gemini.is_waste === false) {
          setAnalysisStatus("invalid");
          setAnalysisError("Verification Failed: Uploaded image does not appear to contain manageable waste. Claims are only accepted for valid waste items.");
          setAiData(result.gemini);
          return;
        }

        setAnalysisStatus("verified");
        setAiData({
          ...result.gemini,
          yolo_detections: result.yolo?.detections || []
        });
        
        const mapWasteType = (itemType) => {
          const type = itemType.toLowerCase();
          if (type.includes("plastic")) return "plastic";
          if (type.includes("organic") || type.includes("food")) return "organic";
          if (type.includes("glass")) return "glass";
          if (type.includes("metal") || type.includes("iron") || type.includes("steel")) return "metal";
          if (type.includes("paper") || type.includes("cardboard")) return "paper";
          if (type.includes("electronics") || type.includes("battery") || type.includes("phone") || type.includes("laptop")) return "electronics";
          if (type.includes("hazardous") || type.includes("chemical")) return "hazardous";
          return "Other"; 
        };
        
        setFormData(prev => ({
          ...prev,
          title: `Dispose: ${result.gemini.item_type}`,
          description: result.gemini.description || `Detected ${result.gemini.item_type} for disposal.`,
          wasteType: mapWasteType(result.gemini.item_type),
          severity: "Low"
        }));
      } else {
        setAnalysisStatus("invalid");
        setAnalysisError("AI analysis failed to categorize waste.");
      }
    } catch (err) {
      console.error("Analysis Error:", err);
      setAnalysisStatus("invalid");
      setAnalysisError(`Analysis Failed: ${err.response?.data?.message || err.message}`);
    }
  };

  const handleRemoveFile = (index) => {
    setFiles(files.filter((_, i) => i !== index));
    setAnalysisStatus("idle");
    setAiData(null);
  };

  const handleTrackLocation = () => {
    setIsTracking(true);
    setLocationError("");
    if (!navigator.geolocation) {
      setLocationError("Geolocation not supported.");
      setIsTracking(false);
      setShowMap(true);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setLocation({ lat: latitude, lon: longitude });
        setIsTracking(false);
        try {
          const res = await axios.get(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
          setLocationName(res.data.display_name || "Detected Location");
        } catch (err) {
          setLocationName(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
        }
      },
      async (err) => {
        console.log("GPS failed, trying IP fallback...");
        try {
          const ipRes = await fetch('https://ipapi.co/json/');
          const ipData = await ipRes.json();
          if (ipData.latitude && ipData.longitude) {
            setLocation({ lat: ipData.latitude, lon: ipData.longitude });
            setLocationName(`${ipData.city}, ${ipData.region}, ${ipData.country_name}`);
            toast.success("Location estimated via network");
          } else {
            setLocationError("Permission denied. Pick on map.");
            setShowMap(true);
          }
        } catch (ipErr) {
          setLocationError("Permission denied. Pick on map.");
          setShowMap(true);
        }
        setIsTracking(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (mode === "report" && analysisStatus === "analyzing") {
      return; 
    }

    const data = new FormData();
    Object.keys(formData).forEach(key => data.append(key, formData[key]));
    data.append("type", mode);
    if (location) {
      data.append("latitude", location.lat);
      data.append("longitude", location.lon);
      data.append("location", locationName);
    }
    files.forEach(f => data.append("media", f));

    if (aiData) {
      data.append("ai_metadata", JSON.stringify(aiData));
    }

    try {
      const token = localStorage.getItem("token");
      await axios.post(`${import.meta.env.VITE_API_URL}/api/reports`, data, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" },
      });
      toast.success("Report Submitted Successfully!");
      navigate("/user/dashboard");
    } catch (err) {
      toast.error(err.response?.data?.message || "Submission failed. Please try again.");
      setErrors({ server: "Submission failed. Please try again." });
    }
  };

  return (
    <div className="min-h-screen theme-bg theme-text pt-20 pb-10 px-4 flex justify-center">
      <div className="w-full max-w-lg">
        
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400 mb-2">
            SwachhDrishti
          </h1>
          <p className="theme-text-muted text-sm">Smart AI-Powered Waste Management</p>
        </div>

        <div className="glass-panel p-1 rounded-xl flex mb-8">
          <button
            onClick={() => setMode("report")}
            className={`flex-1 py-3 rounded-lg flex items-center justify-center gap-2 font-bold transition-all ${
              mode === "report" ? "bg-emerald-600/80 text-white shadow-lg" : "theme-text-muted hover:theme-text"
            }`}
          >
            <Smartphone size={18} /> Smart Scan
          </button>
          <button
            onClick={() => setMode("cleanup")}
            className={`flex-1 py-3 rounded-lg flex items-center justify-center gap-2 font-bold transition-all ${
              mode === "cleanup" ? "bg-blue-600/80 text-white shadow-lg" : "theme-text-muted hover:theme-text"
            }`}
          >
            <Camera size={18} /> Cleanup
          </button>
        </div>

        <div className="glass-panel p-6 rounded-3xl theme-border relative overflow-hidden">
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
            
            <FileUploader
              files={files}
              maxFiles={mode === "report" ? 1 : 2}
              mode={mode}
              onFilesSelected={handleFileSelection}
              onRemove={handleRemoveFile}
              analysisStatus={analysisStatus}
            />

            <SmartResultCard data={aiData} />
            
            {analysisError && (
              <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-xl flex items-center gap-2 text-red-300 text-sm">
                <ShieldAlert size={16} /> {analysisError}
              </div>
            )}

            <div className="space-y-3">
              <label className="text-sm font-semibold theme-text-muted ml-1">Details</label>
              <input
                className="glass-input w-full p-4 rounded-xl theme-text placeholder:theme-text-muted"
                placeholder={mode === "report" ? "e.g. Plastic Bottles or Electronics" : "Cleanup Location Name"}
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
              <textarea
                className="glass-input w-full p-4 rounded-xl h-24 resize-none theme-text placeholder:theme-text-muted"
                placeholder="Additional details..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            {mode === "report" && (
              <div className="space-y-2">
                <label className="text-sm font-semibold theme-text-muted ml-1">Waste Type</label>
                <select 
                  className="glass-input w-full p-4 rounded-xl theme-text focus:border-emerald-500 focus:outline-none"
                  value={formData.wasteType}
                  onChange={(e) => setFormData({ ...formData, wasteType: e.target.value })}
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
            )}

            {mode === "report" && (
              <div className="space-y-2">
                <label className="text-sm font-semibold theme-text-muted ml-1">Severity</label>
                <select 
                  className="glass-input w-full p-4 rounded-xl theme-text focus:border-emerald-500 focus:outline-none"
                  value={formData.severity}
                  onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>
            )}

            <button
              type="button"
              onClick={handleTrackLocation}
              className={`w-full flex items-center justify-center gap-2 p-4 rounded-xl font-bold transition-all ${
                location 
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/50" 
                  : "theme-glass-overlay theme-text-secondary hover:theme-glass-overlay-hover theme-border"
              }`}
            >
              {isTracking ? <LoaderCircle className="animate-spin" /> : <MapPin size={20} />}
              {location ? "Location Verified" : "Attach Location"}
            </button>

            {showMap && (
              <LocationPicker 
                setLocation={setLocation} 
                setLocationName={setLocationName} 
                setLocationError={setLocationError} 
              />
            )}

            <button
              type="submit"
              disabled={mode === "report" && (analysisStatus === "analyzing" || analysisStatus === "invalid")}
              className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-emerald-500/20 transition-all transform hover:-translate-y-1 ${
                mode === "report" 
                  ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white" 
                  : "bg-gradient-to-r from-blue-500 to-indigo-500 text-white"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {mode === "report" ? "Submit Waste" : "Submit Cleanup"}
            </button>

          </form>
        </div>
      </div>
    </div>
  );
}