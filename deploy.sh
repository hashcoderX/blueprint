#!/bin/bash

# Deployment script for blueprint.codemint.space
# Run this on your VPS as root or with sudo

set -e

DOMAIN="blueprint.codemint.space"
APP_DIR="/var/www/blueprint"
BACKEND_PORT=3007
FRONTEND_PORT=3006
VPS_IP="62.164.217.70"
EMAIL="sudharma.droid@gmail.com"

echo "Starting deployment for $DOMAIN..."

# Update system
apt update && apt upgrade -y

# Install MySQL if not installed
if ! command -v mysql &> /dev/null; then
    apt install -y mysql-server
    systemctl start mysql
    systemctl enable mysql
fi

# Setup database
mysql -u root < backend/setup.sql
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt-get install -y nodejs
fi

# Install Nginx if not installed
if ! command -v nginx &> /dev/null; then
    apt install -y nginx
fi

# Install Certbot for Let's Encrypt
apt install -y certbot python3-certbot-nginx

# Create app directory
mkdir -p $APP_DIR
cd $APP_DIR

# Assuming code is already uploaded to $APP_DIR
# If not, upload your code here

# Install backend dependencies
cd backend
npm install --production

# Install frontend dependencies
cd ../frontend
npm install
npm run build

# Create systemd services for backend and frontend
cat > /etc/systemd/system/blueprint-backend.service << EOF
[Unit]
Description=Blueprint Backend
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=$APP_DIR/backend
ExecStart=/usr/bin/node index.js
Restart=always
Environment=PORT=$BACKEND_PORT
Environment=JWT_SECRET=16b3995d94776eff183b01e03ec3f9cbd578479c1a8a320822e6ec9a466ec38d

[Install]
WantedBy=multi-user.target
EOF

cat > /etc/systemd/system/blueprint-frontend.service << EOF
[Unit]
Description=Blueprint Frontend
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=$APP_DIR/frontend
ExecStart=/usr/bin/npm start
Restart=always
Environment=PORT=$FRONTEND_PORT

[Install]
WantedBy=multi-user.target
EOF

# Enable and start services
systemctl enable blueprint-backend
systemctl enable blueprint-frontend
systemctl start blueprint-backend
systemctl start blueprint-frontend

# Configure Nginx
cat > /etc/nginx/sites-available/$DOMAIN << EOF
server {
    listen 80;
    server_name $DOMAIN;

    location /api {
        proxy_pass http://localhost:$BACKEND_PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    location / {
        proxy_pass http://localhost:$FRONTEND_PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
}
EOF

# Enable site
ln -s /etc/nginx/sites-available/$DOMAIN /etc/nginx/sites-enabled/

# Test Nginx config
nginx -t

# Reload Nginx
systemctl reload nginx

# Get SSL certificate
certbot --nginx -d $DOMAIN --non-interactive --agree-tos --email $EMAIL

# Set proper permissions
chown -R www-data:www-data $APP_DIR
chmod -R 755 $APP_DIR

# Configure firewall (assuming ufw)
ufw allow 80
ufw allow 443
ufw --force enable

echo "Deployment complete. Add DNS A record for $DOMAIN pointing to $VPS_IP"