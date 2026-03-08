import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  Briefcase, CheckCircle, Clock, Eye, MapPin, Calendar, AlertCircle, XCircle, ShieldCheck, Loader, Trash2, Shield, Activity, Filter
} from "lucide-react";
import "./index.css";

// Status Badge
const StatusBadge = ({ status }) => {
  const styles = {
    Reported: "bg-blue-500/20 text-blue-400 border-blue-500/50",
    Pending: "bg-amber-500/20 text-amber-400 border-amber-500/50",
    Review: "bg-purple-500/20 text-purple-400 border-purple-500/50",
    Resolved: "bg-emerald-500/20 text-emerald-400 border-emerald-500/50",
    Rejected: "bg-red-500/20 text-red-400 border-red-500/50",
    Scheduled: "bg-blue-500/20 text-blue-400 border-blue-500/50",
    Assigned: "bg-amber-500/20 text-amber-400 border-amber-500/50",
    "In Progress": "bg-purple-500/20 text-purple-400 border-purple-500/50",
    Completed: "bg-emerald-500/20 text-emerald-400 border-emerald-500/50",
    Cancelled: "bg-red-500/20 text-red-400 border-red-500/50",
  };
  return (
    <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase border ${styles[status] || "bg-gray-500/20 text-gray-400 border-gray-500/50"}`}>
      {status}
    </span>
  );
};

export default function WorkerDash() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState([]);
  const [assignedReports, setAssignedReports] = useState([]);
  const [assignedCollections, setAssignedCollections] = useState([]);
  const [availableCollections, setAvailableCollections] = useState([]);
  const [filter, setFilter] = useState("all"); 

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const token = localStorage.getItem("token");
    if (!token) return navigate("/login");

    try {
      const [reportsRes, assignedReportsRes, assignedCollectionsRes, availableCollectionsRes] = await Promise.all([
        axios.get(`${import.meta.env.VITE_API_URL}/api/worker/reports`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${import.meta.env.VITE_API_URL}/api/worker/reports/assigned`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${import.meta.env.VITE_API_URL}/api/worker/collections/assigned`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${import.meta.env.VITE_API_URL}/api/collections/available`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      setReports(reportsRes.data);
      setAssignedReports(assignedReportsRes.data);
      setAssignedCollections(assignedCollectionsRes.data);
      setAvailableCollections(availableCollectionsRes.data);
    } catch (err) {
      console.error(err);
      if (err.response?.status === 403) navigate("/");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyPhoto = async (reportId) => {
    const token = localStorage.getItem("token");
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/worker/reports/${reportId}/verify`, {}, { headers: { Authorization: `Bearer ${token}` } });
      toast.success("Verified!");
      fetchData();
    } catch (err) { toast.error("Failed to verify"); }
  };

  const handleUpdateStatus = async (reportId, status) => {
    const token = localStorage.getItem("token");
    try {
      await axios.put(`${import.meta.env.VITE_API_URL}/api/worker/reports/${reportId}/status`, { status }, { headers: { Authorization: `Bearer ${token}` } });
      toast.success("Status updated successfully!");
      fetchData();
    } catch (err) { toast.error("Failed to update status"); }
  };

  const handleAssignToMe = async (reportId) => {
    const token = localStorage.getItem("token");
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/worker/reports/${reportId}/assign`, {}, { headers: { Authorization: `Bearer ${token}` } });
      toast.success("Report assigned to you!");
      fetchData();
    } catch (err) { toast.error("Failed to assign"); }
  };

  const handleAssignCollectionToMe = async (collectionId) => {
    const token = localStorage.getItem("token");
    try {
      await axios.put(`${import.meta.env.VITE_API_URL}/api/collections/${collectionId}`, { assignedWorker: "self", status: "Assigned" }, { headers: { Authorization: `Bearer ${token}` } });
      toast.success("Collection assigned to you!");
      fetchData();
    } catch (err) { toast.error("Failed to assign collection"); }
  };

  const handleUpdateCollectionStatus = async (collectionId, status) => {
    const token = localStorage.getItem("token");
    try {
      await axios.put(`${import.meta.env.VITE_API_URL}/api/collections/${collectionId}`, { status }, { headers: { Authorization: `Bearer ${token}` } });
      toast.success("Collection status updated!");
      fetchData();
    } catch (err) { toast.error("Failed to update collection status"); }
  };

  if (loading) return <div className="min-h-screen theme-bg flex items-center justify-center"><Loader className="animate-spin text-emerald-400" size={40} /></div>;

  const displayReports = filter === "assigned" ? assignedReports : reports;

  return (
    <div className="min-h-screen theme-bg theme-text p-4 pt-24 pb-12">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex items-center justify-between animate-fade-in-down">
          <div>
            <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">Worker Console</h1>
            <p className="theme-text-muted text-sm">Manage assignments & collections</p>
          </div>
          <div className="glass-panel px-4 py-2 rounded-full flex items-center gap-2 theme-border">
            <ShieldCheck className="text-emerald-400" size={16} />
            <span className="text-xs font-bold theme-text-secondary">AUTHORIZED PERSONNEL</span>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-fade-in-up">
           <div className="glass-panel p-6 rounded-2xl flex items-center gap-4 hover:bg-white/5 transition-all">
              <div className="p-3 rounded-full bg-blue-500/20 text-blue-400"><Eye size={24}/></div>
              <div>
                <p className="text-2xl font-black">{reports.length}</p>
                <p className="text-xs font-bold uppercase text-gray-400">Total Reports</p>
              </div>
           </div>
           <div className="glass-panel p-6 rounded-2xl flex items-center gap-4 hover:bg-white/5 transition-all">
              <div className="p-3 rounded-full bg-amber-500/20 text-amber-400"><Briefcase size={24}/></div>
              <div>
                <p className="text-2xl font-black">{assignedReports.length}</p>
                <p className="text-xs font-bold uppercase text-gray-400">My Reports</p>
              </div>
           </div>
           <div className="glass-panel p-6 rounded-2xl flex items-center gap-4 hover:bg-white/5 transition-all">
              <div className="p-3 rounded-full bg-emerald-500/20 text-emerald-400"><Calendar size={24}/></div>
              <div>
                <p className="text-2xl font-black">{assignedCollections.length}</p>
                <p className="text-xs font-bold uppercase text-gray-400">My Collections</p>
              </div>
           </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 animate-fade-in-up delay-100">
           {["all", "assigned"].map(f => (
             <button
               key={f}
               onClick={() => setFilter(f)}
               className={`px-4 py-2 rounded-xl text-sm font-bold uppercase transition-all ${filter === f ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" : "bg-white/5 text-gray-400 hover:bg-white/10"}`}
             >
               {f === 'all' ? 'All Activity' : 'My Tasks'}
             </button>
           ))}
        </div>

        {/* Reports Grid */}
        <div className="glass-panel rounded-2xl p-6 border border-white/10 animate-fade-in-up delay-200">
           <h3 className="font-bold flex items-center gap-2 mb-6 text-lg"><AlertCircle className="text-emerald-400"/> Incident Reports</h3>
           <div className="space-y-4">
             {displayReports.length > 0 ? displayReports.map(report => (
               <div key={report._id} className="p-4 rounded-xl bg-white/5 border border-white/5 hover:border-emerald-500/30 transition-all">
                  <div className="flex justify-between items-start mb-2">
                     <div>
                        <h4 className="font-bold text-gray-200">{report.title}</h4>
                        <p className="text-xs text-gray-500 flex items-center gap-1 mt-1"><MapPin size={12}/> {report.location}</p>
                     </div>
                     <div className="text-right space-y-1">
                        <StatusBadge status={report.status} />
                        <div>{report.photoVerified ? <span className="text-[10px] font-bold text-emerald-400 flex items-center justify-end gap-1"><ShieldCheck size={10}/> Verified</span> : <span className="text-[10px] font-bold text-amber-500">Unverified</span>}</div>
                     </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mt-4">
                     {!report.photoVerified && <button onClick={() => handleVerifyPhoto(report._id)} className="px-3 py-1 bg-emerald-500/20 text-emerald-400 text-xs font-bold rounded-lg hover:bg-emerald-500/30">Verify Proof</button>}
                     {!report.assignedWorker && <button onClick={() => handleAssignToMe(report._id)} className="px-3 py-1 bg-blue-500/20 text-blue-400 text-xs font-bold rounded-lg hover:bg-blue-500/30">Assign Self</button>}
                     {report.assignedWorker && (
                        <select 
                          value={report.status} 
                          onChange={(e) => handleUpdateStatus(report._id, e.target.value)}
                          className="theme-glass-overlay text-xs theme-text p-1 rounded theme-border"
                        >
                           <option value="Pending">Pending</option>
                           <option value="Review">Review</option>
                           <option value="Resolved">Resolved</option>
                           <option value="Rejected">Rejected</option>
                        </select>
                     )}
                     <button onClick={() => navigate(`/worker/report/${report._id}`)} className="px-3 py-1 bg-white/5 text-gray-300 text-xs font-bold rounded-lg hover:bg-white/10">Details</button>
                  </div>
               </div>
             )) : <p className="text-gray-500 text-center py-6">No reports found.</p>}
           </div>
        </div>

        {/* Available Collections */}
        {availableCollections.length > 0 && (
          <div className="glass-panel rounded-2xl p-6 border border-white/10 animate-fade-in-up delay-300">
             <h3 className="font-bold flex items-center gap-2 mb-6 text-lg"><Briefcase className="text-blue-400"/> Open Pickup Jobs</h3>
             <div className="grid md:grid-cols-2 gap-4">
                {availableCollections.map(col => (
                   <div key={col._id} className="p-4 rounded-xl bg-white/5 border border-white/5 hover:border-blue-500/30 transition-all flex justify-between items-center">
                      <div>
                         <p className="font-bold text-sm text-gray-200">{col.wasteType} Pickup</p>
                         <p className="text-xs text-gray-500">{col.address?.address}</p>
                         <p className="text-[10px] text-gray-600 mt-1">{new Date(col.scheduledDate).toLocaleDateString()}</p>
                      </div>
                      <button onClick={() => handleAssignCollectionToMe(col._id)} className="px-3 py-1 bg-blue-500 text-white text-xs font-bold rounded-lg hover:bg-blue-600 shadow-lg shadow-blue-500/20">Accept</button>
                   </div>
                ))}
             </div>
          </div>
        )}

        {/* Assigned Collections */}
        {assignedCollections.length > 0 && (
           <div className="glass-panel rounded-2xl p-6 border border-white/10 animate-fade-in-up delay-300">
             <h3 className="font-bold flex items-center gap-2 mb-6 text-lg"><Calendar className="text-emerald-400"/> My Pickups</h3>
             <div className="grid md:grid-cols-2 gap-4">
                {assignedCollections.map(col => (
                   <div key={col._id} className="p-4 rounded-xl bg-white/5 border border-white/5 hover:border-emerald-500/30 transition-all">
                      <div className="flex justify-between mb-2">
                         <span className="font-bold text-sm text-gray-200">{col.wasteType}</span>
                         <StatusBadge status={col.status}/>
                      </div>
                      <p className="text-xs text-gray-500">{col.address?.address}</p>
                      <div className="mt-3">
                         <select 
                           value={col.status} 
                           onChange={(e) => handleUpdateCollectionStatus(col._id, e.target.value)}
                           className="w-full bg-black/30 text-xs text-white p-2 rounded-lg border border-white/10"
                         >
                            <option value="Scheduled">Scheduled</option>
                            <option value="Assigned">Assigned</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Completed">Completed</option>
                            <option value="Cancelled">Cancelled</option>
                         </select>
                      </div>
                   </div>
                ))}
            </div>
           </div>
        )}

      </div>
    </div>
  );
}
