# NER Logistics — Setup Guide

This covers three things end to end:
1. Setting up **MongoDB** (database)
2. Setting up **map/routing APIs** — a completely **free** option and the paid Google Maps option
3. Running the backend + frontend together

---

## What's new in this update

The previous version had a real backend but a frontend that mostly wasn't wired to it. This pass closed that gap:

- **Live Operations Map** on the Dashboard is now a real Leaflet + OpenStreetMap map (no API key needed) — real vehicle/incident/road markers from the database, popups, layer toggles, zoom/locate/fullscreen controls, replacing the old hand-drawn illustration.
- **Roads & Deliveries**: real debounced search, dynamically-populated district filters, status filters, real pagination, and CSV export that respects whatever filters are currently active.
- **Deliveries**: inline status changes (Scheduled → Assigned → In Progress → Delayed → Completed → Cancelled), a real "New Delivery" form.
- **Alerts**: real read/unread state, mark-one/mark-all-read (persisted in MongoDB), clicking an alert opens the linked incident in a detail modal.
- **Realtime updates**: a Server-Sent Events stream (`GET /api/events/stream`) pushes new alerts/incidents/road/delivery changes to every connected browser instantly — no polling, no full-page reload.
- **True offline queue**: if an incident report fails to submit because the device is offline, it's saved to `localStorage` (photo included, base64-encoded) and shown as pending. It's automatically retried the moment the browser's `online` event fires, and the Sync page's "pending reports/photos" counts include this local queue, not just the server-side one.
- **Settings** now actually persists (per-user, in MongoDB) instead of being a static page.
- **Weather** page gains a "Regional Advisories" panel pulling from the backend's NASA EONET + USGS earthquake feed (previously built, never surfaced in the UI).
- Added the `.env.example` this guide always referenced but which didn't actually exist in the repo.

---

## 1. MongoDB Setup

You have two options. Atlas (cloud, free tier) is recommended — it works from anywhere, needs no local install, and is what most teams ship with.

### Option A — MongoDB Atlas (cloud, free forever tier)

1. **Create an account**
   Go to https://www.mongodb.com/cloud/atlas/register and sign up (Google/email — no credit card required for the free tier).

2. **Create a free cluster**
   - Click **"Build a Database"**.
   - Choose the **M0 Free** tier (512 MB storage, free forever).
   - Pick any cloud provider/region close to you.
   - Name it something like `ner-logistics-cluster` and click **Create**.

3. **Create a database user**
   - You'll be prompted under **Security Quickstart**. Choose **Username/Password**.
   - Set a username (e.g. `ner_admin`) and a strong password — **save it somewhere**, you'll need it in the connection string.
   - Click **Create User**.

4. **Allow network access**
   - Under **"Where would you like to connect from?"**, click **"Add My Current IP Address"** for local development.
   - For deploying the backend to a server/cloud host later, add `0.0.0.0/0` (allow from anywhere) — fine for development/small projects, but for production restrict this to your server's actual IP.

5. **Get your connection string**
   - Go to **Database → Connect → Drivers**.
   - Copy the connection string, which looks like:
     ```
     mongodb+srv://ner_admin:<password>@ner-logistics-cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority
     ```
   - Replace `<password>` with your actual password, and add a database name before the `?`, e.g.:
     ```
     mongodb+srv://ner_admin:YourPassword123@ner-logistics-cluster.xxxxx.mongodb.net/ner_logistics?retryWrites=true&w=majority
     ```

6. **Add it to the backend**
   - In `backend/`, copy `.env.example` to `.env`:
     ```bash
     cp .env.example .env
     ```
   - Paste your connection string into `MONGODB_URI` in `.env`.

That's it — no further Mongo configuration is needed. The backend connects automatically on startup.

### Option B — Local MongoDB (no internet dependency)

If you'd rather run Mongo on your own machine:

```bash
# Ubuntu/Debian
sudo apt-get install -y mongodb

# macOS (Homebrew)
brew tap mongodb/brew && brew install mongodb-community
brew services start mongodb-community
```

Then in `.env`, use:
```
MONGODB_URI=mongodb://127.0.0.1:27017/ner_logistics
```

### Loading sample data

Once `MONGODB_URI` is set, run the seed script from the `backend/` folder:
```bash
npm install
npm run seed
```
This creates sample users, vehicles, roads, deliveries, alerts, incidents, and reports matching the app's demo content, and prints working login credentials in the terminal.

---

## 2. Map & Routing APIs

The app needs two kinds of map data:
- **Directions/routing** (turn a pickup + drop-off into a route, distance, ETA) — used by Route Optimization and Velocity AI.
- **Weather & disaster data** — used by the Weather page and to auto-flag risky roads.

### 2a. Weather & disaster data — already free, already wired, no key needed

These were already integrated in the backend and require **zero setup**:

| Source | What it gives you | Cost | Key needed? |
|---|---|---|---|
| [Open-Meteo](https://open-meteo.com) | Current conditions + 5-day forecast | Free | No |
| [NASA EONET](https://eonet.gsfc.nasa.gov) | Active floods, storms, wildfires, landslides worldwide | Free | No |
| [USGS Earthquake Feed](https://earthquake.usgs.gov/fdsnws/event/1/) | Recent earthquakes (pre-filtered to the NE India/Himalayan belt) | Free | No |

These power `GET /api/weather/current` and `GET /api/weather/disaster-feed`. Nothing to configure.

### 2b. Routing/directions — recommended free option (already built in)

**I've already integrated this for you** — you only need to get a free key.

**[OpenRouteService](https://openrouteservice.org)** is a free, open routing engine built on OpenStreetMap, now run under HeiGIT's unified API platform. It's the best free alternative to Google's Directions API:

- **Free tier**: no credit card required. Check your exact quota anytime at account.heigit.org/info/plans.
- Good coverage of India, including the Northeast
- **API domain migration**: as of April 2026, HeiGIT deprecated `api.openrouteservice.org` in favor of `api.heigit.org`, with `api.openrouteservice.org` fully shut off August 24, 2026. This backend already calls the new `api.heigit.org` URLs — no action needed on your end, your existing API key works on the new domain unchanged. (If you ever see a confusing "quota exceeded" error despite a fresh key, this migration — not real usage — was almost certainly the cause; it's now fixed here.)

**Steps to get your free key:**
1. Go to https://openrouteservice.org/dev/#/signup and sign up with your email.
2. Verify your email, then log in to your dashboard.
3. Click **"Request a token"** → choose the **Standard** (free) plan.
4. Copy the generated API key.
5. Paste it into `backend/.env`:
   ```
   MAP_PROVIDER=ors
   ORS_API_KEY=paste_your_key_here
   ```
6. Restart the backend. `/api/routes/optimize` now returns real routes computed from live OpenStreetMap road data.

This is already wired into `src/utils/openRouteService.js` and `src/controllers/routeOptController.js` — I built the integration myself; you just need to drop your free key into `.env`.

### 2c. Other free map options worth knowing about

If you ever want to swap providers or add a visual (tile-based) map to the frontend:

| Provider | Best for | Free tier | Notes |
|---|---|---|---|
| **OpenRouteService** ✅ (integrated) | Directions, geocoding, isochrones | 2,000 routes/day, no card | Already wired in this backend |
| **Leaflet.js + OpenStreetMap tiles** | Rendering an actual interactive map in the frontend | Free, no key for light use | The current "Live Operations Map" on the Dashboard is a static illustration, not a real map — swap it for a `<MapContainer>` from `react-leaflet` if you want a real, pannable map |
| **MapTiler** | Nicer-looking map tiles than raw OSM | 100k tile loads/month free | Needs a free API key |
| **LocationIQ** | Geocoding / reverse-geocoding | 5,000 requests/day free | Good if ORS geocoding ever feels limited |
| **OSRM demo server** | Quick routing tests | Free, no key | Public demo server only — not for real traffic, good for prototyping |

### 2d. Google Maps — optional, paid tier (billing account required)

Google's routing data and traffic accuracy are excellent, but it needs a billing account (Google gives $200/month free credit, which comfortably covers moderate usage — but a card is required to enable it).

**Steps to create a Google Maps API key:**
1. Go to https://console.cloud.google.com and create a new project (e.g. `ner-logistics`).
2. Under **APIs & Services → Library**, enable these four APIs:
   - **Directions API**
   - **Geocoding API**
   - **Distance Matrix API**
   - **Roads API**
3. Go to **Billing** and link a billing account (required even for the free-credit tier).
4. Go to **APIs & Services → Credentials → Create Credentials → API Key**.
5. Click **"Restrict Key"**:
   - Under **API restrictions**, select the 4 APIs above only.
   - Under **Application restrictions**, choose **IP addresses** and add your server's IP (for a backend-only key like this one, do NOT use "HTTP referrers" — that's for client-side/browser keys).
6. Copy the key into `backend/.env`:
   ```
   MAP_PROVIDER=google
   GOOGLE_MAPS_API_KEY=paste_your_key_here
   ```
7. Restart the backend.

Switching `MAP_PROVIDER` back to `ors` at any time reverts to the free provider — no code changes needed.

---

## 3. Running everything together

### Backend
```bash
cd backend
cp .env.example .env       # then fill in MONGODB_URI, JWT_SECRET, ORS_API_KEY
npm install
npm run seed                # optional: loads sample data
npm run dev                 # starts on http://localhost:5000
```

Generate a real `JWT_SECRET` (don't leave the placeholder):
```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

### Frontend
```bash
cd ner                      # the React app folder
cp .env.example .env        # VITE_API_URL=http://localhost:5000
npm install
npm run dev                 # starts on http://localhost:5173
```

### Try it
1. Open http://localhost:5173 — you'll land on **Login**.
2. If you ran the seed script, log in with:
   - **Admin**: username `Director Shubham`, password `password123`, role Admin
   - **Driver**: username `Rajesh Kumar`, password `password123`, role Driver
   - (Or register a brand-new account from the Register page — it now creates a real account in MongoDB.)
3. Dashboard, Roads, Vehicles, Deliveries, Alerts, and Reports now pull live data from your MongoDB database. If the backend isn't running, each page quietly falls back to its original demo content — nothing breaks.
4. Try **Report Incident** — upload a photo, tap "Use My Location", submit. A High/Critical severity report automatically creates a live Alert and updates the linked road's status.
5. Try **Velocity AI** — it now calls the real backend, which checks live vehicle/driver availability and current road risk before replying.

---

## What's still simulated / next steps

- **Aadhaar/DL/OTP verification** on Register is still theatrical (as in the original prototype) — wiring real KYC requires a licensed government API/vendor integration, which is out of scope here.
- The **Live Operations Map** on the Dashboard is a static illustration, not a real interactive map. Swapping it for `react-leaflet` + OpenStreetMap tiles (both free) is a good next step if you want live vehicle pins.
- **Report downloads**: `/api/reports/generate` currently returns a JSON snapshot, not a downloadable PDF/CSV. Wiring a PDF export is straightforward to add later (e.g. with `pdfkit`) if you need real downloadable files.
- **Push notifications / SMS alerts** for critical incidents aren't wired — would need a service like Twilio or Firebase Cloud Messaging.
