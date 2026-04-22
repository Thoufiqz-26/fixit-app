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

## 🚀 Quick Start (Local Development)

### Prerequisites
- **Node.js** v18 or higher → https://nodejs.org
- **MongoDB** v6+ running locally, or a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster

### 1 — Clone / place files
```bash
# If downloaded as zip, extract and enter the folder:
cd fixit-app
```

### 2 — Install dependencies
```bash
npm install
```

### 3 — Configure environment
```bash
cp .env.example .env
# Then open .env and set your values (especially JWT_SECRET and MONGO_URI)
```

Minimum `.env` for local dev:
```env
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/fixit_app
JWT_SECRET=change_this_to_a_long_random_string_min32chars
ADMIN_PHONE=9999999999
ADMIN_PASSWORD=Admin@123
```

### 4 — Start the server
```bash
# Development (auto-restart on file changes)
npm run dev

# Production
npm start
```

### 5 — Open the app
| Page | URL |
|------|-----|
| Customer App | http://localhost:5000 |
| Mechanic Registration | http://localhost:5000/mechanic.html |
| Admin Dashboard | http://localhost:5000/admin.html |
| API Health | http://localhost:5000/api/health |

> **OTP in development:** The OTP is printed to the server console and also returned in the API response as `demo_otp`. In production this field is hidden and you must integrate a real SMS provider.

---

## 🔑 Authentication Flows

### Mechanic (OTP-based)
```
1. POST /api/auth/otp/send    { phone: "9876543210" }
   → OTP printed to console (dev) / sent via SMS (prod)

2. POST /api/auth/otp/verify  { phone: "9876543210", otp: "123456" }
   → Returns { token, mechanic, isNew, profileComplete }

3. Attach token to all requests:
   Authorization: Bearer <token>
```

### User / Customer (Email + Password)
```
1. POST /api/user/register  { name, email, password, phone? }
   → Returns { token, user }

2. POST /api/user/login     { email, password }
   → Returns { token, user }
```

### Admin
```
POST /api/admin/login  { phone: "9999999999", password: "Admin@123" }
→ Returns { token }
```

---

## 📡 API Reference

### Auth  `/api/auth`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/otp/send` | — | Send OTP to phone |
| POST | `/otp/verify` | — | Verify OTP → get JWT |

### User  `/api/user`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/register` | — | Register new user |
| POST | `/login` | — | Login → get JWT |
| GET | `/me` | User | Get own profile |
| PUT | `/me` | User | Update name/phone |

### Mechanic  `/api/mechanic`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/me` | Mechanic | Get own profile |
| POST | `/profile` | Mechanic | Create / update profile |
| PUT | `/availability` | Mechanic | Toggle online/offline |
| DELETE | `/` | Mechanic | Delete own account |
| POST | `/nearby` | — | Search nearby mechanics |

### Bookings  `/api/bookings`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/` | User | Create booking |
| GET | `/my` | User | User's booking history |
| GET | `/mechanic` | Mechanic | Mechanic's job inbox |
| PUT | `/:id/status` | Mechanic | Accept / complete / cancel |
| POST | `/:id/rate` | User | Rate completed job |

### Admin  `/api/admin`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/login` | — | Admin login |
| GET | `/stats` | Admin | Dashboard stats |
| GET | `/mechanics` | Admin | Paginated mechanic list |
| PUT | `/mechanics/:id` | Admin | Edit mechanic |
| PUT | `/mechanics/:id/verify` | Admin | Toggle verified |
| PUT | `/mechanics/:id/block` | Admin | Toggle blocked |
| DELETE | `/mechanics/:id` | Admin | Delete mechanic |
| GET | `/users` | Admin | Paginated user list |
| GET | `/bookings` | Admin | All bookings (filterable) |

---

## 🛡️ Security Features

| Feature | Implementation |
|---------|----------------|
| Password hashing | bcryptjs (12 rounds) |
| JWT auth | jsonwebtoken, short expiry |
| Rate limiting | express-rate-limit (OTP: 5/hr, API: 100/15min) |
| HTTP headers | helmet |
| CORS | Whitelist via ALLOWED_ORIGINS |
| Body size limit | 10kb max payload |
| NoSQL injection | Mongoose schema typing prevents direct injection |
| Input validation | express-validator on all write endpoints |
| XSS | escHtml() on all user-generated frontend output |
| Secrets | All via .env, never committed |

---

## 🌐 Deploying to Production

### Option A — Render (free tier, easiest)
1. Push code to GitHub (make sure `.env` is in `.gitignore`)
2. Create a new **Web Service** on [render.com](https://render.com)
3. Set **Build Command**: `npm install`
4. Set **Start Command**: `npm start`
5. Add all environment variables in the Render dashboard
6. Use a [MongoDB Atlas](https://www.mongodb.com/atlas) free cluster for MONGO_URI

### Option B — Railway
```bash
npm install -g railway
railway login
railway init
railway up
# Set env vars in Railway dashboard
```

### Option C — VPS (Ubuntu)
```bash
# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2 process manager
npm install -g pm2

# Clone & setup
git clone <your-repo> fixit-app
cd fixit-app && npm install --production
cp .env.example .env && nano .env   # fill in real values

# Start with PM2
pm2 start server.js --name fixit-api
pm2 save
pm2 startup   # auto-start on reboot

# Serve frontend with Nginx (optional, for custom domain)
# Point /api → localhost:5000
# Serve public/ folder for static files
```

### Production Checklist
- [ ] `NODE_ENV=production` in .env
- [ ] `JWT_SECRET` is long (32+ chars) and random
- [ ] `ADMIN_PASSWORD` is strong and changed from default
- [ ] `MONGO_URI` points to Atlas (not localhost)
- [ ] `ALLOWED_ORIGINS` contains only your real domain(s)
- [ ] SMS provider integrated (replace console.log OTP in authController.js)
- [ ] `logs/` directory writable by the process
- [ ] HTTPS enabled (Render/Railway handle this automatically)

---

## 📱 SMS Integration (Production)

In `controllers/authController.js`, find the comment block:

```js
// ── PRODUCTION: swap this block for Twilio / Fast2SMS / MSG91 ──
logger.info(`📱 OTP for +91-${phone} → ${otp} (expires 5 min)`);
// ────────────────────────────────────────────────────────────────
```

Replace with your SMS provider. Example for **Fast2SMS** (popular in India):
```js
await fetch('https://www.fast2sms.com/dev/bulkV2', {
  method: 'POST',
  headers: { authorization: process.env.FAST2SMS_API_KEY },
  body: new URLSearchParams({
    route: 'otp', variables_values: otp,
    flash: 0, numbers: phone
  })
});
```

Add `FAST2SMS_API_KEY=your_key` to your `.env`.

---

## 🧰 Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js 18+ |
| Framework | Express 4 |
| Database | MongoDB + Mongoose |
| Auth | JWT + bcryptjs |
| Validation | express-validator |
| Security | helmet, cors, express-rate-limit |
| Logging | Winston + Morgan |
| Frontend | Vanilla JS (no framework, no build step) |
| Fonts | Google Fonts (Syne + DM Sans) |

---

## 🐛 Troubleshooting

**`MongoDB connection error`**  
→ Make sure MongoDB is running: `sudo systemctl start mongod` (Linux) or open MongoDB Compass.

**OTP not arriving in production**  
→ Integrate a real SMS provider (see SMS section above). In dev, check the server console for `📱 OTP for...`.

**`Token invalid or expired`**  
→ Tokens expire in 7 days (mechanics) or as configured. Clear `localStorage` and log in again.

**Port already in use**  
→ Change `PORT=5001` in your `.env`.

**Admin login fails**  
→ Make sure `ADMIN_PHONE` and `ADMIN_PASSWORD` in `.env` match what you type in the login form.

---

## 📄 License

MIT — free to use, modify, and deploy.
