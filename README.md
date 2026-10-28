# FitTrack — Personal Fitness Tracking Application

FitTrack is a modern, full-stack fitness tracking web application built using the MERN stack (**MongoDB, Express.js, React.js, and Node.js**). Designed with a dark gym-aesthetic theme, lime-green neon accents, responsive layout, and interactive Recharts data visualizations.

---

## 🌟 Key Features

### 1. User Authentication & Profile
- **Registration**: Collects Full Name, Email, Password, Age, Height, Current Weight, Fitness Goal (*Muscle Gain*, *Fat Loss*, *Maintenance*), Preferred Workout Split, Daily Calorie Target, and Daily Water Target.
- **Security**: Passwords hashed with `bcryptjs` (salt factor 10), never exposed in API responses. Session management via JWT with dual support for HttpOnly cookies and `Authorization: Bearer <token>` headers.
- **Multi-Tenant Data Isolation**: Every document strictly associates with `req.user.id`. Users can only access and modify their own fitness records.
- **Profile Customization**: Update biometrics, goals, split routines, and measurement units (`kg` / `lbs`). Historical weight measurements are preserved when updating current weight.

### 2. Interactive Dashboard
- **Real-Time KPIs**: Current body weight, period weight delta, today's suggested workout, total workouts completed, calories consumed today vs target & remaining, water consumed today vs target & remaining.
- **Quick-Action Modals**: One-click logging for **Start Workout**, **Log Workout**, **Log Food**, **Update Weight**, and **Log Water**.
- **Recent Session History**: Quick overview of recent workouts with volume and duration.
- **Real Data Only**: Informative empty states when new users register; no hardcoded or fabricated statistics.

### 3. Workout Split System
- Predefined splits with curated exercises:
  - **Push / Pull / Legs (PPL)**: Barbell Bench Press, Incline DB Press, Shoulder Press, Lateral Raises, Triceps Pushdowns, Overhead Extensions, Pull-ups, Lat Pulldowns, Seated Cable Rows, Romanian Deadlifts, Barbell Squats, Leg Press, etc.
  - **Upper / Lower Split**: Dedicated upper body and lower body days with compound lifts.
  - **Bro Split**: Chest, Back, Shoulders, Arms, and Legs.
  - **Full Body**: Compound-focused whole-body workouts.
  - **Custom Split**: User-defined training days and assigned movements.
- Users can switch their split anytime without losing historical workout logs.

### 4. Exercise Library & Custom Movements
- Database of 30+ categorized exercises with muscle groups, equipment types, and movement instructions.
- Search and multi-criteria filtering by muscle group, category, and equipment.
- **Custom Exercises**: Users can add their own exercises saved to MongoDB, private to their account.

### 5. Workout Logging System
- **Live Active Session**: Real-time workout timer, set-by-set reps & weight tracking, completion checkmarks, set deletion, dynamic exercise addition from the library, and session notes.
- **Manual Log Mode**: Record a workout completed in the past without running a live timer.
- **Volume Computation**: Automatic volume calculation ($\text{Sets} \times \text{Reps} \times \text{Weight}$). Clear handling for bodyweight movements (external load = 0 kg).
- **Duplicate Protection**: Backend safeguard against accidental double-submissions.
- **Workout History**: Filter by split type or date range, expand detailed set logs, and delete workouts with confirmation (cascades to progress analytics).

### 6. Calorie & Food Tracking
- Meal category categorization: *Breakfast*, *Lunch*, *Dinner*, and *Snacks*.
- Nutrition breakdown: Calories, Protein (g), Carbohydrates (g), and Fat (g).
- **Verified Preset Search**: Instant autocomplete search for popular staples (Chicken Breast, Brown Rice, Eggs, Oatmeal, Whey Protein, Salmon, etc.) + full manual custom food entry.
- Date picker to view and edit nutrition for any day.
- Informational tracking notice emphasizing healthy lifestyle choices over medical advice.

### 7. Body Weight Tracking
- Log weight measurements with date, notes, and unit toggle (`kg` / `lbs`).
- Interactive line graph visualizing body weight trajectory over 7, 30, 90 days, or all time.
- Delta calculation comparing current weight with previous measurement.
- Chronological history table with edit and delete capabilities.

### 8. Water Intake & 2-Hour Reminders
- Daily hydration target progress bar with quick buttons (`+250ml`, `+500ml`, `+750ml`, `+1000ml`) and custom quantities.
- 7-day hydration bar graph and daily log entries.
- **Configurable Reminder System**:
  - Reminds users to drink water every 2 hours (customizable interval: 30, 60, 90, 120, 180, 240 mins).
  - Waking hours schedule (default 8:00 AM to 10:00 PM) to avoid quiet hours.
  - Native browser notification permission request with in-app notification fallback.
  - Reminder preferences persisted in MongoDB.

### 9. Progress Analytics & Visualizations (Recharts)
- **Strength Progression Graph**: Select any movement (e.g. *Barbell Bench Press*) and track max weight lifted over time.
- **Training Volume Graph**: Session-by-session volume load over time.
- **Workout Frequency**: Weekly/monthly workout consistency bars.
- **Muscle Group Distribution**: Pie chart displaying training balance across Chest, Back, Legs, Shoulders, Arms, and Core.
- **Time Window Filters**: Last 7 days, 30 days, 90 days, and All History.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, Vite, Tailwind CSS, React Router DOM v6, Axios, Recharts, Lucide React |
| **Backend** | Node.js, Express.js, REST API Architecture, CORS, Cookie-Parser, In-Memory Rate Limiter |
| **Database** | MongoDB Atlas, Mongoose ODM, Embedded MongoDB Memory Server (development fallback) |
| **Auth & Security** | JWT (JSON Web Tokens), bcryptjs password hashing, HttpOnly cookies, input sanitization |
| **Testing** | Node.js native test runner (`node:test`, `node:assert`), Supertest |

---

## 📂 Project Structure

```
fittrack/
├── client/                     # Frontend React + Vite Application
│   ├── public/
│   ├── src/
│   │   ├── components/         # Reusable UI widgets & layout
│   │   │   └── common/         # Navbar, Sidebar, Layout, Modal, ConfirmDialog, Spinner, EmptyState
│   │   ├── context/            # Global State: AuthContext, NotificationContext, WaterReminderContext
│   │   ├── pages/              # Dashboard, Workouts, ActiveWorkout, History, Library, Nutrition, Weight, Water, Progress, Profile, Login, Register
│   │   ├── services/           # Axios API modules (auth, workout, exercise, nutrition, weight, water, progress)
│   │   ├── App.jsx             # Router and route guards
│   │   ├── index.css           # Tailwind directives and custom dark glassmorphism styles
│   │   └── main.jsx
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
├── server/                     # Backend Node + Express Application
│   ├── src/
│   │   ├── config/             # Database connection & JWT utilities
│   │   ├── controllers/        # Business logic for all 8 domains
│   │   ├── middleware/         # Auth verification, rate limiting, error handling
│   │   ├── models/             # Mongoose schemas: User, Exercise, WorkoutSession, FoodEntry, WeightMeasurement, WaterEntry
│   │   ├── routes/             # Express route modules
│   │   ├── seeds/              # Predefined exercises & workout splits
│   │   ├── tests/              # Automated backend test suite (24 tests)
│   │   └── index.js            # Express server entry point
│   ├── .env.example            # Backend environment template
│   └── package.json
├── .env.example                # Root environment template
├── .gitignore
├── package.json                # Root scripts to orchestrate client & server
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: v18.0.0 or higher (v24.x tested and verified)
- **npm**: v9.0.0 or higher
- **MongoDB Atlas** account (optional for local dev; if omitted, FitTrack starts an embedded MongoDB instance automatically!)

---

### Step 1: Clone or Navigate to Project
```bash
cd "c:\Users\Sai navatej\Documents\term 1 mern project"
```

### Step 2: Configure Environment Variables

Create `server/.env` based on `server/.env.example`:

```bash
# In server directory:
PORT=5000
NODE_ENV=development

# MongoDB Atlas Connection String:
# If you have an Atlas cluster, paste it here:
# MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/fittrack?retryWrites=true&w=majority
# If left blank, FitTrack automatically starts an in-memory embedded MongoDB server:
MONGODB_URI=

# JWT Secrets
JWT_SECRET=fittrack_super_secure_jwt_secret_key_change_in_production_123456
JWT_EXPIRES_IN=7d

# Frontend CORS
CLIENT_URL=http://localhost:5173
```

> **Note on MongoDB**: FitTrack is configured so you do **not** need a local `mongod` service installed or immediate Atlas credentials to test it. If `MONGODB_URI` is blank, it automatically launches an embedded in-memory MongoDB database. When you are ready for production, simply provide your MongoDB Atlas URI in `server/.env`.

---

### Step 3: Install Dependencies

```bash
# Install Server Dependencies
cd server
npm install

# Install Client Dependencies
cd ../client
npm install
```

---

### Step 4: Run the Application

You can start the backend and frontend in separate terminals:

#### Terminal 1 — Start Backend Server
```bash
cd server
npm run dev
```
*Backend runs on: `http://localhost:5000`*

#### Terminal 2 — Start Frontend Client
```bash
cd client
npm run dev
```
*Frontend runs on: `http://localhost:5173`*

Open your browser and navigate to `http://localhost:5173`.

---

## 🧪 Running Automated Tests

FitTrack includes a comprehensive automated test suite testing user registration, password hashing, JWT authorization, workout session logging, volume math, multi-tenant isolation, nutrition calculations, weight deltas, water tracking, and progress metrics.

Run the test suite:
```bash
cd server
npm test
```

### Test Results
```
✔ GET /api/health should return status healthy
✔ POST /api/auth/register should register user 1 with full fitness profile
✔ POST /api/auth/register should reject duplicate email
✔ POST /api/auth/register should register user 2 for multi-tenant isolation testing
✔ POST /api/auth/login should authenticate user with valid credentials
✔ POST /api/auth/login should reject invalid password
✔ GET /api/auth/me should fetch profile when authenticated
✔ GET /api/auth/me should fail without token
✔ GET /api/workouts/splits should return predefined splits
✔ GET /api/exercises should return predefined exercises
✔ POST /api/exercises should allow user to create custom exercise
✔ POST /api/workouts should save completed workout session with sets, reps, and weights
✔ GET /api/workouts should return workout in user history
✔ GET /api/workouts/:id should forbid user 2 from accessing user 1 workout
✔ DELETE /api/workouts/:id should forbid user 2 from deleting user 1 workout
✔ POST /api/nutrition should log a food item with macros
✔ GET /api/nutrition should return food entries and accurate calculated daily totals
✔ POST /api/weight should add a new measurement and update user current weight
✔ GET /api/weight should return history and difference from previous
✔ POST /api/water should log water intake
✔ GET /api/water/daily should return consumed and remaining water
✔ PUT /api/users/reminder-preferences should update reminder interval and waking hours
✔ GET /api/progress/dashboard should aggregate live database numbers
✔ GET /api/progress/strength should return progression data for Barbell Bench Press

ℹ tests 24 | pass 24 | fail 0
```

---

## 📡 REST API Reference

### Authentication (`/api/auth`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | Public | Register new user with full fitness profile |
| `POST` | `/api/auth/login` | Public | Authenticate user, receive JWT & HttpOnly cookie |
| `POST` | `/api/auth/logout` | Public | Clear authentication cookie |
| `GET` | `/api/auth/me` | Private | Retrieve authenticated user profile |

### User Profile (`/api/users`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/users/profile` | Private | Get user profile and preferences |
| `PUT` | `/api/users/profile` | Private | Update profile biometrics and targets |
| `PUT` | `/api/users/reminder-preferences` | Private | Update water reminder intervals & waking hours |

### Workouts & Splits (`/api/workouts`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/workouts/splits` | Private | Get predefined splits and active split |
| `PUT` | `/api/workouts/splits` | Private | Switch training split or update custom split |
| `GET` | `/api/workouts` | Private | Get workout history (filtered by split, date) |
| `POST` | `/api/workouts` | Private | Save/finish completed workout session |
| `GET` | `/api/workouts/:id` | Private | Get single workout session details |
| `PUT` | `/api/workouts/:id` | Private | Update workout session |
| `DELETE` | `/api/workouts/:id` | Private | Delete workout session |

### Exercise Library (`/api/exercises`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/exercises` | Private | Get movements (search, filter by muscle/equipment) |
| `POST` | `/api/exercises` | Private | Create user-owned custom exercise |
| `GET` | `/api/exercises/:id` | Private | Get exercise instructions |
| `DELETE` | `/api/exercises/:id` | Private | Delete user's custom exercise |

### Nutrition (`/api/nutrition`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/nutrition` | Private | Get food entries & macro totals for a specific date |
| `POST` | `/api/nutrition` | Private | Log food entry with calories & macros |
| `PUT` | `/api/nutrition/:id` | Private | Update food entry |
| `DELETE` | `/api/nutrition/:id` | Private | Delete food entry |
| `GET` | `/api/nutrition/search` | Private | Autocomplete search for verified food presets |

### Body Weight (`/api/weight`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/weight` | Private | Get weight history, latest delta & period change |
| `POST` | `/api/weight` | Private | Record weight measurement (updates latest weight) |
| `PUT` | `/api/weight/:id` | Private | Update weight measurement |
| `DELETE` | `/api/weight/:id` | Private | Delete weight measurement |

### Water Intake (`/api/water`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/water` | Private | Log water intake quantity (ml) |
| `GET` | `/api/water/daily` | Private | Get today's total, target & remaining |
| `GET` | `/api/water/history` | Private | Get 7-day intake history |
| `DELETE` | `/api/water/:id` | Private | Remove water entry |

### Progress Analytics (`/api/progress`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/progress/dashboard` | Private | Aggregated real-time dashboard statistics |
| `GET` | `/api/progress/frequency` | Private | Completed workout frequency |
| `GET` | `/api/progress/strength` | Private | Strength load progression for selected exercise |
| `GET` | `/api/progress/distribution` | Private | Muscle group workload distribution |
| `GET` | `/api/progress/volume` | Private | Total training volume over time |

---

## 🔔 Water Reminder Architecture & Limitations

In accordance with web browser standards:
1. **Browser Limitation**: Standard JavaScript timers (`setInterval` / `setTimeout`) are throttled or suspended by modern browsers when a tab is in the background or minimized, and do not execute when the browser is closed.
2. **Implementation**: FitTrack handles this responsibly:
   - When the app is open or restored to focus, it evaluates elapsed time against user-configured intervals (`intervalMinutes`, default 120 mins) and waking hours.
   - If permission is granted, it delivers native Web Notification API alerts.
   - If permission is denied or unsupported, it falls back to animated in-app toast alerts.
   - Reminders are silenced during configured quiet hours (e.g. 10:00 PM to 8:00 AM).
   - Duplicate prevention prevents spamming notifications within a 10-minute window.

---

## 🔒 Security Practices Implemented
- **Password Protection**: Passwords hashed with `bcryptjs` before writing to MongoDB.
- **Sensitive Field Protection**: User model has `password: { select: false }` so query results never expose hashes.
- **Data Isolation**: Route controllers strictly verify ownership (`workout.user.toString() === req.user.id.toString()`).
- **Rate Limiting**: In-memory rate limiting applied to `/api/auth/register` and `/api/auth/login`.
- **Duplicate Protection**: 30-second window check prevents double-clicking finish workout from creating duplicate records.
- **CORS & Credentials**: Whitelisted client origin with support for credentials and cookies.

---

## 📄 License
This project is licensed under the MIT License.
video link :- https://drive.google.com/file/d/1rTwOI-1AY1wLLfZ5WBYD7PRoRgCtl9IO/view?usp=drivesdk
