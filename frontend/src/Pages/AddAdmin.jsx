import React, { useState } from "react";
import { UserPlus, AlertCircle, CheckCircle, Mail, Lock, User, Shield } from "lucide-react";
import axios from "axios";
import { Link } from "react-router-dom";

function AddAdmin() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "admin",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/admin/add`,
        formData
      );
      setSuccess("Admin added successfully!");
      setFormData({ name: "", email: "", password: "", role: "admin" });
    } catch (err) {
      setError(err.response?.data?.message || "Failed to add admin.");
    }
  };

  return (
    <div className="min-h-screen theme-bg theme-text flex items-center justify-center p-4">
      {/* Background Gradients */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />
      
      <div className="w-full max-w-md relative z-10 glass-panel p-8 rounded-3xl border border-white/5 shadow-2xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-blue-500/20 rounded-xl text-blue-400">
            <Shield size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold">Add New Admin</h2>
            <p className="text-xs text-gray-400">Grant system access to new personnel</p>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 mb-6 p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm animate-pulse">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="flex items-center gap-2 mb-6 p-3 bg-green-500/10 border border-green-500/20 text-green-400 rounded-xl text-sm animate-bounce-short">
            <CheckCircle className="w-4 h-4" />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 ml-1 uppercase">Full Name</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-blue-500/50 transition-all font-medium text-sm"
                placeholder="Admin Name"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 ml-1 uppercase">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-blue-500/50 transition-all font-medium text-sm"
                placeholder="admin@haxplore.com"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 ml-1 uppercase">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-blue-500/50 transition-all font-medium text-sm"
                placeholder="••••••••"
              />
            </div>
          </div>

          <div className="space-y-1 opacity-60">
            <label className="text-xs font-bold text-gray-500 ml-1 uppercase">Role</label>
            <div className="relative">
              <Shield className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
              <input
                type="text"
                name="role"
                value={formData.role}
                readOnly
                className="w-full bg-black/20 border border-white/5 rounded-xl py-3 pl-12 pr-4 text-gray-400 cursor-not-allowed font-medium text-sm"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl text-sm font-bold shadow-lg shadow-blue-500/20 transition-all mt-4"
          >
            Create Admin Account
          </button>
        </form>
        
        <div className="mt-6 text-center">
             <Link to="/admin/dashboard" className="text-xs font-bold text-gray-500 hover:text-white transition-colors">
                Cancel & Return
             </Link>
        </div>
      </div>
    </div>
  );
}

export default AddAdmin;
