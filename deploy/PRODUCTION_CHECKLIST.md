# BloodNet VPS Production Checklist (bloodnet.live)

## 1) One-time server setup
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y nginx git curl build-essential
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm i -g pm2
```

## 2) App directory and source
```bash
sudo mkdir -p /var/www/bloodnet
sudo chown -R $USER:$USER /var/www/bloodnet
cd /var/www/bloodnet
git clone <YOUR_REPO_URL> .
```

## 3) Environment file
```bash
cd /var/www/bloodnet
cp .env.example .env
nano .env
```
Set production values including:
- `NODE_ENV=production`
- `NEXT_PUBLIC_BASE_URL=https://bloodnet.live`
- `NEXT_PUBLIC_SITE_URL=https://bloodnet.live`
- DB/JWT/SMTP/GEOAPIFY and media vars.

## 4) Nginx config
```bash
sudo cp /var/www/bloodnet/deploy/nginx/bloodnet.live.conf /etc/nginx/sites-available/bloodnet.live
sudo ln -s /etc/nginx/sites-available/bloodnet.live /etc/nginx/sites-enabled/bloodnet.live
sudo nginx -t
sudo systemctl reload nginx
```

## 5) SSL (Let's Encrypt)
```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d bloodnet.live -d www.bloodnet.live
```

## 6) First deploy (single command afterward)
```bash
cd /var/www/bloodnet
chmod +x deploy/deploy.sh
bash deploy/deploy.sh
```

## 7) PM2 auto-start after VPS reboot
```bash
pm2 startup systemd
pm2 save
```
Run the command printed by `pm2 startup` (it usually starts with `sudo env PATH=...`).

## 8) Daily operations

If medical uploads return HTTP 503 with a missing/invalid private-storage key:

```bash
cd /var/www/bloodnet
git pull --ff-only origin main
npm run medical:configure
bash deploy/deploy.sh
```

`medical:configure` keeps an existing valid key unchanged. It creates an initial key
in `.env.production.local` only when the database has no encrypted medical records
or verification assets. It preserves other settings, privately backs up an existing
file, and never prints the key. If encrypted data exists, restore its original key
from a secure backup; do not generate a replacement. Back up `.env.production.local`
securely too. The deploy restarts both the web app and prescription worker so they
load that file. Health checks now fail when the running medical-storage key is
missing or invalid, even if ordinary public-page database reads work.

- Deploy latest main:
```bash
cd /var/www/bloodnet && bash deploy/deploy.sh
```
- Check process:
```bash
pm2 status
pm2 logs bloodnet
```
- Check web:
```bash
curl -I https://bloodnet.live
```

