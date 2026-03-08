import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  MapPin,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  ArrowLeft,
  Calendar,
  Image as ImageIcon,
  MessageCircle
} from "lucide-react";

export default function UserReportDetails() {
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

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case "resolved":
        return <CheckCircle className="w-4 h-4 text-emerald-400" />;
      case "reported":
        return <AlertCircle className="w-4 h-4 text-blue-400" />;
      case "pending":
        return <Clock className="w-4 h-4 text-amber-400" />;
      case "rejected":
        return <XCircle className="w-4 h-4 text-red-400" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "resolved":
        return "bg-emerald-500/20 text-emerald-400 border-emerald-500/50";
      case "reported":
        return "bg-blue-500/20 text-blue-400 border-blue-500/50";
      case "pending":
        return "bg-amber-500/20 text-amber-400 border-amber-500/50";
      case "rejected":
        return "bg-red-500/20 text-red-400 border-red-500/50";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/50";
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case "high":
        return "bg-red-500/20 text-red-400 border-red-500/50";
      case "medium":
        return "bg-amber-500/20 text-amber-400 border-amber-500/50";
      case "low":
        return "bg-emerald-500/20 text-emerald-400 border-emerald-500/50";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/50";
    }
  };

  if (loading) return (
    <div className="min-h-screen theme-bg flex items-center justify-center">
      <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"/>
    </div>
  );

  if (error) return (
    <div className="min-h-screen theme-bg flex items-center justify-center text-red-400 p-4">
       <AlertCircle className="mr-2"/> {error}
    </div>
  );

  if (!report) return (
    <div className="min-h-screen theme-bg flex items-center justify-center text-gray-400">
      Report not found
    </div>
  );

  return (
    <div className="min-h-screen theme-bg theme-text p-4 pt-24 pb-12">
      
      {/* Header */}
      <div className="max-w-4xl mx-auto mb-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 theme-text-muted hover:theme-text transition-colors mb-4"
        >
          <ArrowLeft className="w-5 h-5" /> Back to Dashboard
        </button>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
           <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm font-bold theme-text-muted uppercase tracking-widest mb-1">Incident Report #{report._id.slice(-6)}</p>
              <h1 className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400 break-words">
                {report.title}
              </h1>
           </div>
           <div className="flex flex-wrap gap-2">
              <span className={`px-2 sm:px-3 py-1 text-[10px] sm:text-xs font-bold uppercase rounded-full border flex items-center gap-1 sm:gap-2 ${getStatusColor(report.status)}`}>
                 {getStatusIcon(report.status)} {report.status}
              </span>
              <span className={`px-2 sm:px-3 py-1 text-[10px] sm:text-xs font-bold uppercase rounded-full border flex items-center gap-1 sm:gap-2 ${getPriorityColor(report.severity)}`}>
                 {report.severity} Priority
              </span>
           </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
         {/* Main Details */}
         <div className="md:col-span-2 space-y-6">
            <div className="glass-panel p-4 sm:p-6 rounded-2xl theme-border">
               <h3 className="font-bold text-base sm:text-lg mb-3 sm:mb-4 flex items-center gap-2">
                 <AlertCircle className="text-emerald-400 w-4 h-4 sm:w-5 sm:h-5"/> Description
               </h3>
               <p className="theme-text-secondary leading-relaxed text-sm sm:text-base">
                  {report.description}
               </p>
               
               <div className="mt-4 sm:mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="p-3 theme-glass-overlay rounded-xl">
                     <p className="text-xs theme-text-muted font-bold uppercase mb-1">Type</p>
                     <p className="theme-text font-bold text-sm sm:text-base">{report.type}</p>
                  </div>
                  <div className="p-3 theme-glass-overlay rounded-xl">
                     <p className="text-xs theme-text-muted font-bold uppercase mb-1">Date Reported</p>
                     <p className="theme-text font-bold flex items-center gap-2 text-sm sm:text-base">
                       <Calendar className="w-3 h-3 sm:w-4 sm:h-4 theme-text-muted"/>
                       {new Date(report.createdAt).toLocaleDateString()}
                     </p>
                  </div>
                  <div className="col-span-1 sm:col-span-2 p-3 theme-glass-overlay rounded-xl">
                     <p className="text-xs theme-text-muted font-bold uppercase mb-1">Location</p>
                     <p className="theme-text font-bold flex items-center gap-2 text-sm sm:text-base break-words">
                       <MapPin className="w-3 h-3 sm:w-4 sm:h-4 text-emerald-400 shrink-0"/>
                       <span className="break-words">{report.location || `${report.latitude}, ${report.longitude}`}</span>
                     </p>
                  </div>
               </div>
            </div>

            {/* Evidence Section */}
            <div className="glass-panel p-4 sm:p-6 rounded-2xl theme-border">
               <h3 className="font-bold text-base sm:text-lg mb-3 sm:mb-4 flex items-center gap-2">
                 <ImageIcon className="text-blue-400 w-4 h-4 sm:w-5 sm:h-5"/> Evidence
               </h3>
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                 {report.mediaUrls.map((url, index) => (
                   <div key={index} className="relative group overflow-hidden rounded-xl theme-border theme-glass-overlay aspect-square flex items-center justify-center">
                      <img
                        src={`${import.meta.env.VITE_API_URL}${url}`}
                        alt="Evidence"
                        className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                         <a href={`${import.meta.env.VITE_API_URL}${url}`} target="_blank" rel="noreferrer" className="text-xs text-white underline">View Full</a>
                      </div>
                   </div>
                 ))}
               </div>
            </div>
         </div>

         {/* Sidebar / Replies */}
         <div className="space-y-6">
            <div className="glass-panel p-4 sm:p-6 rounded-2xl theme-border">
               <h3 className="font-bold text-base sm:text-lg mb-3 sm:mb-4 flex items-center gap-2">
                 <MessageCircle className="text-amber-400 w-4 h-4 sm:w-5 sm:h-5"/> Updates
               </h3>
               <div className="space-y-4 sm:space-y-6 relative ml-2">
                  <div className="absolute left-[-5px] top-2 bottom-2 w-[2px] theme-border" />
                  
                  {report.replies?.length ? (
                    report.replies.map((reply, index) => (
                      <div key={index} className="relative pl-4 sm:pl-6 animate-fade-in-up" style={{ animationDelay: `${index * 100}ms` }}>
                         <div className="absolute left-[-9px] top-1 w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                         
                         <div className="mb-2">
                            <span className="text-[10px] sm:text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full inline-block mb-1">
                               {reply.type} Update
                            </span>
                            <p className="text-[10px] theme-text-muted">
                               {new Date(reply.uploadedAt).toLocaleString()}
                            </p>
                         </div>
                         
                         <div className="grid grid-cols-2 gap-2 mt-2">
                            {reply.mediaUrls.map((url, idx) => (
                              <img
                                key={idx}
                                src={`${import.meta.env.VITE_API_URL}${url}`}
                                alt="Update media"
                                className="w-full h-16 sm:h-20 object-cover rounded-lg theme-border cursor-pointer hover:border-emerald-500/50 transition-colors"
                              />
                            ))}
                         </div>
                      </div>
                    ))
                  ) : (
                    <div className="pl-4 sm:pl-6 theme-text-muted text-xs sm:text-sm italic">
                       No updates from admin yet. We are reviewing your report.
                    </div>
                  )}
               </div>
            </div>
         </div>
      </div>
    </div>
  );
}
