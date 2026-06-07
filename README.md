<div align="center">

# 🔱 KumbhSaarthi.AI
**Smart Volunteer Deployment & Workforce Optimization**

[![Live Demo](https://img.shields.io/badge/Live_Demo-Access_Dashboard-10b981?style=for-the-badge)](https://kumbh-saarthi.vercel.app/)
[![Video Presentation](https://img.shields.io/badge/Video-Watch_Demo-blue?style=for-the-badge)](https://drive.google.com/file/d/19y4XQd0Cu8N9CEjO4t6tZ6TY0oC7F2xT/view?usp=drive_link)

🏆 **Built for the Mahakumbh Innovation Hackathon 2028** 🏆

<img src="assets/KumbhSaarthi.AI%20Dashboard.png" alt="KumbhSaarthi.AI Dashboard" width="100%" style="border-radius: 10px;"/>

*A real-time, AI-powered Command & Control platform engineered to solve the massive logistical challenge of managing workforce deployment during the world's largest human gathering.*

</div>

---

## 🚨 The Challenge
Managing a mega-event like Mahakumbh requires split-second coordination. Traditional dispatch frameworks are slow, siloed, and completely blind to volunteer fatigue or real-time distribution. This leads to workforce burnout and critical delays during emergencies across massive geographic sectors.

## 💡 The Solution
**KumbhSaarthi.AI** is a cloud-native, real-time tactical dashboard designed to seamlessly recruit, monitor, optimize, and allocate volunteer forces. It replaces static walkie-talkie dispatches with an intelligent, data-driven optimization engine.

### ✨ Key Features
* **📍 Real-Time Telemetry:** Live interactive map (powered by Leaflet) with 10-second polling to monitor volunteer positions across all active sectors.
* **🧠 AI-Optimized Dispatch:** Automatically matches personnel to emergencies based on exact skills, geographical proximity, and current fatigue levels.
* **❤️ Fatigue Management:** Actively tracks volunteer health status (Active, Resting, Exhausted) to prevent workforce burnout.
* **⚡ Instant Onboarding:** Seamless portal that recruits and injects new volunteers directly into the live grid and database.
* **⚙️ Dynamic Alert Control:** Logs crises, executes deployments, and auto-updates PostgreSQL database states in real-time.

---

## 🧮 The Optimization Engine

Rather than blindly broadcasting alerts, the FastAPI backend instantly evaluates the entire active grid to calculate a customized match score for every incident using the following formula:

> **Match Score = (0.50 × Skill Match) + (0.30 × Proximity Penalty) + (0.20 × Fatigue Tracking)**

* **Skill (50%):** Guarantees precise expertise (Medical, Crowd Control, etc.) reaches the crisis immediately.
* **Proximity (30%):** Minimizes travel distance and response times across the sector coordinates.
* **Fatigue (20%):** Prioritizes fresh personnel over exhausted units to ensure sustainable operations.

---

## 🛠️ Technology Stack

**Frontend:**
* React (Vite)
* Tailwind CSS
* Leaflet.js (Geospatial Mapping)
* Axios (API Client)

**Backend & Database:**
* Python (FastAPI)
* SQLAlchemy (ORM) & Pydantic (Validation)
* PostgreSQL (Hosted on Neon serverless DB)

**Deployment:**
* Vercel (Frontend CI/CD)
* Render (Backend API Hosting)

---

## 📂 Project Structure

```text
kumbhsaarthi/
├── frontend/                 # React + Vite application
│   ├── public/               # Static assets
│   ├── src/
│   │   ├── assets/           # UI Images, Icons, and SVGs
│   │   ├── components/       # Reusable UI components (Modals, Map, Alerts)
│   │   ├── services/         # API integration (Axios client setup)
│   │   ├── App.jsx           # Main Command Center UI & Map Logic
│   │   ├── index.css         # Tailwind global styles
│   │   └── main.jsx          # React DOM entry point
│   ├── .env.example          # Frontend environment variables
│   ├── package.json          # Node dependencies
│   ├── tailwind.config.js    # Tailwind configuration
│   └── vite.config.js        # Vite bundler config
├── backend/                  # FastAPI Application
│   ├── core/                 # Config, security, and CORS settings
│   ├── models/               # SQLAlchemy Database Models
│   ├── schemas/              # Pydantic schemas for data validation
│   ├── main.py               # API Routes & AI Optimization Engine
│   ├── database.py           # Neon PostgreSQL Connection setup
│   ├── requirements.txt      # Python dependencies
│   └── .env.example          # Backend environment variables
└── README.md                 # Project documentation
```

---

## 🚀 Getting Started (Local Development)

To run this project locally, follow these steps:

### 1. Clone the repository
```bash
git clone https://github.com/your-username/kumbhsaarthi.git
cd kumbhsaarthi
```

### 2. Setup the Backend
```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # On Windows use `venv\Scripts\activate`
pip install -r requirements.txt
```
*Create a `.env` file in the backend directory and add your Neon PostgreSQL string:*
```env
DATABASE_URL="postgresql://user:password@ep-cool-sun-123456.us-east-2.aws.neon.tech/dbname"
```
*Start the server:*
```bash
uvicorn main:app --reload
```

### 3. Setup the Frontend
Open a new terminal window:
```bash
cd frontend
npm install
npm run dev
```
*The frontend will be available at `http://localhost:5173` and the backend API documentation at `http://localhost:8000/docs`.*

---

## 📸 Screenshots

| Tactical Map & HUD | AI Dispatch Recommendations |
| :---: | :---: |
| <img src="assets/Map-View.png" alt="Map View" width="100%" style="border-radius: 10px;"> | <img src="assets/Dispatch-Engine.png" alt="Dispatch Engine" width="100%" style="border-radius: 10px;"> |

---

<div align="center">
  
**Engineered for Scale. Designed for Humanity.** <br>
Built by K Dheeraj

</div>