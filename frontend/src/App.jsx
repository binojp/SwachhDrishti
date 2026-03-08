import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "./context/ThemeContext";
import Login from "./Pages/Login";
import Register from "./Pages/Register";
import Heatmap from "./Pages/Heatmap";
import Report from "./Pages/Report";
import Leaderboard from "./Pages/Leaderboard";
import Navbar from "./Navbar";
import UserDash from "./Pages/UserDash";
import AdminDash from "./Pages/AdminDash";
import AddAdmin from "./Pages/AddAdmin";
import ReportDetails from "./Pages/ReportDetails.jsx";
import UserReportDetails from "./Pages/UserReportDetails.jsx";
import WorkerReportDetails from "./Pages/WorkerReportDetails.jsx";
import RewardsPage from "./Pages/Rewards.jsx";
import Profile from "./Pages/Profile.jsx";
import WorkerDash from "./Pages/WorkerDash.jsx";
import BinMap from "./Pages/BinsMap.jsx";
import Mapauto from "./Pages/Mapauto.jsx";
import TruckMap from "./Pages/TruckMap.jsx";
import WorkerRoutes from "./Pages/WorkerRoutes.jsx";
import Home from "./Pages/Home.jsx";
import Education from "./Pages/Education.jsx";
import Campaigns from "./Pages/Campaigns.jsx";
import AdminCampaigns from "./Pages/AdminCampaigns.jsx";
import IndustrialMarket from "./Pages/IndustrialMarket.jsx";
import AdminMarketplace from "./Pages/AdminMarketplace.jsx";


export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Navbar />
        <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/heatmap" element={<Heatmap />} />
        <Route path="/report" element={<Report />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/user/dashboard" element={<UserDash />} />
        <Route path="/admin/dashboard" element={<AdminDash />} />
        <Route path="/add" element={<AddAdmin />} />
          <Route path="/admin/report/:id" element={<ReportDetails />} />
        <Route path="/worker/report/:id" element={<WorkerReportDetails />} />
        <Route path="/user/report/:id" element={<UserReportDetails />} />
        <Route path="/rewards" element={<RewardsPage />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/worker/dashboard" element={<WorkerDash />} />
        <Route path="/binmap" element={<BinMap/>} />
        <Route path="/mapauto" element={<Mapauto/>} />
        <Route path="/admin/truck-map" element={<TruckMap />} />
        <Route path="/worker/routes" element={<WorkerRoutes />} />
        <Route path="/education" element={<Education />} />
        <Route path="/campaigns" element={<Campaigns />} />
        <Route path="/admin/campaigns" element={<AdminCampaigns />} />
        <Route path="/industrial-market" element={<IndustrialMarket />} />
        <Route path="/admin/marketplace" element={<AdminMarketplace />} />

      </Routes>
    </BrowserRouter>
    </ThemeProvider>
  );
}
