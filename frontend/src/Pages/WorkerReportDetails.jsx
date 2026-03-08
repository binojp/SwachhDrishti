import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import {
  MapPin,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  ArrowLeft,
  ShieldCheck,
  Briefcase,
  History,
  User,
  Activity,
  Calendar,
  Trash2,
  LoaderCircle,
  Shield,
} from "lucide-react";

export default function WorkerReportDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchReport = async () => {
      if (!token) {
        setError("No token found. Please log in.");
        setLoading(false);
        return;
      }
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/reports/${id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setReport(response.data);
        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to fetch report");
        setLoading(false);
      }
    };
    fetchReport();
  }, [id, token]);

  const handleStatusUpdate = async (status) => {
    try {
      const response = await axios.put(
        `${import.meta.env.VITE_API_URL}/api/reports/${id}`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setReport(response.data);
      toast.success("Status updated successfully!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update status");
    }
  };

  const handleVerifyPhoto = async () => {
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/reports/${id}/verify`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setReport(response.data);
      toast.success("Photo verified successfully!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to verify photo");
    }
  };

  const handleAssignToMe = async () => {
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/worker/reports/${id}/assign`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setReport(response.data.report);
      toast.success("Report assigned to you!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to assign report");
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case "resolved":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "reported":
        return <AlertCircle className="w-4 h-4 text-blue-500" />;
      case "pending":
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case "rejected":
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "resolved":
        return "bg-green-100 text-green-700";
      case "reported":
        return "bg-blue-100 text-blue-700";
      case "pending":
        return "bg-yellow-100 text-yellow-700";
      case "rejected":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  if (loading) return (
    <div className="min-h-screen theme-bg flex items-center justify-center">
      <LoaderCircle className="animate-spin text-emerald-400" size={40} />
    </div>
  );

  if (error) return (
    <div className="min-h-screen theme-bg flex items-center justify-center p-4">
      <div className="glass-panel p-8 rounded-2xl border border-red-500/20 text-center max-w-md">
        <AlertCircle className="text-red-400 mx-auto mb-4" size={48} />
        <h2 className="text-xl font-bold text-white mb-2">Error</h2>
        <p className="text-red-400 font-medium">{error}</p>
        <button onClick={() => navigate("/worker/dashboard")} className="mt-6 px-6 py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-all font-bold">Back to Dashboard</button>
      </div>
    </div>
  );

  if (!report) return (
    <div className="min-h-screen theme-bg flex items-center justify-center p-4">
      <div className="glass-panel p-8 rounded-2xl border border-white/10 text-center max-w-md">
        <XCircle className="text-gray-500 mx-auto mb-4" size={48} />
        <h2 className="text-xl font-bold text-white mb-2">Not Found</h2>
        <p className="text-gray-400">The requested report could not be found.</p>
        <button onClick={() => navigate("/worker/dashboard")} className="mt-6 px-6 py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-all font-bold">Back to Dashboard</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen theme-bg theme-text p-4 pt-24 pb-12 relative overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />
      </div>

      <div className="max-w-7xl mx-auto space-y-8 relative z-10">
        
        {/* Back Navigation */}
        <div className="flex items-center justify-between animate-fade-in-down">
          <button
            onClick={() => navigate("/worker/dashboard")}
            className="group flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-emerald-400 transition-all border border-white/5"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="font-bold text-sm">Dashboard</span>
          </button>
          
          <div className="glass-panel px-4 py-2 rounded-full flex items-center gap-2 border border-white/10">
             <Briefcase className="text-emerald-400" size={16} />
             <span className="text-xs font-bold text-gray-300">INCIDENT REPORT #{id.substring(id.length - 4).toUpperCase()}</span>
          </div>
        </div>

        {/* Hero Section */}
        <div className="glass-panel p-8 rounded-[2rem] border border-white/10 shadow-2xl animate-fade-in-up">
           <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
             <div>
               <div className="flex items-center gap-3 mb-3">
                 <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                   report.status === "Resolved" ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40" : 
                   report.status === "Pending" ? "bg-amber-500/20 text-amber-400 border-amber-500/40" :
                   "bg-blue-500/20 text-blue-400 border-blue-500/40"
                 }`}>
                   {report.status}
                 </span>
                 {report.photoVerified && (
                   <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                     <ShieldCheck size={12} /> Verified
                   </span>
                 )}
               </div>
               <h1 className="text-3xl md:text-4xl font-black text-white">{report.title}</h1>
               <div className="flex items-center gap-4 mt-4 text-gray-400">
                 <div className="flex items-center gap-1.5 text-xs font-bold">
                   <Calendar size={14} className="text-emerald-400" />
                   {new Date(report.createdAt).toLocaleDateString()}
                 </div>
                 <div className="flex items-center gap-1.5 text-xs font-bold ring-offset-emerald-400">
                   <Clock size={14} className="text-emerald-400" />
                   {new Date(report.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                 </div>
               </div>
             </div>
             
             <div className="flex items-center gap-2">
                {!report.assignedWorker ? (
                  <button
                    onClick={handleAssignToMe}
                    className="flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-lg shadow-emerald-500/20"
                  >
                    <Briefcase className="w-4 h-4" /> Take Job
                  </button>
                ) : (
                  <div className="flex items-center gap-3 bg-white/5 border border-white/10 p-2 pr-6 rounded-2xl">
                     <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center font-black text-white">
                        {report.assignedWorker?.name?.charAt(0) || "W"}
                     </div>
                     <div>
                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Assigned Worker</p>
                        <p className="text-sm font-bold text-white">{report.assignedWorker?.name || "You"}</p>
                     </div>
                  </div>
                )}
             </div>
           </div>

           <div className="grid lg:grid-cols-3 gap-8">
             {/* Description & Metadata */}
             <div className="lg:col-span-2 space-y-6">
                <div className="p-6 rounded-2xl bg-white/5 border border-white/5">
                   <h3 className="text-xs font-black text-gray-500 uppercase tracking-[0.2em] mb-4">Description</h3>
                   <p className="text-gray-300 leading-relaxed">{report.description}</p>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                   <div className="p-4 rounded-xl bg-white/5 border border-white/5 flex items-center gap-4">
                      <div className="p-3 rounded-lg bg-emerald-500/10 text-emerald-400"><MapPin size={20}/></div>
                      <div>
                         <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Location</p>
                         <p className="text-sm font-bold text-white">{report.location || `${report.latitude}, ${report.longitude}`}</p>
                      </div>
                   </div>
                   <div className="p-4 rounded-xl bg-white/5 border border-white/5 flex items-center gap-4">
                      <div className="p-3 rounded-lg bg-blue-500/10 text-blue-400"><Activity size={20}/></div>
                      <div>
                         <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Severity</p>
                         <p className="text-sm font-bold text-white">{report.severity}</p>
                      </div>
                   </div>
                   <div className="p-4 rounded-xl bg-white/5 border border-white/5 flex items-center gap-4">
                      <div className="p-3 rounded-lg bg-purple-500/10 text-purple-400"><Trash2 size={20}/></div>
                      <div>
                         <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Waste Type</p>
                         <p className="text-sm font-bold text-white">{report.wasteType || "Mixed"}</p>
                      </div>
                   </div>
                   <div className="p-4 rounded-xl bg-white/5 border border-white/5 flex items-center gap-4">
                      <div className="p-3 rounded-lg bg-amber-500/10 text-amber-400"><User size={20}/></div>
                      <div>
                         <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Reported By</p>
                         <p className="text-sm font-bold text-white">{report.user?.name || report.user?.email || "Anonymous"}</p>
                      </div>
                   </div>
                </div>
             </div>

             {/* Evidence Images */}
             <div className="space-y-6">
                <div className="p-6 rounded-2xl bg-white/5 border border-white/5">
                   <h3 className="text-xs font-black text-gray-500 uppercase tracking-[0.2em] mb-4 flex items-center justify-between">
                     Evidence Images
                     <span className="text-emerald-400">{report.mediaUrls?.length || 0}</span>
                   </h3>
                   <div className="grid grid-cols-2 gap-3">
                      {report.mediaUrls?.map((url, index) => (
                        <div key={index} className="group relative rounded-xl overflow-hidden aspect-square border border-white/10 shadow-lg">
                          <img
                            src={`${import.meta.env.VITE_API_URL}${url}`}
                            alt="Report evidence"
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      ))}
                   </div>
                </div>
             </div>
           </div>
        </div>

        {/* Action Controls */}
        <div className="grid md:grid-cols-3 gap-8">
           {/* Update Status Card */}
           <div className="glass-panel p-8 rounded-[2rem] border border-white/10 shadow-xl animate-fade-in-up md:col-span-2">
              <h3 className="text-lg font-black text-white mb-6 flex items-center gap-3">
                 <Activity className="text-emerald-400" size={24} /> Management Actions
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                 <div className="space-y-4">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Step 1: Verification</p>
                    {!report.photoVerified ? (
                      <button
                        onClick={handleVerifyPhoto}
                        className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-2xl font-black text-sm uppercase tracking-widest transition-all"
                      >
                        <ShieldCheck className="w-5 h-5" /> Verify Photo
                      </button>
                    ) : (
                      <div className="flex items-center gap-3 px-6 py-4 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-2xl font-black text-sm uppercase tracking-widest">
                         <CheckCircle className="w-5 h-5 text-emerald-400" /> Photo Verified
                      </div>
                    )}
                 </div>

                 <div className="space-y-4">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Step 2: Update Status</p>
                    <div className="grid grid-cols-2 gap-2">
                      {["Pending", "Review", "Resolved", "Rejected"].map((status) => (
                        <button
                          key={status}
                          disabled={!report.assignedWorker}
                          onClick={() => handleStatusUpdate(status)}
                          className={`px-4 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all border ${
                            report.status === status
                              ? "bg-emerald-500 text-white border-emerald-500 shadow-lg shadow-emerald-500/20"
                              : "bg-white/5 text-gray-500 border-white/5 hover:border-emerald-500/30 hover:text-emerald-400"
                          } ${!report.assignedWorker ? "opacity-50 cursor-not-allowed" : ""}`}
                        >
                          {status}
                        </button>
                      ))}
                    </div>
                 </div>
              </div>
           </div>

           {/* Quick Stats/Tip Card */}
           <div className="glass-panel p-8 rounded-[2rem] border border-white/10 shadow-xl animate-fade-in-up text-center flex flex-col items-center justify-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center mb-4 shadow-xl shadow-emerald-500/20">
                 <Shield className="text-white" size={32} />
              </div>
              <h4 className="text-lg font-black text-white mb-2 tracking-tight">Worker Safety</h4>
              <p className="text-sm text-gray-400 leading-relaxed uppercase tracking-[0.1em] text-[10px] font-bold">
                Ensure proper PPE is worn before handling hazardous waste materials.
              </p>
           </div>
        </div>

        {/* History/Replies Section */}
        {report.replies && report.replies.length > 0 && (
          <div className="glass-panel p-8 rounded-[2rem] border border-white/10 shadow-xl animate-fade-in-up">
            <h3 className="text-lg font-black text-white mb-8 flex items-center gap-3">
               <History className="text-cyan-400" size={24} /> Resolution Timeline
            </h3>
            <div className="space-y-10">
              {report.replies.map((reply, index) => (
                <div key={index} className="relative pl-10 border-l-2 border-emerald-500/20 ml-2">
                  <div className="absolute top-0 left-[-11px] w-5 h-5 rounded-full theme-bg border-4 border-emerald-500" />
                  
                  <div className="glass-panel p-6 rounded-2xl border border-white/5">
                    <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                      <div>
                        <p className="text-xs font-black text-emerald-400 uppercase tracking-widest">{reply.type} UPDATE</p>
                        <p className="text-sm font-bold text-white mt-1">Uploaded by {reply.uploadedBy?.name || "Team"}</p>
                      </div>
                      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{new Date(reply.uploadedAt).toLocaleString()}</span>
                    </div>
                    
                    <div className="flex flex-wrap gap-3">
                      {reply.mediaUrls.map((url, idx) => (
                        <div key={idx} className="w-32 h-32 rounded-xl overflow-hidden border border-white/10 ring-2 ring-transparent hover:ring-emerald-500/50 transition-all">
                          <img
                            src={`${import.meta.env.VITE_API_URL}${url}`}
                            alt={`${reply.type} media`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
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



