import React, { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { 
  ShoppingBag, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Truck, 
  Building2, 
  Search, 
  Filter,
  MoreVertical,
  Check,
  X,
  ArrowRight
} from "lucide-react";

export default function AdminMarketplace() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/marketplace/requests`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRequests(response.data);
    } catch (err) {
      toast.error("Failed to fetch marketplace requests");
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id, newStatus) => {
    try {
      const token = localStorage.getItem("token");
      await axios.patch(`${import.meta.env.VITE_API_URL}/api/marketplace/request/${id}`, 
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(`Request marked as ${newStatus}`);
      fetchRequests();
    } catch (err) {
      toast.error("Failed to update status");
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case "Pending": return "text-yellow-400 bg-yellow-400/10 border-yellow-400/20";
      case "Accepted": return "text-emerald-400 bg-emerald-400/10 border-emerald-400/20";
      case "Transferred": return "text-blue-400 bg-blue-400/10 border-blue-400/20";
      case "Rejected": return "text-red-400 bg-red-400/10 border-red-400/20";
      default: return "text-gray-400 bg-gray-400/10 border-gray-400/20";
    }
  };

  const filteredRequests = requests.filter(r => filter === "All" || r.status === filter);

  return (
    <div className="min-h-screen theme-bg theme-text pt-24 pb-12 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div>
            <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400 mb-2">
              Industrial Marketplace Admin
            </h1>
            <p className="theme-text-muted">Manage raw material requests from industries</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="glass-panel p-1 rounded-xl flex">
              {["All", "Pending", "Accepted", "Transferred"].map((t) => (
                <button
                  key={t}
                  onClick={() => setFilter(t)}
                  className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                    filter === t ? "bg-emerald-600 text-white shadow-lg" : "theme-text-muted hover:theme-text"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-32">
            <div className="w-16 h-16 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mb-6" />
            <p className="text-xl font-medium animate-pulse">Scanning marketplace requests...</p>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="glass-panel p-20 rounded-[2rem] theme-border text-center">
            <ShoppingBag size={80} className="mx-auto text-emerald-500/10 mb-6" />
            <h2 className="text-2xl font-bold mb-2">No Requests Found</h2>
            <p className="theme-text-muted">No material requests matching your current filter.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {filteredRequests.map((req) => (
              <div key={req._id} className="glass-panel p-8 rounded-[2rem] theme-border hover:border-emerald-500/30 transition-all relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8">
                  <span className={`px-4 py-1.5 rounded-full text-xs font-black border ${getStatusStyle(req.status)}`}>
                    {req.status.toUpperCase()}
                  </span>
                </div>

                <div className="flex items-start gap-6">
                  <div className="p-5 bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 rounded-3xl group-hover:scale-110 transition-transform duration-500">
                    <Building2 className="text-emerald-400" size={32} />
                  </div>
                  <div className="flex-1">
                    <div className="mb-6">
                      <h3 className="text-2xl font-black mb-1">{req.industry?.name || "Unknown Industry"}</h3>
                      <p className="text-sm theme-text-muted flex items-center gap-2">
                        <span className="text-emerald-400">{req.industry?.email}</span>
                        •
                        <span>{new Date(req.requestedAt).toLocaleString()}</span>
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                        <p className="text-xs theme-text-muted mb-1 uppercase font-bold tracking-wider">Material</p>
                        <p className="text-lg font-bold text-emerald-400">{req.materialType}</p>
                      </div>
                      <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                        <p className="text-xs theme-text-muted mb-1 uppercase font-bold tracking-wider">Quantity</p>
                        <p className="text-lg font-bold text-emerald-400">{req.quantity}</p>
                      </div>
                    </div>

                    {req.description && (
                      <div className="bg-slate-900/40 p-5 rounded-2xl border border-white/5 text-sm theme-text-muted mb-8 italic">
                        "{req.description}"
                      </div>
                    )}

                    <div className="flex flex-wrap items-center gap-3 mt-auto">
                      {req.status === "Pending" && (
                        <>
                          <button
                            onClick={() => updateStatus(req._id, "Accepted")}
                            className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
                          >
                            <Check size={18} /> Accept
                          </button>
                          <button
                            onClick={() => updateStatus(req._id, "Rejected")}
                            className="flex-1 py-3 bg-red-500/20 hover:bg-red-500/40 text-red-400 rounded-xl font-bold transition-all flex items-center justify-center gap-2 border border-red-500/30"
                          >
                            <X size={18} /> Reject
                          </button>
                        </>
                      )}
                      {req.status === "Accepted" && (
                        <button
                          onClick={() => updateStatus(req._id, "Transferred")}
                          className="w-full py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
                        >
                          <Truck size={18} /> Mark as Transferred
                        </button>
                      )}
                      {req.status === "Transferred" && (
                        <div className="flex items-center gap-2 text-emerald-400 font-bold bg-emerald-400/10 px-6 py-3 rounded-xl border border-emerald-400/20 w-full justify-center">
                          <CheckCircle size={20} /> Transaction Complete
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
