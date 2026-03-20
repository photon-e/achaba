# Achaba

Achaba is a full-stack ride-hailing platform tailored for **motorcycle (okada) transport in Nigeria**. This repository includes:

- a **Django + Django REST Framework backend**
- an **Expo React Native mobile app**
- **Firebase-ready realtime hooks**
- **Google Maps-ready mobile map experience**
- a **SQLite-first setup** with a **PostgreSQL-ready backend configuration**

## Product overview

### Roles
- **Customer**: requests motorcycle rides and tracks trip status
- **Rider**: goes online, receives ride requests, accepts rides, and updates ride progress

### MVP feature set
- phone-number-first authentication with mock OTP support
- rider online/offline toggle
- ride request flow
- automatic nearest-rider matching
- distance-based fare calculation
- ride lifecycle management: requested → accepted → ongoing → completed
- nearby riders endpoint with mock distance ranking
- Firebase service abstraction for live ride notifications/status updates
- ride history

---

## Project structure

```text
achaba/
├── backend/                # Django + DRF API
│   ├── apps/
│   │   ├── accounts/       # Users, rider profiles, auth endpoints
│   │   └── rides/          # Ride domain, matching, pricing, ride lifecycle
│   ├── config/             # Django settings and URL config
│   └── requirements.txt
├── mobile/                 # Expo React Native app with NativeWind
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── navigation/
│   │   ├── screens/
│   │   ├── services/
│   │   └── utils/
│   └── package.json
└── README.md
```

---

## Backend setup

### 1. Create and activate a virtual environment

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
```

### 2. Install dependencies

```bash
pip install -r requirements.txt
```

### 3. Configure environment variables

Copy the example environment file:

```bash
cp .env.example .env
```

For local development, SQLite works out of the box. For PostgreSQL, update `.env` with:

```env
DATABASE_ENGINE=postgres
POSTGRES_DB=achaba
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
```

### 4. Run migrations

```bash
python manage.py makemigrations accounts rides
python manage.py migrate
```

### 5. Start the backend server

```bash
python manage.py runserver
```

The API will be available at:

```text
http://127.0.0.1:8000/api/
```

---

## Mobile setup

### 1. Install dependencies

```bash
cd mobile
npm install
```

### 2. Configure environment variables

```bash
cp .env.example .env
```

Set at least:

```env
EXPO_PUBLIC_API_BASE_URL=http://127.0.0.1:8000/api
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your-google-maps-key
```

Firebase variables are optional for the local MVP because the app includes a mock-friendly realtime service abstraction.

### 3. Start Expo

```bash
npm run start
```

Then open the app in:
- Expo Go on Android/iOS
- Android emulator
- iOS simulator

> Note: the repository intentionally excludes binary app icons/splash images so PR generation
> works in this environment. Add your own files in `mobile/assets/` if you want branded builds.

---

## Core API endpoints

### Authentication

- `POST /api/auth/register/`
- `POST /api/auth/otp/request/`
- `POST /api/auth/otp/verify/`
- `GET /api/auth/me/`
- `POST /api/auth/rider/toggle-status/`

### Rides

- `POST /api/rides/request/`
- `GET /api/rides/nearby-riders/?lat=6.5244&lng=3.3792`
- `POST /api/rides/accept/`
- `POST /api/rides/start/`
- `POST /api/rides/complete/`
- `GET /api/rides/history/`

---

## Sample API payloads

### Register a customer

```json
{
  "phone_number": "+2348012345678",
  "role": "customer",
  "password": "strong-password"
}
```

### Register a rider

```json
{
  "phone_number": "+2348098765432",
  "role": "rider",
  "password": "strong-password",
  "bike_number": "LAG-123-OK"
}
```

### Request a ride

```json
{
  "pickup_lat": 6.5244,
  "pickup_lng": 3.3792,
  "destination_lat": 6.6018,
  "destination_lng": 3.3515
}
```

### Accept a ride

```json
{
  "ride_id": 1
}
```

---

## Matching and pricing logic

### Matching
- rider must be **online**
- simple **Haversine distance** is used to rank available riders by proximity
- the nearest rider is auto-assigned when a customer creates a ride request
- the assigned rider still explicitly accepts the ride, preserving rider control

### Pricing
- **Base fare:** ₦200
- **Per kilometer:** ₦100
- total fare = `200 + (distance_km * 100)`

---

## Mobile app experience

### Customer flow
- register or log in with phone number
- request mock OTP for MVP login
- view pickup/destination on map
- enter or adjust coordinates
- request a ride
- see ride status updates and estimated fare

### Rider flow
- register or log in as a rider
- toggle online/offline
- receive an incoming request via Firebase-ready notification channel
- accept ride
- start ride
- complete ride
- review recent ride history

---

## Realtime architecture

The repository includes a **Firebase service abstraction** in the mobile app and a **backend publish stub** for ride updates:

- backend publishes ride lifecycle events through a dedicated service layer
- mobile subscribes to ride or rider channels
- when Firebase config is missing, the app falls back to a mock-safe local behavior

This makes the MVP easy to run locally while keeping the project ready for real Firebase integration later.

---

## Suggested production improvements

- replace mock OTP with SMS provider integration
- replace Firebase stubs with Firestore or Realtime Database listeners
- add rider location streaming
- add trip cancellation flow
- add push notifications
- add payment integration
- add stronger validation and rate limiting
- add route polylines from Google Directions API
- add background geolocation for riders
- add ratings and customer support workflows

---

## Local development checklist

1. Start Django backend
2. Register at least one rider account
3. Set the rider online from the rider app
4. Register or log in as a customer
5. Request a ride
6. Accept/start/complete the ride from the rider app

---

## Notes

- SQLite is used for development simplicity.
- PostgreSQL environment settings are included for production-ready deployment structure.
- Google Maps and Firebase keys are intentionally environment-driven.
- The OTP flow is mocked for MVP speed and local testing convenience.
