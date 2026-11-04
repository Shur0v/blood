# BloodNet static asset rollout and access troubleshooting

## Install the origin route once

Do this before running the first deployment containing the new asset checks. Keep the existing HTTPS configuration, Certbot settings, Cloudflare rules, and recovery routes. Perform the rollout outside an active recovery or maintenance window.

From `/var/www/bloodnet`, after the release is available on `origin/main`, seed the archive from the current build before switching Nginx:

```bash
git fetch origin main
asset_setup="$(mktemp -d)"
git show origin/main:deploy/static-assets.mjs > "$asset_setup/static-assets.mjs"
git show origin/main:deploy/nginx/bloodnet-static.conf > "$asset_setup/bloodnet-static.conf"
sudo install -d -m 755 /var/lib/bloodnet-static
node "$asset_setup/static-assets.mjs" publish
sudo install -m 644 "$asset_setup/bloodnet-static.conf" /etc/nginx/snippets/bloodnet-static.conf
```

Use the BloodNet deployment account with write access to the archive (root on the current VPS). Back up the actual BloodNet Nginx configuration. In its **HTTPS** server block, add exactly one `include /etc/nginx/snippets/bloodnet-static.conf;` alongside the broader `/_next/` proxy. If an exact `/_next/static/` location already exists, replace that location rather than duplicating it. Do not replace the whole server block.

```bash
sudo nginx -t && sudo systemctl reload nginx
node "$asset_setup/static-assets.mjs" probe
bash ./deploy-prod.sh
```

The probe bypasses Cloudflare and uses HTTPS with BloodNet's hostname and the local Nginx listener. It checks an archive-only CSS file and a distinct missing file. If this fails, deployment stops before stopping the application. Restore the backed-up Nginx config if the route setup needs to be rolled back, then validate and reload Nginx. The archive can remain in place.

Deployment retains the outgoing files, publishes the new build before restarting the app, checks the homepage's stylesheet and script URLs through local Nginx, and only then prunes unused files older than 30 days. Active files are never pruned. Keep the archive outside the checkout and allow disk space for overlapping releases. Do not empty it during deployment. Assets already missing before this rollout cannot be recovered by retention.

## Verify public access

- Test the root and `www` over HTTPS. Confirm `www` reaches the canonical homepage, the homepage retains `no-store`, and referenced CSS and JavaScript return HTTP 200 with the right MIME types. Test IPv4 and IPv6 from networks that support each protocol. For example, run `curl -4 -I https://bloodnet.live/` and `curl -6 -I https://bloodnet.live/`.
- In Cloudflare, verify no rule forces caching of dynamic HTML or overrides `no-store` on asset errors. A unique nonexistent `/_next/static/` CSS URL must return a non-cacheable 404 on repeat requests. Keep immutable caching for successful assets. Correct any conflicting rule narrowly. [Cloudflare cache by status code](https://developers.cloudflare.com/cache/how-to/configure-cache-status-code/)
- Keep a page open before deployment. After deployment, confirm its previous CSS and JavaScript URLs still return the same bytes. Test the fresh page as well, including on iPhone Safari, Android Chrome and desktop browsers over Wi-Fi and cellular. Retained static files should still load if the homepage is under maintenance.

## Diagnose an affected device

If an iPhone shows **Website Not Allowed**, compare Wi-Fi and cellular and try another device on the same Wi-Fi. If the block follows the phone, its authorized owner, parent or administrator should review [Apple's Web Content settings](https://support.apple.com/en-nz/guide/iphone/iph3ff83f3b1/ios) or the managed device filter. If it follows the network, check DNS, TLS and the network filter. A Cloudflare-branded block or Ray ID can be investigated in Cloudflare Security Events using the timestamp and Ray ID; correct only the confirmed false-positive rule.

If the page loads unstyled, record the first failing CSS URL, HTTP status or browser error, time with timezone, browser and network. Compare that URL at the Cloudflare edge and at the local HTTPS origin. An origin 404 points to missing content; a valid origin response with an edge or device failure points to a different layer. Browser and network owners control their own restrictions.
