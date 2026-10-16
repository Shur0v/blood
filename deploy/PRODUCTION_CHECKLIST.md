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
bash ./deploy-prod.sh
```

For a VPS with the older locally created `deploy-prod.sh`, install the tracked entry point once. This preserves the old script in root's home directory before replacing it:

```bash
cd /var/www/bloodnet
cp ./deploy-prod.sh "/root/bloodnet-deploy-prod-$(date -u +%Y%m%dT%H%M%SZ).sh"
git fetch origin main
git show origin/main:deploy-prod.sh > ./deploy-prod.sh
bash ./deploy-prod.sh
```

The entry point fetches the current deployment implementation before executing it, so a deployment never continues with old in-memory steps after updating the checkout. Core Nginx/PostgreSQL service checks are retained on systemd servers.

After `npm ci`, deployment explicitly generates Prisma before any backend configuration check imports `PrismaClient`. The build's own generation step is too late for those checks.

The locked dependencies require Node 22.12+ (or Node 24+). If the shared VPS runtime is older, deployment installs and reuses a private Node 22 runtime in `/var/lib/bloodnet/node-runtime`. BloodNet's web process and prescription worker receive that interpreter and PATH explicitly. The system Node installation, global PM2 installation and other PM2 applications are unchanged. A runtime installation failure stops before pausing running BloodNet processes.

## 7) PM2 auto-start after VPS reboot
```bash
pm2 startup systemd
pm2 save
```
Run the command printed by `pm2 startup` (it usually starts with `sudo env PATH=...`).

## 8) Daily operations

Use the same entry point for normal deployments and missing medical-storage configuration:

```bash
cd /var/www/bloodnet
bash ./deploy-prod.sh
```

The deployment runs `medical:configure` automatically after dependency installation and before production checks. It keeps an existing valid key unchanged. It creates an initial key
in `.env.production.local` only when the database has no encrypted medical records
or verification assets. It preserves other settings, privately backs up an existing
file, and never prints the key. If encrypted data exists, restore its original key
from a secure backup; do not generate a replacement. Back up `.env.production.local`
securely too. The deploy restarts both the web app and prescription worker so they
load that file. Health checks now fail when the running medical-storage key is
missing or invalid, even if ordinary public-page database reads work.

- Deploy latest main:
```bash
cd /var/www/bloodnet && bash ./deploy-prod.sh
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


The doctor integration API key is optional for patient-upload features. If provided, it must meet the existing minimum length; without it, the doctor integration endpoint continues to reject submissions.
