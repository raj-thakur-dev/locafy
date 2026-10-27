# 📍 Locafy — Local Business Discovery Platform for India

Locafy is a full-stack local discovery and business directory web application designed specifically for Indian cities and neighborhoods. Users can search and discover nearby restaurants, salons, home repairs, healthcare clinics, and gyms; see live open/closed status and real-time distance; call, chat via WhatsApp, or get driving directions; bookmark favorites; and submit reviews. Local business owners can list their businesses for free, upload storefront photos, view lead analytics (views, calls, WhatsApp clicks, directions, enquiry messages), and respond to incoming customer leads. Platform administrators review pending business submissions, grant verified trust badges, and monitor system KPIs.

---

## 🚀 Quick Start (Zero-Configuration)

The application runs end-to-end locally with Node.js and a self-contained SQLite file database:

### 1. Prerequisites
- **Node.js**: v18.0.0 or higher (v20+ recommended)
- **npm**: v8.0.0 or higher

### 2. Installation & Setup

```bash
# 1. Install dependencies
npm install

# 2. Configure environment variables (or copy from .env.example)
cp .env.example .env

# 3. Seed the SQLite database (~60 realistic listings, reviews, categories, demo users)
npm run seed

# 4. Start the server
npm start
```

Open your browser at **[http://localhost:3000](http://localhost:3000)**.

> **One-Command Setup**:
> ```bash
> npm install && npm run seed && npm start
> ```

---

## 👥 Demo Accounts & Credentials

The database comes pre-seeded with ready-to-test accounts across all roles:

| Role | Name | Email | Password | Dashboard / Access |
|---|---|---|---|---|
| **Admin** | Locafy Admin | `admin@locafy.in` | `Admin@12345` | Moderation & KPIs at `/admin.html` |
| **Business Owner 1** | Ankit Rawal (Spice Route) | `ankit@spiceroute.com` | `Password123!` | Owner Dashboard at `/dashboard.html` |
| **Business Owner 2** | Vikram Sethi (Urban Glow) | `vikram@urbanglow.com` | `Password123!` | Owner Dashboard at `/dashboard.html` |
| **Customer 1** | Priya Malhotra | `priya@example.com` | `Password123!` | Favorites & Reviews at `/favourites.html` |
| **Customer 2** | Sana Iqbal | `sana@example.com` | `Password123!` | Customer account |
| **Customer 3** | Rahul Verma | `rahul@example.com` | `Password123!` | Customer account |

---

## 🛠️ Tech Stack & Architecture

- **Backend**: Node.js & Express.js
- **Database**: SQLite (via `better-sqlite3` with zero-dependency fallback to Node v22 native `node:sqlite`)
- **Authentication**: JWT (JSON Web Tokens) with `bcryptjs` password hashing and role-based middleware (`user`, `business`, `admin`)
- **Validation**: Strict schema validation with `zod`
- **File Uploads**: `multer` (up to 2MB JPEG/PNG/WebP stored in `backend/uploads/`)
- **Security**: `helmet`, `cors`, and `express-rate-limit` on authentication endpoints
- **Maps & Geolocation**: OpenStreetMap + Leaflet.js (zero paid APIs or API keys) + Browser Geolocation API (defaults to Central Delhi `28.6139, 77.2090`)
- **Frontend**: Vanilla JavaScript (ES6 modules) + CSS custom properties (no build tools or heavy client frameworks)
- **Charts**: Chart.js for owner analytics

---

## 📁 Project Structure

```text
locafy/
├── backend/
│   ├── data/
│   │   └── locafy.db            # SQLite database file
│   ├── db/
│   │   ├── schema.sql           # Database schema & indexes
│   │   └── seed.js              # Comprehensive seed script (60 businesses across India)
│   ├── src/
│   │   ├── controllers/         # Request handling & business logic
│   │   │   ├── adminController.js
│   │   │   ├── authController.js
│   │   │   ├── businessController.js
│   │   │   ├── categoryController.js
│   │   │   ├── ownerController.js
│   │   │   └── userController.js
│   │   ├── db/
│   │   │   └── index.js         # SQLite connection with driver auto-fallback
│   │   ├── middleware/
│   │   │   ├── auth.js          # JWT & role verification
│   │   │   ├── upload.js        # Multer image upload handler
│   │   │   └── validation.js    # Zod validation middleware
│   │   ├── routes/              # Express API route declarations
│   │   │   ├── adminRoutes.js
│   │   │   ├── authRoutes.js
│   │   │   ├── businessRoutes.js
│   │   │   ├── categoryRoutes.js
│   │   │   ├── ownerRoutes.js
│   │   │   └── userRoutes.js
│   │   └── utils/
│   │       └── helpers.js       # Haversine distance, open-now calculator, JWT helpers
│   ├── uploads/                 # Uploaded business storefront photos
│   └── server.js                # Express app entrypoint & static file server
├── frontend/
│   ├── assets/
│   │   └── logo.png             # Locafy branding logo
│   ├── css/
│   │   ├── hero-slider.css      # Hero background slideshow & animated search card
│   │   └── main.css             # Design tokens, navbar, cards, badges, modals, toasts
│   ├── js/
│   │   ├── admin.js             # Admin approvals & stats controller
│   │   ├── api.js               # Central API client, token management, toasts, formatting
│   │   ├── auth.js              # Dynamic navbar state, auth modals & redirect logic
│   │   ├── dashboard.js         # Owner metrics, Chart.js leads graph, listing editor
│   │   ├── home.js              # Hero slider, geolocation, autocomplete, top picks
│   │   ├── listing.js           # Business details, Leaflet pin, reviews, enquiry form, QR
│   │   └── search.js            # Search list + Leaflet map sync, filters, lead tracking
│   ├── 404.html                 # Custom not-found error page
│   ├── admin.html               # Admin moderation & user directory portal
│   ├── auth-business.html       # Business owner sign up and log in
│   ├── auth-user.html           # Customer sign up and log in
│   ├── business.html            # Business listing detail & review submission page
│   ├── dashboard.html           # Owner dashboard & lead analytics
│   ├── favourites.html          # Customer saved bookmarks page
│   ├── index.html               # Homepage with hero slider, spotlight & trending places
│   └── search.html              # Search discovery page with dual grid & interactive map
├── tools/
│   └── test-e2e.js              # Automated end-to-end test suite
├── .env.example                 # Example configuration
├── package.json
└── README.md
```

---

## 📡 REST API Reference

Base URL: `/api`

### 1. Authentication (`/api/auth`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/auth/register` | Public | Register customer (`role: user`) or business owner (`role: business`) |
| `POST` | `/auth/login` | Public | Authenticate user; returns JWT token and profile |
| `POST` | `/auth/logout` | Authenticated | Invalidate local session |
| `GET` | `/auth/me` | Authenticated | Retrieve current authenticated user profile |

### 2. Categories (`/api/categories`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/categories` | Public | List all 12 categories with active business counts |

### 3. Businesses Discovery (`/api/businesses`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/businesses` | Public | Filterable search by query `q`, `category`, `city`, `lat`, `lng`, `radius_km`, `open_now`, `min_rating`, `verified`, and `sort` |
| `GET` | `/businesses/trending` | Public | Top businesses sorted by recent lead activity and rating |
| `GET` | `/businesses/top-by-category` | Public | Category spotlights for home page carousel tabs |
| `GET` | `/businesses/:id` | Public | Detailed business profile; automatically logs a `view` lead |
| `GET` | `/businesses/:id/reviews` | Public | List all customer reviews for a business |
| `POST` | `/businesses/:id/reviews` | User | Submit rating (1–5) and review comment; updates business average |
| `POST` | `/businesses/:id/track` | Public | Track customer conversion lead (`call`, `whatsapp`, `directions`) |
| `POST` | `/businesses/:id/message` | Public | Send direct customer enquiry form to the owner |

### 4. Owner Portal (`/api/owner`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/owner/businesses` | Business | Get all listings owned by authenticated owner |
| `POST` | `/owner/businesses` | Business | Create a new listing (submitted with `pending` status) |
| `PUT` | `/owner/businesses/:id` | Business | Update existing business details |
| `DELETE` | `/owner/businesses/:id` | Business | Remove a business listing |
| `POST` | `/owner/businesses/:id/images` | Business | Upload storefront photo (JPEG/PNG/WebP, max 2MB) |
| `GET` | `/owner/businesses/:id/analytics` | Business | 7-day or 30-day analytics summary, daily leads series, rating & visibility score |
| `GET` | `/owner/messages` | Business | Inbox of all incoming customer enquiries |
| `PATCH` | `/owner/messages/:id/read` | Business | Mark customer enquiry as read |

### 5. Customer Favorites (`/api/me`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/me/favourites` | User | List all bookmarked businesses |
| `POST` | `/me/favourites/:id` | User | Save a business to favorites |
| `DELETE` | `/me/favourites/:id` | User | Remove a business from favorites |

### 6. Admin Moderation (`/api/admin`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/admin/stats` | Admin | Platform metrics (total users, listings, pending, verified, leads, reviews) |
| `GET` | `/admin/businesses` | Admin | Filter listings by status (`pending`, `approved`, `rejected`, `all`) |
| `PATCH` | `/admin/businesses/:id/approve` | Admin | Approve pending business submission |
| `PATCH` | `/admin/businesses/:id/reject` | Admin | Reject business submission |
| `PATCH` | `/admin/businesses/:id/verify` | Admin | Toggle verified trust badge on/off |
| `GET` | `/admin/users` | Admin | List registered user directory with listing counts |

---

## 🧪 Automated Testing

An automated end-to-end integration test covers the four complete user journeys:

```bash
npm test
```

### Verified Test Flows:
1. **Flow A (Customer Journey)**: Signup -> Search "salon" near Noida coordinates -> Open business detail -> Submit 5-star review -> Add to favorites -> Verify in user favorites list.
2. **Flow B (Business Owner Journey)**: Signup as business -> Create listing (status defaults to `pending`) -> Upload storefront photo.
3. **Flow C (Admin Moderation)**: Admin login -> Retrieve pending queue -> Approve listing -> Grant verification badge -> Confirm listing appears in public search with verified badge.
4. **Flow D (Lead Analytics & Inbox)**: Track call lead -> Track view lead -> Customer sends enquiry message -> Owner views dashboard analytics -> Owner views inbox and marks message as read.

---

## 📋 Evaluation & Demonstration Checklist

- [x] **Zero External Key Requirement**: Uses OpenStreetMap and Leaflet without proprietary API keys.
- [x] **Full-Bleed Hero Slider**: Auto-rotates every 5 seconds, supports dot controls and `hbGoTo()`, dark gradient overlay, and overlapping search card.
- [x] **Indian Geolocation & Haversine Distance**: Browser geolocation support with fallback to Delhi (`28.6139, 77.2090`), accurate distance calculations in kilometers.
- [x] **Live Open / Closed Status**: Real-time evaluation based on day-of-week and current time in `Asia/Kolkata` timezone.
- [x] **Search & Interactive Map Sync**: Dual view on `search.html` with card hover and click synchronization with Leaflet pin markers.
- [x] **Lead Tracking**: Direct tracking on Call (`tel:`), WhatsApp (`wa.me`), and Directions (`google.com/maps/dir/`) clicks before opening links.
- [x] **Business Owner Dashboard**: Interactive Chart.js graph of 7d/30d views and actions, listing manager with Leaflet pin picker, and customer message inbox.
- [x] **Admin Moderation Portal**: Real-time stats, listing approve/reject controls, and verified badge management.
- [x] **Security & Validation**: Parameterized SQL queries, password hashing with bcrypt, Zod payload validation, and rate limiting.
