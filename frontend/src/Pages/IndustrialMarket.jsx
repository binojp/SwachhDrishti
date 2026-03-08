import React, { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { Factory, Package, Clock, CheckCircle, Send, Plus, Trash2, AlertCircle } from "lucide-react";

export default function IndustrialMarket() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    materialType: "Plastic",
    quantity: "",
    description: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchMyRequests();
  }, []);

  const fetchMyRequests = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/marketplace/my-requests`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRequests(response.data);
    } catch (err) {
      console.error("Error fetching requests:", err);
      // If user is not industry/admin, they might get 403. 
      // We should handle that or only show this page if role is correct.
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      await axios.post(`${import.meta.env.VITE_API_URL}/api/marketplace/request`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Raw material request submitted!");
      setFormData({ materialType: "Plastic", quantity: "", description: "" });
      fetchMyRequests();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit request");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Pending": return "text-yellow-400 bg-yellow-400/10";
      case "Accepted": return "text-emerald-400 bg-emerald-400/10";
      case "Transferred": return "text-blue-400 bg-blue-400/10";
      case "Rejected": return "text-red-400 bg-red-400/10";
      default: return "text-gray-400 bg-gray-400/10";
    }
  };

  return (
    <div className="min-h-screen theme-bg theme-text pt-24 pb-12 px-4">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Request Form */}
        <div className="lg:col-span-1">
          <div className="glass-panel p-6 rounded-3xl theme-border sticky top-24">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-emerald-500/20 rounded-2xl">
                <Factory className="text-emerald-400" size={24} />
              </div>
              <h2 className="text-2xl font-bold">New Request</h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-semibold theme-text-muted">Material Type</label>
                <select
                  className="glass-input w-full p-4 rounded-xl theme-text focus:border-emerald-500 focus:outline-none"
                  value={formData.materialType}
                  onChange={(e) => setFormData({ ...formData, materialType: e.target.value })}
                >
                  <option value="Plastic">Plastic</option>
                  <option value="Glass">Glass</option>
                  <option value="Metal">Metal</option>
                  <option value="Paper">Paper</option>
                  <option value="Organic">Organic</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold theme-text-muted">Quantity (e.g. 500kg)</label>
                <input
                  type="text"
                  className="glass-input w-full p-4 rounded-xl theme-text placeholder:theme-text-muted"
                  placeholder="Enter quantity"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold theme-text-muted">Description</label>
                <textarea
                  className="glass-input w-full p-4 rounded-xl h-32 resize-none theme-text placeholder:theme-text-muted"
                  placeholder="Specify details, grade, etc."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-emerald-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? "Submitting..." : <><Send size={20} /> Submit Request</>}
              </button>
            </form>
          </div>
        </div>

        {/* My Requests List */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
              Industrial Marketplace
            </h2>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mb-4" />
              <p className="theme-text-muted">Loading your requests...</p>
            </div>
          ) : requests.length === 0 ? (
            <div className="glass-panel p-12 rounded-3xl theme-border text-center">
              <Package size={64} className="mx-auto text-emerald-500/20 mb-4" />
              <h3 className="text-xl font-bold mb-2">No Requests Found</h3>
              <p className="theme-text-muted">
                Start by submitting a raw material request. We will bridge the gap between waste collection and industrial needs.
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {requests.map((req) => (
                <div key={req._id} className="glass-panel p-6 rounded-2xl theme-border hover:border-emerald-500/30 transition-all group">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="p-4 bg-emerald-500/10 rounded-2xl group-hover:scale-110 transition-transform">
                        <Package className="text-emerald-400" size={24} />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold">{req.materialType}</h3>
                        <p className="text-2xl font-black text-emerald-400">{req.quantity}</p>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <span className={`px-4 py-1.5 rounded-full text-xs font-bold ${getStatusColor(req.status)}`}>
                        {req.status.toUpperCase()}
                      </span>
                      <p className="text-xs theme-text-muted flex items-center gap-1">
                        <Clock size={12} /> {new Date(req.requestedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  
                  {req.description && (
                    <div className="mt-4 p-4 bg-white/5 rounded-xl border border-white/5 text-sm theme-text-muted">
                      {req.description}
                    </div>
                  )}

                  {req.status === "Pending" && (
                    <div className="mt-4 flex items-center gap-2 text-xs text-yellow-400/80">
                      <AlertCircle size={14} />
                      Your request is being reviewed by the administration.
                    </div>
                  )}
                  {req.status === "Accepted" && (
                    <div className="mt-4 flex items-center gap-2 text-xs text-emerald-400/80">
                      <CheckCircle size={14} />
                      Provisioning in progress. Logistics will contact you soon.
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
