import React, { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { Leaf, Mail, Lock, AlertCircle, ArrowRight } from "lucide-react";

export default function LoginForm() {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const validate = () => {
    let newErrors = {};
    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address.";
    }
    if (!formData.password.trim()) {
      newErrors.password = "Please enter your password.";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/login`,
        {
          email: formData.email,
          password: formData.password,
        },
        {
          headers: { "Content-Type": "application/json" },
        }
      );

      const { token, user } = response.data;
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));

      if (user.role === "worker") {
        navigate("/worker/dashboard");
      } else if (["admin", "superadmin"].includes(user.role)) {
        navigate("/admin/dashboard");
      } else {
        navigate("/user/dashboard");
      }
    } catch (err) {
      setErrors({
        server:
          err.response?.data?.message ||
          "Login failed. Invalid email or password.",
      });
    }
  };

  const handleQuickLogin = async (email, roleLabel) => {
    setFormData({ email, password: "123456" });
    setErrors({});
    
    // Use a small timeout to allow state to update before submit
    // although we can call handleSubmit manually or use a effect
    // But simplest is to just perform the login logic here or trigger a manual submit
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/login`,
        {
          email: email,
          password: "123456",
        },
        {
          headers: { "Content-Type": "application/json" },
        }
      );

      const { token, user } = response.data;
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));

      if (user.role === "worker") {
        navigate("/worker/dashboard");
      } else if (["admin", "superadmin"].includes(user.role)) {
        navigate("/admin/dashboard");
      } else {
        navigate("/user/dashboard");
      }
    } catch (err) {
      setErrors({
        server:
          err.response?.data?.message ||
          `Quick Login failed for ${roleLabel}.`,
      });
    }
  };

  return (
    <div className="min-h-screen theme-bg theme-text flex items-center justify-center p-4 pt-32 pb-20 relative overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-500/5 rounded-full blur-[150px]" />
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-10 animate-fade-in-down">
          <div className="inline-flex p-1 rounded-3xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 shadow-2xl backdrop-blur-md mb-6 theme-border group-hover:scale-110 transition-transform duration-500">
            <div className="p-0 rounded-2xl overflow-hidden shadow-lg shadow-emerald-500/20">
              <img src="/logo-hackathon.png" alt="Logo" className="w-16 h-16 object-contain" />
            </div>
          </div>
          <h2 className="text-4xl font-black tracking-tight theme-text mb-3">
            Welcome <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">Back</span>
          </h2>
          <p className="theme-text-muted font-medium tracking-wide">Enter your details to access your portal</p>
        </div>

        <div className="glass-panel p-10 rounded-[2.5rem] theme-border shadow-2xl backdrop-blur-2xl animate-fade-in-up delay-100 relative overflow-hidden">
          {/* Subtle light streak */}
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent" />
          
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-3">
              <label className="text-xs font-black text-gray-444 uppercase tracking-[0.2em] ml-1 opacity-70">Email Address</label>
              <div className="relative group">
                <div className="absolute inset-0 bg-emerald-500/5 rounded-2xl blur-lg opacity-0 group-focus-within:opacity-100 transition-opacity" />
                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 theme-gray-muted group-focus-within:text-emerald-400 transition-colors" size={20} />
                <input
                  type="email"
                  name="email"
                  placeholder="name@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  className="relative w-full theme-glass-overlay theme-border rounded-2xl py-4 pl-14 pr-5 theme-text placeholder-gray-600 dark:placeholder-gray-600 light:placeholder-gray-400 focus:outline-none focus:border-emerald-500/50 focus:theme-glass-overlay-hover transition-all font-medium text-sm"
                />
              </div>
              {errors.email && (
                <p className="text-[11px] text-red-400 flex items-center gap-1.5 ml-1 font-bold"><AlertCircle size={14}/> {errors.email}</p>
              )}
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center ml-1">
                <label className="text-xs font-black text-gray-444 uppercase tracking-[0.2em] opacity-70">Password</label>
                <Link to="#" className="text-[11px] font-bold text-emerald-400/70 hover:text-emerald-400 transition-colors">Forgot Password?</Link>
              </div>
              <div className="relative group">
                <div className="absolute inset-0 bg-emerald-500/5 rounded-2xl blur-lg opacity-0 group-focus-within:opacity-100 transition-opacity" />
                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-emerald-400 transition-colors" size={20} />
                <input
                  type="password"
                  name="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  className="relative w-full theme-glass-overlay theme-border rounded-2xl py-4 pl-14 pr-5 theme-text placeholder-gray-600 dark:placeholder-gray-600 light:placeholder-gray-400 focus:outline-none focus:border-emerald-500/50 focus:theme-glass-overlay-hover transition-all font-medium text-sm"
                />
              </div>
              {errors.password && (
                <p className="text-[11px] text-red-400 flex items-center gap-1.5 ml-1 font-bold"><AlertCircle size={14}/> {errors.password}</p>
              )}
            </div>

            {errors.server && (
              <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-[13px] flex items-center gap-3 animate-shake font-medium">
                <AlertCircle size={18} className="flex-shrink-0" />
                {errors.server}
              </div>
            )}

            <button
              type="submit"
              className="group relative w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-black py-4 rounded-2xl shadow-[0_10px_30px_-10px_rgba(16,185,129,0.5)] hover:shadow-[0_20px_40px_-10px_rgba(16,185,129,0.6)] hover:-translate-y-1 transition-all duration-300 text-sm flex items-center justify-center gap-3 uppercase tracking-widest overflow-hidden"
            >
              <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              <span>Sign In</span>
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </form>

          {/* Quick Login Section */}
          <div className="mt-8 pt-8 border-t border-gray-500/10">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-center theme-gray-muted mb-4">Quick Access</p>
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => handleQuickLogin("bino@app.com", "Bino")}
                className="flex flex-col items-center gap-2 p-3 rounded-2xl theme-glass-overlay theme-border hover:theme-glass-overlay-hover hover:border-emerald-500/30 transition-all group"
              >
                <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white transition-all">
                  <span className="text-[10px] font-black">U</span>
                </div>
                <span className="text-[10px] font-bold theme-text uppercase tracking-wider">User</span>
              </button>
              
              <button
                onClick={() => handleQuickLogin("bijin@app.com", "Bijin")}
                className="flex flex-col items-center gap-2 p-3 rounded-2xl theme-glass-overlay theme-border hover:theme-glass-overlay-hover hover:border-cyan-500/30 transition-all group"
              >
                <div className="w-8 h-8 rounded-full bg-cyan-500/10 flex items-center justify-center text-cyan-400 group-hover:bg-cyan-500 group-hover:text-white transition-all">
                  <span className="text-[10px] font-black">A</span>
                </div>
                <span className="text-[10px] font-bold theme-text uppercase tracking-wider">Admin</span>
              </button>

              <button
                onClick={() => handleQuickLogin("savio@app.com", "Savio")}
                className="flex flex-col items-center gap-2 p-3 rounded-2xl theme-glass-overlay theme-border hover:theme-glass-overlay-hover hover:border-indigo-500/30 transition-all group"
              >
                <div className="w-8 h-8 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white transition-all">
                  <span className="text-[10px] font-black">W</span>
                </div>
                <span className="text-[10px] font-bold theme-text uppercase tracking-wider">Worker</span>
              </button>
            </div>
          </div>

          <p className="text-center text-sm theme-gray-muted mt-8 font-medium">
            New here?{" "}
            <Link to="/register" className="text-emerald-400 hover:text-emerald-300 font-black hover:underline underline-offset-8 transition-all">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

