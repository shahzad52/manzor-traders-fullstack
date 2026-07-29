# Manzor Traders Fullstack - Complete Setup & Production Deployment Guide

## 📌 Architecture Overview

* **Backend Framework:** Node.js + Express API
* **Frontend Framework:** React (Vite) Single Page Application
* **Database:** PostgreSQL on Cloud Supabase (Tokyo `ap-northeast-1`)
* **Authentication:** Google Firebase Auth (`shakir-pos` project)
* **Target Environment:** Separate Hostinger VPS #1 (Backend API) & Hostinger VPS #2 (Frontend UI)

---

## 🔑 Section 1: Environment Variables Reference

### 1. Backend VPS Environment (`backend/.env`)

Create `/var/www/backend/.env`:

```env
PORT=4000
CORS_ORIGIN=*
DATABASE_URL=postgresql://postgres.dxdmkwbwzdjbthvadxry:Mudassar523b%40@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres
FIREBASE_SERVICE_ACCOUNT_PATH=./service-account.json
```

---

### 2. Frontend VPS Environment (`manzor-traders/.env`)

Create `/var/www/frontend/.env`:

```env
VITE_API_URL=https://api.yourdomain.com
VITE_FIREBASE_API_KEY=AIzaSyCp7cfo5WhPQ7pCZDkJp3VYJxM6up8Rbwk
VITE_FIREBASE_AUTH_DOMAIN=shakir-pos.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=shakir-pos
VITE_FIREBASE_STORAGE_BUCKET=shakir-pos.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=1070570595901
VITE_FIREBASE_APP_ID=1:1070570595901:web:97516e9de6f5001db76c54
VITE_FIREBASE_MEASUREMENT_ID=G-C82M4LVV9F
```

---

## 🖥️ Section 2: Backend Deployment (Hostinger VPS #1)

1. **SSH into Backend VPS:**
   ```bash
   ssh root@YOUR_BACKEND_VPS_IP
   ```

2. **Install Node.js v22, Git, Nginx, Certbot & PM2:**
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
   sudo apt-get update && sudo apt-get install -y nodejs git nginx certbot python3-certbot-nginx
   sudo npm install -g pm2
   ```

3. **Clone Code & Install Dependencies:**
   ```bash
   git clone YOUR_REPOSITORY_URL /var/www/backend
   cd /var/www/backend
   npm install --omit=dev
   ```

4. **Create `.env` File:**
   ```bash
   nano .env
   ```
   *(Paste Backend `.env` contents and save)*

5. **Run Database Migration:**
   ```bash
   npm run migrate
   ```

6. **Start PM2 Service:**
   ```bash
   pm2 start src/server.js --name "manzor-backend"
   pm2 save
   pm2 startup
   ```

7. **Configure Nginx Reverse Proxy (`/etc/nginx/sites-available/backend`):**
   ```nginx
   server {
       server_name api.yourdomain.com;

       location / {
           proxy_pass http://127.0.0.1:4000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

8. **Enable Site & Obtain SSL Certificate:**
   ```bash
   sudo ln -s /etc/nginx/sites-available/backend /etc/nginx/sites-enabled/
   sudo nginx -t && sudo systemctl reload nginx
   sudo certbot --nginx -d api.yourdomain.com
   ```

---

## 💻 Section 3: Frontend Deployment (Hostinger VPS #2)

1. **SSH into Frontend VPS:**
   ```bash
   ssh root@YOUR_FRONTEND_VPS_IP
   ```

2. **Install Node.js v22, Git, Nginx & Certbot:**
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
   sudo apt-get update && sudo apt-get install -y nodejs git nginx certbot python3-certbot-nginx
   ```

3. **Clone Code & Build Static Assets:**
   ```bash
   git clone YOUR_REPOSITORY_URL /var/www/frontend
   cd /var/www/frontend
   nano .env # Paste Frontend .env
   npm install
   npm run build
   ```

4. **Configure Nginx Static Web Server (`/etc/nginx/sites-available/frontend`):**
   ```nginx
   server {
       server_name yourdomain.com;
       root /var/www/frontend/dist;
       index index.html;

       location / {
           try_files $uri $uri/ /index.html;
       }
   }
   ```

5. **Enable Site & Obtain SSL Certificate:**
   ```bash
   sudo ln -s /etc/nginx/sites-available/frontend /etc/nginx/sites-enabled/
   sudo nginx -t && sudo systemctl reload nginx
   sudo certbot --nginx -d yourdomain.com
   ```

---

## ⚡ Section 4: Local Development Commands

```bash
# Start Express Backend
cd backend
npm run dev

# Start Vite Frontend
cd manzor-traders
npm run dev

# Run Production Database Stress Test
cd backend
node src/testProductionLoad.js
```
