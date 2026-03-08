import React, { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { Leaf, User, Mail, Lock, AlertCircle, ArrowRight } from "lucide-react";

export default function RegisterForm() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "user",

  });
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const validate = () => {
    let newErrors = {};
    if (!formData.name.trim()) {
      newErrors.name = "Please enter your name.";
    }
    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address.";
    }
    if (!formData.password.trim()) {
      newErrors.password = "Please enter your password.";
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match.";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/register`,
        {
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: formData.role,

        }
      );

      const { token, user } = response.data;
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));

      navigate("/user/dashboard");
    } catch (err) {
      setErrors({
        server:
          err.response?.data?.message ||
          "Registration failed. Please try again.",
      });
    }
  };

  return (
    <div className="min-h-screen theme-bg theme-text flex items-center justify-center p-4 pt-32 pb-20 relative overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-500/5 rounded-full blur-[150px]" />
      </div>

      <div className="w-full max-w-lg relative z-10">
        <div className="text-center mb-10 animate-fade-in-down">
          <div className="inline-flex p-1 rounded-3xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 shadow-2xl backdrop-blur-md mb-6 theme-border group-hover:scale-110 transition-transform duration-500">
            <div className="p-0 rounded-2xl overflow-hidden shadow-lg shadow-emerald-500/20">
              <img src="/logo-hackathon.png" alt="Logo" className="w-16 h-16 object-contain" />
            </div>
          </div>
          <h2 className="text-4xl font-black tracking-tight theme-text mb-3">
            Join the <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">Revolution</span>
          </h2>
          <p className="theme-text-muted font-medium tracking-wide">Create your account and start your journey</p>
        </div>

        <div className="glass-panel p-10 rounded-[2.5rem] theme-border shadow-2xl backdrop-blur-2xl animate-fade-in-up delay-100 relative overflow-hidden">
          {/* Subtle light streak */}
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent" />
          
          <div className="flex gap-4 mb-6">
            <button
              type="button"
              onClick={() => setFormData({ ...formData, role: "user" })}
              className={`flex-1 py-3 rounded-2xl font-bold transition-all border ${
                formData.role === "user" 
                  ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-400" 
                  : "theme-glass-overlay theme-border theme-text-muted"
              }`}
            >
              Citizen
            </button>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, role: "industry" })}
              className={`flex-1 py-3 rounded-2xl font-bold transition-all border ${
                formData.role === "industry" 
                  ? "bg-cyan-500/20 border-cyan-500/50 text-cyan-400" 
                  : "theme-glass-overlay theme-border theme-text-muted"
              }`}
            >
              Industrial Partner
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2.5">
                <label className="text-[10px] font-black text-gray-444 uppercase tracking-[0.2em] ml-1 opacity-70">Full Name</label>
                <div className="relative group">
                  <User className="absolute left-5 top-1/2 -translate-y-1/2 theme-gray-muted group-focus-within:text-emerald-400 transition-colors" size={18} />
                  <input
                    type="text"
                    name="name"
                    placeholder="John Doe"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full theme-glass-overlay theme-border rounded-2xl py-3.5 pl-13 pr-5 theme-text placeholder-gray-600 dark:placeholder-gray-600 light:placeholder-gray-400 focus:outline-none focus:border-emerald-500/50 focus:theme-glass-overlay-hover transition-all font-medium text-sm"
                  />
                </div>
                {errors.name && (
                  <p className="text-[10px] text-red-400 flex items-center gap-1.5 ml-1 font-bold"><AlertCircle size={12}/> {errors.name}</p>
                )}
              </div>

              <div className="space-y-2.5">
                <label className="text-[10px] font-black text-gray-444 uppercase tracking-[0.2em] ml-1 opacity-70">Email Address</label>
                <div className="relative group">
                  <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-emerald-400 transition-colors" size={18} />
                  <input
                    type="email"
                    name="email"
                    placeholder="name@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full theme-glass-overlay theme-border rounded-2xl py-3.5 pl-13 pr-5 theme-text placeholder-gray-600 dark:placeholder-gray-600 light:placeholder-gray-400 focus:outline-none focus:border-emerald-500/50 focus:theme-glass-overlay-hover transition-all font-medium text-sm"
                  />
                </div>
                {errors.email && (
                  <p className="text-[10px] text-red-400 flex items-center gap-1.5 ml-1 font-bold"><AlertCircle size={12}/> {errors.email}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2.5">
                <label className="text-[10px] font-black text-gray-444 uppercase tracking-[0.2em] ml-1 opacity-70">Password</label>
                <div className="relative group">
                  <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-emerald-400 transition-colors" size={18} />
                  <input
                    type="password"
                    name="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full theme-glass-overlay theme-border rounded-2xl py-3.5 pl-13 pr-5 theme-text placeholder-gray-600 dark:placeholder-gray-600 light:placeholder-gray-400 focus:outline-none focus:border-emerald-500/50 focus:theme-glass-overlay-hover transition-all font-medium text-sm"
                  />
                </div>
                {errors.password && (
                  <p className="text-[10px] text-red-400 flex items-center gap-1.5 ml-1 font-bold"><AlertCircle size={12}/> {errors.password}</p>
                )}
              </div>

              <div className="space-y-2.5">
                <label className="text-[10px] font-black text-gray-444 uppercase tracking-[0.2em] ml-1 opacity-70">Confirm</label>
                <div className="relative group">
                  <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-emerald-400 transition-colors" size={18} />
                  <input
                    type="password"
                    name="confirmPassword"
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="w-full theme-glass-overlay theme-border rounded-2xl py-3.5 pl-13 pr-5 theme-text placeholder-gray-600 dark:placeholder-gray-600 light:placeholder-gray-400 focus:outline-none focus:border-emerald-500/50 focus:theme-glass-overlay-hover transition-all font-medium text-sm"
                  />
                </div>
                {errors.confirmPassword && (
                  <p className="text-[10px] text-red-400 flex items-center gap-1.5 ml-1 font-bold"><AlertCircle size={12}/> {errors.confirmPassword}</p>
                )}
              </div>
            </div>

            {errors.server && (
              <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-[13px] flex items-center gap-3 animate-shake font-medium">
                <AlertCircle size={18} className="flex-shrink-0" />
                {errors.server}
              </div>
            )}

            <button
              type="submit"
              className="group relative w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-black py-4 rounded-2xl shadow-[0_10px_30px_-10px_rgba(16,185,129,0.5)] hover:shadow-[0_20px_40px_-10px_rgba(16,185,129,0.6)] hover:-translate-y-1 transition-all duration-300 text-sm flex items-center justify-center gap-3 uppercase tracking-widest overflow-hidden mt-4"
            >
              <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              <span>Create Account</span>
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </form>

          <div className="flex items-center gap-4 my-8">
            <div className="h-[1px] flex-1 theme-glass-overlay" />
            <span className="text-[10px] font-black theme-gray-muted uppercase tracking-widest">or</span>
            <div className="h-[1px] flex-1 theme-glass-overlay" />
          </div>

          <p className="text-center text-sm theme-gray-muted font-medium">
            Already have an account?{" "}
            <Link to="/login" className="text-emerald-400 hover:text-emerald-300 font-black hover:underline underline-offset-8 transition-all">
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
