# 🔧 FixIt — On-Demand Mechanic & Home Service Platform

> Production-ready Node.js + Express + MongoDB + Vanilla JS application.  
> Book verified mechanics, electricians, plumbers & more — right from your browser.

---

## 📁 Project Structure

```
fixit-app/
├── server.js                  ← Entry point
├── package.json
├── .env.example               ← Copy to .env and fill in
├── .gitignore
│
├── config/
│   └── db.js                  ← MongoDB connection
│
├── models/
│   ├── User.js                ← Customer model (bcrypt, email/pass)
│   ├── Mechanic.js            ← Mechanic model (OTP auth, geo)
│   ├── Booking.js             ← Booking/job model
│   └── OTP.js                 ← OTP with TTL auto-expiry
│
├── controllers/
│   ├── authController.js      ← OTP send / verify
│   ├── userController.js      ← User register / login / profile
│   ├── mechanicController.js  ← Mechanic profile / availability / search
│   ├── bookingController.js   ← Booking CRUD + ratings
│   └── adminController.js     ← Admin dashboard + management
│
├── routes/
│   ├── auth.js                ← /api/auth/*
│   ├── user.js                ← /api/user/*
│   ├── mechanic.js            ← /api/mechanic/*
│   ├── booking.js             ← /api/bookings/*
│   └── admin.js               ← /api/admin/*
│
├── middleware/
│   ├── auth.js                ← JWT guards (auth, userAuth, mechanicAuth, adminAuth)
│   ├── rateLimiter.js         ← generalLimiter / authLimiter / otpLimiter
│   └── errorHandler.js        ← Global error handler
│
├── utils/
│   ├── jwt.js                 ← signToken / verifyToken
│   ├── sanitize.js            ← sanitizePhone helper
│   └── logger.js              ← Winston logger
│
├── logs/                      ← Created automatically in production
│
└── public/                    ← Frontend (served as static files)
    ├── index.html             ← Customer-facing app
    ├── mechanic.html          ← Mechanic registration / dashboard
    └── admin.html             ← Admin control panel
```

---


