# ⚡ PowerHouse

> A smart electricity bill tracker and energy management dashboard tailored for TNEB (Tamil Nadu Electricity Board) consumers.

PowerHouse helps households monitor their bi-monthly electricity consumption, understand TNEB slab pricing, predict future bills, and simulate the impact of new appliances — all from a clean, modern dashboard.

---

## ✨ Features

| Feature | Description |
|---|---|
| **Dashboard Overview** | At-a-glance stats — last cycle bill, units consumed, TNEB slab status, and month-over-month change |
| **What-If Calculator** | Predict your bill cost for any given consumption before the cycle ends |
| **Budget Tracker** | Set a monthly spending cap and track how close you are via a live progress bar |
| **My Bills** | Log, view, and delete bi-monthly electricity bills with auto-calculated TNEB cost |
| **Appliance Simulator** | Add appliances by wattage and daily usage to project how they affect your next bill |
| **Analytics** | Deep insights — average units/cost per cycle, peak & floor usage, dual-axis charts, trend detection, and penalty-hit count |
| **Authentication** | Secure sign-up and login with bcrypt-hashed passwords |

---

## 🛠️ Tech Stack

**Frontend**
- HTML5, CSS3 (Vanilla), JavaScript (ES6+)
- [Chart.js](https://www.chartjs.org/) — consumption and analytics charts
- [Inter](https://fonts.google.com/specimen/Inter) (Google Fonts) — typography

**Backend**
- [Node.js](https://nodejs.org/) + [Express.js](https://expressjs.com/) — REST API server
- [MongoDB Atlas](https://www.mongodb.com/atlas) + [Mongoose](https://mongoosejs.com/) — cloud database
- [bcryptjs](https://www.npmjs.com/package/bcryptjs) — password hashing
- [dotenv](https://www.npmjs.com/package/dotenv) — environment variable management

---

## 📁 Project Structure

```
PowerHouse/
├── server.js              # Express server, API routes, Mongoose schemas
├── package.json
├── .env                   # Environment variables (not committed)
└── public/
    ├── index.html         # Landing / home page
    ├── login.html         # Sign in & sign up
    ├── dashboard.html     # Overview, What-If Calculator, Budget Tracker
    ├── bills.html         # Bill log — add & delete records
    ├── appliances.html    # Appliance usage simulator
    ├── analytics.html     # Charts and deep insights
    ├── script.js          # All client-side logic (shared across pages)
    └── style.css          # Global design system & component styles
```

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) v18+
- A [MongoDB Atlas](https://www.mongodb.com/atlas) account with a cluster and connection URI

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/rakshithshakkthi/Powerhouse.git
cd Powerhouse

# 2. Install dependencies
npm install

# 3. Create your environment file
cp .env.example .env
```

### Environment Variables

Create a `.env` file in the project root:

```env
MONGO_URI=your_mongodb_atlas_connection_string
PORT=3000
```

### Run the App

```bash
node server.js
```

Then open your browser and go to: **http://localhost:3000**

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/signup` | Register a new user |
| `POST` | `/api/login` | Authenticate an existing user |
| `GET` | `/api/bills/:userId` | Fetch all bills for a user |
| `POST` | `/api/bills` | Log a new bill (auto-calculates TNEB cost) |
| `DELETE` | `/api/bills/:id` | Delete a bill record |
| `POST` | `/api/predict` | Predict bill cost for a given number of units |

---

## 💡 TNEB Slab Pricing Logic

PowerHouse automatically calculates your bill using official TNEB bi-monthly slab rates:

| Consumption | Rate per Unit |
|---|---|
| 0 – 100 units | Free |
| 101 – 400 units | ₹2.25 (safe) / ₹4.50 (penalty) |
| 401 – 500 units | ₹4.50 (safe) / ₹6.00 (penalty) |
| 500+ units | ₹8.00 |

> **Safe slab**: consumption ≤ 500 units (bi-monthly)
> **Penalty slab**: consumption > 500 units triggers higher retrospective rates on all slabs

---

## 📸 Pages

- **`/`** — Landing page
- **`/login.html`** — Authentication (sign in / create account)
- **`/dashboard.html`** — Energy overview & bill predictor
- **`/bills.html`** — Full bill history
- **`/appliances.html`** — Appliance consumption simulator
- **`/analytics.html`** — Insights & trends

---

