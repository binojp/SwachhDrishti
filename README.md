# ♻️ Swachhdrishti
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
Swachhdrishti is a unified digital platform connecting citizens, sanitation workers, and municipal authorities.

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
- Optimized truck route planning (>95% full bins priority)
- View user leaderboard

### Worker Features
- Assigned reports & home collections overview
- Task details & status update (with proof photos)
- My routes page (only high-priority full bins)

### ⚙️ System-wide Features
- **Auto Worker Assignment**: Verified reports automatically notify nearest personnel.
- **Dynamic Route Optimization**: Collection paths adapt to bin fill priority.
- **Resource Marketplace**: Direct pipeline from municipal waste to industrial raw materials.

## 📱 Pages & Screenshots

Screenshots are available in the `Screenshots/` folder in the repository.

### Authentication
- **Login / Register**  
  Unified auth page for all roles  
  ![Login Page](Screenshots/Login.png)  
  ![Register Page](Screenshots/Register.png)

### User Pages
- **User Dashboard**  
  Credits, ranking, stats, mini heatmap, recent reports & updates  
  ![User Dashboard](Screenshots/userdash.png)

- **Report Submission**  
  AI Vision asset upload portal for reporting incidents.  
  ![Report Portal](Screenshots/scan.png)

- **Interactive Heatmap**  
  City-wide intelligence stream and real-time waste hotspots.  
  ![Waste Heatmap](Screenshots/userdash.png)

- **Bin Map**  
  Locate & filter bins by waste type.  
  ![Bin Type Selection](Screenshots/bins1.png)  
  ![Nearby Bins Map](Screenshots/bins2.png)

- **Auto Map (Navigation)**  
  Tactical navigation guide to the selected bin.  
  ![Bin Navigation](Screenshots/bins3.png)

- **Join Campaigns**  
  Participate in scheduled city-wide cleanup and plantation events.  
  ![User Campaigns](Screenshots/camps.png)

- **KNOWLEDGE HUB (Education)**  
  Interactive learning modules and assessments on sustainable waste management.  
  ![Education Portal](Screenshots/education.png)

- **Leaderboard**  
  Monthly points ranking  
  ![Leaderboard](Screenshots/boards.png)

- **Rewards**  
  Redeem points + redemption history  
  ![Rewards](Screenshots/rewards.png)

- **Profile & Achievements**  
  Track your impact score, earned badges, and schedule home collections.  
  ![User Profile](Screenshots/profile.png)

### Admin Pages
- **Admin Dashboard**  
  Command Center for monitoring incidents, hotspots, and active workers.  
  ![Admin Command Center](Screenshots/admindash.png)

- **Campaign Operations (Admin)**  
  Create, schedule, and initialize telemetry for participant management.  
  ![Admin Campaigns](Screenshots/admincamps.png)

- **Industrial Marketplace (Admin)**  
  Verify procurement orders and authorize material transfers.  
  ![Admin Marketplace](Screenshots/adminmarket.png)

- **Truck Map (Fleet Management)**  
  Real-time bin telemetry and optimized fleet coordination for the entire district.  
  ![Truck Map](Screenshots/admintruck.png)

### Worker Pages
- **Worker Dashboard**  
  Field Console for real-time incident monitoring and task assignment.  
  ![Worker Dashboard](Screenshots/workerdash.png)

- **Collection Routes (Worker)**  
  Tactical waypoint coordination and real-time navigation guiding for field personnel.  
  ![Worker Navigation](Screenshots/workerroutes.png)

### 🏢 Industrial Interface
- **Procurement Hub**  
  Direct bridge between circular waste streams and industrial demands.  
  ![Procurement Hub](Screenshots/market.png)

## 🛠️ Tech Stack
- Frontend: React.js  
- Backend: Node.js + Express  
- Database: MongoDB  
- AI: YOLO (detection), Gemini (validation)  
- Maps: Leaflet  
## 🌍 Impact & Vision
Swachhdrishti turns passive citizens into active contributors, replaces blind collection with smart routing, and creates real economic value from waste — building cleaner, greener, and more sustainable cities.