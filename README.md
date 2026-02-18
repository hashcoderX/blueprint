# Blueprint Deployment Guide

This guide will help you deploy the Blueprint application to a VPS server.

## Prerequisites

- VPS with Ubuntu/Debian
- Node.js 18+ installed
- MySQL/MariaDB installed
- Nginx installed
- PM2 installed globally (`npm install -g pm2`)
- Domain name pointing to your VPS

## Environment Files

Use the provided templates to configure environments without committing secrets:

- Frontend: copy [frontend/.env.example](frontend/.env.example) to [frontend/.env.local](frontend/.env.example).
- Backend: copy [backend/.env.example](backend/.env.example) to [backend/.env](backend/.env.example).

Frontend variables:
- `NEXT_PUBLIC_API_BASE_URL`: Base URL for the backend API (e.g., `http://localhost:3001` locally or `https://your-domain.com`).

Backend variables:
- `PORT`, `JWT_SECRET`, `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`.
- Optional Google OAuth: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`.

> Note: `.gitignore` already excludes env files, uploads and machine-local artifacts so secrets and local data won’t be pushed.

## Backend Setup

1. **Clone and setup backend:**
   ```bash
   cd /var/www
   git clone <your-repo> blueprint
   cd blueprint/backend
   npm install
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env
   nano .env
   ```
   Update the following:
   ```
   PORT=3001
   JWT_SECRET=your-secure-jwt-secret-here
   DB_HOST=localhost
   DB_USER=your_db_user
   DB_PASSWORD=your_db_password
   DB_NAME=blueprint
   ```

   Or use the template directly:
   ```bash
   cp .env.example .env
   ```

3. **Setup database:**
   ```bash
   mysql -u root -p < setup.sql
   ```

4. **Start backend with PM2:**
   ```bash
   pm2 start index.js --name blueprint-backend
   pm2 save
   pm2 startup
   ```

## Frontend Setup

1. **Build frontend:**
   ```bash
   cd ../frontend
   npm install
   cp .env.example .env.local
   nano .env.local
   ```
   Set:
   ```
   NEXT_PUBLIC_API_BASE_URL=http://your-domain.com/api
   ```

   You can also use the template directly:
   ```bash
   cp .env.example .env.local
   ```

2. **Build for production:**
   ```bash
   npm run build
   ```

3. **Serve with PM2:**
   ```bash
   pm2 start npm --name blueprint-frontend -- start
   pm2 save
   ```

## Nginx Configuration

Create `/etc/nginx/sites-available/blueprint`:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Uploaded files
    location /uploads {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }
}

server {
    listen 80;
    server_name www.your-domain.com;
    return 301 http://your-domain.com$request_uri;
}
```

Enable site:
```bash
ln -s /etc/nginx/sites-available/blueprint /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

## SSL with Let's Encrypt

```bash
apt install certbot python3-certbot-nginx
certbot --nginx -d your-domain.com -d www.your-domain.com
```

## Protect Server-Local Files (Uploads & Config)

Ensure previously tracked local-only files are untracked so pulls don’t overwrite live data:

```bash
# In your dev repo before pushing
git rm -r --cached backend/uploads
git rm --cached backend/vapid.json
git add backend/uploads/.gitkeep .gitignore
git commit -m "chore: ignore uploads & vapid.json; add env templates"
git push origin main
```

On the server, you can additionally protect any remaining local-only files:

```bash
cd /var/www/blueprint
git update-index --skip-worktree backend/vapid.json
git update-index --skip-worktree backend/uploads/*
git pull origin main
```

## Firewall

```bash
ufw allow ssh
ufw allow 'Nginx Full'
ufw --force enable
```

## Monitoring

Check PM2 status:
```bash
pm2 status
pm2 logs
```

## Backup

Setup automated backups for:
- Database: `mysqldump blueprint > backup.sql`
- Uploaded files: `/var/www/blueprint/backend/uploads/`

## Troubleshooting

- Check logs: `pm2 logs blueprint-backend`
- Test API: `curl http://localhost:3001/api/health`
- Check Nginx: `nginx -t`