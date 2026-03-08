# ♻️ SwachhDrishti
### Smart Waste Management Ecosystem

## 🌟 Overview

### Problem Statement
- Urban waste management lacks real-time monitoring and data-driven decisions.
- Trucks follow fixed routes blindly → wasted fuel, high costs, overflowing bins.
- Citizens don't know nearby bin locations or which accept specific waste types.
- No easy, reliable way for citizens to report illegal dumping or unattended waste.
- Existing systems suffer from duplicate/false reports and poor verification.
- Poor coordination between authorities and workers → delayed cleanup, low transparency.
- No centralized view of waste hotspots across the city.
- Recyclable waste is not effectively recovered → lost circular economy potential.
→ Result: dirty cities, inefficient operations, environmental damage.

### Our Solution
SwachhDrishti is a unified digital platform connecting citizens, sanitation workers, and municipal authorities.

- Citizens report waste via photo/video → AI verifies, categorizes, rejects duplicates (location <500 m + image similarity).
- City-wide waste heatmap shows all reports → instant hotspot detection.
- Smart bins with real-time fill-level sensors → early overflow alerts.
- Optimized truck routes based on fill levels + reports → fewer trips, lower fuel & cost.
- Citizens locate & navigate to correct bins by waste type.
- Admins assign tasks to workers; workers upload proof photos → full transparency.
- Gamified participation: points for reports, campaigns, quizzes, responsible disposal.
- Waste marketplace: industries request recyclables → revenue for municipality.

→ Data-driven, citizen-powered, tech-enabled system for efficient, accountable, sustainable waste management.

## 🚀 Key Features

### Citizen Features
- AI-powered waste reporting (photo/video → YOLO + Gemini)
- Automatic duplicate & false report rejection
- Interactive city waste heatmap
- Smart bin locator + navigation (filter by waste type)
- Join cleanup / tree-planting campaigns
- Daily quizzes & learning modules
- Points, monthly leaderboard, badge system
- Reward redemption
- Home waste pickup scheduling

### Admin Features
- Real-time dashboard (reports, pending, resolved, active workers)
- Worker creation & credential management
- Report review, worker assignment, status updates, before-after photos
- Waste hotspot identification
- Add / monitor smart bins (fill levels)
- Create & manage campaigns + attendance marking
- Optimized truck route planning (>95% full bins priority)
- View user leaderboard

### Worker Features
- Assigned reports & home collections overview
- Task details & status update (with proof photos)
- My routes page (only high-priority full bins)

### System-wide Features
- Auto worker assignment for verified reports
- Auto route optimization
- Waste material marketplace (industry requests → verified transfer)

## 📱 Pages & Screenshots

Screenshots are available in the `/screenshots` folder in the repository.

### Authentication
- **Login / Register**  
  Unified auth page for all roles  
  ![Auth Page](screenshots/auth.png)

### User Pages
- **User Dashboard**  
  Credits, ranking, stats, mini heatmap, recent reports & updates  
  ![User Dashboard](screenshots/user-dashboard.png)

- **Report Submission**  
  Upload photo/video → AI analysis → form  
  ![Report Page](screenshots/report.png)

- **Report Details (User)**  
  Single report view with evidence & status updates  
  ![User Report Details](screenshots/user-report-details.png)

- **Heatmap**  
  City-wide waste reports map  
  ![Heatmap](screenshots/heatmap.png)

- **Bin Map**  
  Locate & filter bins by waste type + navigation  
  ![Bin Map](screenshots/binmap.png)

- **Auto Map** (navigation view)  
  Route guidance to selected bin  
  ![Auto Map](screenshots/mapauto.png)

- **Campaigns**  
  Join scheduled cleanup / plantation events  
  ![Campaigns](screenshots/campaigns.png)

- **Education**  
  Quizzes & learning modules  
  ![Education](screenshots/education.png)

- **Leaderboard**  
  Monthly points ranking  
  ![Leaderboard](screenshots/leaderboard.png)

- **Rewards**  
  Redeem points + redemption history  
  ![Rewards](screenshots/rewards.png)

- **Profile**  
  Achievements, badges, pickup scheduling  
  ![Profile](screenshots/profile.png)

### Admin Pages
- **Admin Dashboard**  
  Stats, recent reports, worker management  
  ![Admin Dashboard](screenshots/admin-dashboard.png)

- **Report Details (Admin)**  
  Review, assign worker, update status, upload proof  
  ![Admin Report Details](screenshots/admin-report-details.png)

- **Truck Map**  
  Optimized routes + bin fill levels  
  ![Truck Map](screenshots/admin-truck-map.png)

- **Admin Campaigns**  
  Create & manage events + attendance  
  ![Admin Campaigns](screenshots/admin-campaigns.png)

- **Admin Marketplace**  
  Verify & manage material requests  
  ![Admin Marketplace](screenshots/admin-marketplace.png)

- **Add Admin**  
  Create new admin accounts  
  ![Add Admin](screenshots/addadmin.png)

### Worker Pages
- **Worker Dashboard**  
  Assigned tasks, reports, collections stats  
  ![Worker Dashboard](screenshots/worker-dashboard.png)

- **Report Details (Worker)**  
  View task + update status with proof  
  ![Worker Report Details](screenshots/worker-report-details.png)

- **Worker Routes**  
  Assigned high-priority bin routes  
  ![Worker Routes](screenshots/worker-routes.png)

### Marketplace
- **Industrial Market**  
  Request recyclable materials  
  ![Marketplace](screenshots/market.png)

## 🛠️ Tech Stack
- Frontend: React.js  
- Backend: Node.js + Express  
- Database: MongoDB  
- AI: YOLO (detection), Gemini (validation)  
- Maps: Leaflet  
## 🌍 Impact & Vision
SwachhDrishti turns passive citizens into active contributors, replaces blind collection with smart routing, and creates real economic value from waste — building cleaner, greener, and more sustainable cities.