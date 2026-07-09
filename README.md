# JAGA-JAGA! 🇲🇾⛈️

**Malaysia's daily readiness game.** Cuaca, amaran, harga minyak — semua dalam satu app, gamified.

> Built for the **[Pasar API](https://pasarapi.xyz) Mini Challenge** by [Kracked Devs](https://instagram.com/krackeddev) · `#KDBounty` `@pamcjuly`

🔗 **Live demo:** https://nurikk-66.github.io/jaga-jaga/ *(enable GitHub Pages — see below)*

---

## 📱 What it does

Every day, Malaysians juggle three questions: *hujan ke tak? ada amaran tak? minyak naik ke?*
JAGA-JAGA! turns that daily check into a game:

| Feature | Powered by |
|---|---|
| 🌆 **Living 3D sky diorama** — a low-poly KL skyline whose sky (sun, clouds, rain particles, lightning, haze, day/night) mirrors the **real** MET Malaysia forecast for your town, in real time | Three.js + Weather API |
| 🚨 **Boss Alerts** — active weather & earthquake warnings, styled like raid bosses | Weather Warning API |
| ☁️ **7-day forecast strip** — swipeable, emoji-mapped, bilingual BM/EN | Weather Forecast API |
| ⛽ **Petrol Watch** — this week's RON95 / RON97 / diesel with ▲▼ vs last week | Data Catalogue API (`fuelprice`) |
| 🎯 **Teka Cuaca** — guess tomorrow's weather, come back to claim +50 XP | Weather Forecast API |
| 🔥 **XP, streaks, ranks & badges** — Budak Baru → Kaki Cuaca → Otai Cuaca → Legenda Pasar | localStorage |

Mobile-first, zero build step, zero API keys, respects `prefers-reduced-motion`.

## 🔌 APIs used (from PasarAPI.xyz)

All from **Malaysia's Official Open API** (`api.data.gov.my`) — free, no auth:

1. **Weather Forecast** — `GET https://api.data.gov.my/weather/forecast?contains=<town>@location__location_name`
   7-day forecast by MET Malaysia. Drives the 3D sky, the forecast strip, and the Teka Cuaca game.
2. **Weather Warnings** — `GET https://api.data.gov.my/weather/warning` and `GET https://api.data.gov.my/weather/warning/earthquake`
   Live warnings by MET Malaysia. Drives Boss Alerts.
3. **Data Catalogue: Fuel Price** — `GET https://api.data.gov.my/data-catalogue?id=fuelprice`
   Weekly RON95/RON97/diesel prices (Ministry of Finance, APM). Drives Petrol Watch.

The app is **built around** these APIs — every screen is live government data.

## ✅ Challenge checklist

- [x] Uses APIs from PasarAPI.xyz (three of them, all `api.data.gov.my`)
- [x] Working web app, actually built around the selected APIs
- [x] Built with an AI coding tool (**Claude**)
- [x] Mobile-friendly layout (mobile-first CSS)
- [x] Publicly viewable via live link (GitHub Pages)
- [x] Open source (MIT)

## 🏃 Run locally

No build step. Any static server works:

```bash
git clone https://github.com/nurikk-66/jaga-jaga.git
cd jaga-jaga
python3 -m http.server 8080   # or: npx serve
# open http://localhost:8080
```

> Note: open via `http://localhost`, not `file://`, because the app uses ES modules.

## 🚀 Deploy (GitHub Pages)

1. Push this repo to GitHub.
2. Repo → **Settings → Pages** → Source: **Deploy from a branch** → Branch: `main` / `(root)` → Save.
3. Your live link appears at `https://<username>.github.io/jaga-jaga/` in ~1 minute.

## 🧱 Stack

Vanilla HTML/CSS/JS + [Three.js](https://threejs.org) (CDN, r160). Fonts: Bungee / Rubik / IBM Plex Mono.
Design system: "pasar malam" palette — Langit Malam `#0E1B2C`, Santan `#F5EFE0`, Cili `#FF4D3D`, Kunyit `#FFC53D`, Pandan `#29C48F`.

## 🤖 AI tooling

This app was designed and coded with **Claude** (Anthropic), per the challenge rules.

## 📄 License & data

Code: [MIT](LICENSE). Data: © Government of Malaysia via [data.gov.my](https://data.gov.my) — weather by MET Malaysia, fuel prices by Ministry of Finance.
