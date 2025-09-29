
# 🌱 Carbon Footprint Tracker

A full-stack web application built with the MERN stack to help users track and reduce their carbon footprint.

## ✨ Features

### Frontend (React.js)

- **Authentication System**: Secure login and signup with JWT
- **Interactive Dashboard**:
Development
------------

- Install deps in root (backend deps) and in `frontend`
- Start both with `npm run dev`
      - Achievement + goals system
- **Activity Logging**: Transportation, electricity, food consumption
- **Goals Management**: Adjust daily & monthly emission targets
- **Leaderboard**: Period filters (week / month)
- **CSV Export**: Download your activity history
- **Responsive Design**: Desktop & mobile ready

### Backend (Node.js + Express)

- **RESTful API**: Clean and documented (Swagger UI at `/api/docs`)
- **User Authentication**: JWT-based secure auth + rate limiting + helmet
- **Carbon Engine**: Versioned emission factors with metadata
- **Recommendations**: Rule-based eco-friendly tips
- **Achievements & Streaks**: Automatic awarding & progress
- **Data Export**: CSV endpoint for user data
- **Validation & Security**: Input validation, non-negative constraints

### Database (MongoDB)

- **User Management**: Secure user profiles and preferences
- **Activity Tracking**: Detailed logging of daily activities
- **Carbon Scoring**: Historical carbon footprint data

## 🚀 Getting Started

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or cloud instance)

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd carbon-footprint-tracker
   ```

2. **Install server dependencies**

   ```bash
   npm install
   ```

3. **Install client dependencies**

   ```bash
   cd client
   npm install
   cd ..
   ```

4. **Environment Setup**

   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your configuration:

   ```env
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_secure_jwt_secret
   PORT=5000
   ```

5. **Start the application**

   In development mode (runs both server and client):

   ```bash
   npm run dev
   ```

   Or run them separately:

   ```bash
   # Terminal 1: Start the server
   npm start

   # Terminal 2: Start the client
   cd client
   npm start
   ```

### Building for Production

1. **Build the React app**

   ```bash
   cd client
   npm run build
   cd ..
   ```

2. **Start the production server**

   ```bash
   npm start
   ```

## 📊 Carbon Calculation Methodology

Our calculation engine uses research-based emission factors:

- Project Structure
------------------

- `backend/` Express app, routes, models, and tests
- `frontend/` React app (Create React App)
- `index.js` server entry that imports `backend/app.js`
### Electricity

- **Electricity**: 0.5 kg CO2 per kWh (grid average)

### Food

- **Meat**: 6.61 kg CO2 per serving
- **Dairy**: 3.15 kg CO2 per serving
- **Vegetables**: 0.43 kg CO2 per serving
- **Processed Food**: 2.3 kg CO2 per serving

## 🏗️ Project Structure

```text
├── client/                 # React frontend
│   ├── public/            # Static assets
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── contexts/      # React contexts
│   │   └── ...
├── server/                # Express backend
│   ├── models/           # MongoDB models
│   ├── routes/           # API routes
│   ├── middleware/       # Custom middleware
│   └── utils/            # Utility functions
├── .env.example          # Environment variables template
├── package.json          # Server dependencies
└── README.md             # This file
```

## 🔗 API Endpoints

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Activities

- `POST /api/activities` - Log new activity
- `GET /api/activities` - Get user activities

### Dashboard

- `GET /api/dashboard` - Get dashboard data (totals, streak, breakdown, achievements, factors meta)
- `GET /api/dashboard/export` - Export activities as CSV

### Leaderboard

- `GET /api/leaderboard` - Get leaderboard rankings (query: period=week|month)

### Goals

- `GET /api/goals` - Get user goals
- `PUT /api/goals` - Update user goals

## 🌟 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🆘 Support

If you have any questions or need help, please open an issue in the repository.

---

### Start tracking your carbon footprint today and make a positive impact on our planet! 🌍
