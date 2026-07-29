# Manzor Traders — Frontend

Is app ka data ab **PostgreSQL** mein store hota hai, ek alag Node.js/Express backend
(`../backend`) ke zariye. **Firebase sirf authentication (login, signup, Google login,
password reset) ke liye use ho raha hai** — koi bhi app data (products, sales, invoices,
customers, settings) ab Firestore mein nahi jaata.

## Setup

1. `.env.example` ko `.env` mein copy karein aur backend ka URL set karein:

   ```bash
   cp .env.example .env
   ```

   ```
   VITE_API_URL=http://localhost:4000
   ```

2. Pehle backend chalayein (dekhen `../backend/README.md`), phir:

   ```bash
   npm install
   npm run dev
   ```

## Kya badla

- `src/hooks/useProducts.js` — ab Firestore ki jagah `../backend` ke REST API (`/api/...`)
  ko call karta hai. Return shape wahi hai, isliye koi component change nahi karna pada.
- `src/api/client.js` — naya helper jo har request ke saath Firebase ID token attach
  karta hai (`Authorization: Bearer <token>`), taake backend user ko verify kar sake.
- `src/App.jsx` — Firestore aur Analytics imports hata diye gaye; Firebase Auth waisa
  hi hai jaisa pehle tha (email/password, Google login, password reset — sab kaam karte hain).

## Run

```bash
npm run dev       # development
npm run build     # production build
```
