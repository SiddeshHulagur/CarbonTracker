
# 🌱 Carbon Footprint Tracker

A full-stack web application built with the MERN stack to help users track and reduce their carbon footprint.

## ✨ Features

### Frontend (React.js)
- **Authentication System**: Secure login and signup with JWT
- **Interactive Dashboard**: 
  - Real-time carbon footprint overview
  - Daily, weekly, and monthly emissions tracking
  - Interactive charts showing emissions trends
  - Personalized eco-friendly tips
  - Achievement system with goals
- **Activity Logging**: Easy-to-use forms for logging:
  - Transportation (car, bike, bus, walking)
  - Electricity usage
  - Food consumption
- **Leaderboard**: Compare your environmental impact with other users
- **Responsive Design**: Works perfectly on desktop and mobile devices

### Backend (Node.js + Express)
- **RESTful API**: Clean and well-documented endpoints
- **User Authentication**: JWT-based secure authentication
- **Carbon Calculation Engine**: Accurate CO2 emission calculations
- **Smart Suggestions**: Rule-based eco-friendly recommendations
- **Data Analytics**: Comprehensive tracking and reporting

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
   ```
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

### Transportation
- **Car**: 0.21 kg CO2 per km
- **Bus**: 0.089 kg CO2 per km  
- **Bike/Walking**: 0 kg CO2 per km

### Electricity
- **Electricity**: 0.5 kg CO2 per kWh (grid average)

### Food
- **Meat**: 6.61 kg CO2 per serving
- **Dairy**: 3.15 kg CO2 per serving
- **Vegetables**: 0.43 kg CO2 per serving
- **Processed Food**: 2.3 kg CO2 per serving

## 🏗️ Project Structure

```
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
- `GET /api/dashboard` - Get dashboard data

### Leaderboard
- `GET /api/leaderboard` - Get leaderboard rankings

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

**Start tracking your carbon footprint today and make a positive impact on our planet! 🌍**
