# Deployment Guide for blueprint.codemint.space

## Prerequisites
- VPS with Ubuntu/Debian
- Root or sudo access
- Domain DNS nameservers pointed to Namecheap
- Domain added to server's DNS zone (if applicable)

## Steps

1. **Upload Code to VPS**
   ```bash
   scp -r /var/www/blueprint user@vps:/var/www/
   # Or use git clone if repo is public
   ```

2. **Update Deployment Script**
   - Edit `deploy.sh`
   - Replace `YOUR_VPS_IP_HERE` with your actual VPS IP
   - Replace `your-email@example.com` with your email for Let's Encrypt

3. **Set Environment Variables**
   - Create a `.env` file in backend directory or set in systemd
   - Set `JWT_SECRET` to a secure random string

4. **Run Deployment Script**
   ```bash
   chmod +x deploy.sh
   sudo ./deploy.sh
   ```

5. **Configure DNS**
   - In Namecheap DNS settings for codemint.space
   - Add A record: `blueprint` -> YOUR_VPS_IP

6. **Verify**
   - Check services: `systemctl status blueprint-backend` and `blueprint-frontend`
   - Visit https://blueprint.codemint.space

## Security Notes
- Change default MySQL root password
- Use dedicated DB user
- Monitor logs
- Keep dependencies updated

## Zero Downtime
- The script reloads Nginx without restart
- Services start after config