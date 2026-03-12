# SleeperBid 🏷
**FAAB Proxy Auctions for Sleeper Fantasy Leagues**

A real-time slow-auction tool for Sleeper leagues — blind proxy bidding, 8-hour timers that reset on new bids, and live sync across all teams via Firebase.

---

## Features
- 🔄 **Real-time sync** — bids appear instantly for all teams (Firebase Realtime DB)
- 🤫 **Blind proxy bidding** — enter your max; others only see the current leading amount
- ⏱ **8-hour timer reset** — every new leading bid resets the clock
- 🚫 **One nomination per team** — enforced automatically
- 💰 **FAAB tracking** — committed bids deducted from available balance in real-time
- ⚙️ **Commissioner tools** — process wins, manually override FAAB, reset data
- 📱 **Mobile responsive** — works on any device

---

## Setup (15–20 minutes, all free)

### Step 1 — Create a Firebase project

1. Go to [console.firebase.google.com](https://console.firebase.google.com)
2. Click **Add project** → name it (e.g. `sleeperbid`) → Continue through prompts
3. On the left sidebar, click **Build → Realtime Database**
4. Click **Create Database** → choose a region → start in **Test mode** (you'll secure it in Step 3)
5. Copy the database URL — it looks like:
   ```
   https://sleeperbid-default-rtdb.firebaseio.com
   ```

### Step 2 — Get your Firebase config

1. In Firebase Console, click the ⚙️ gear icon → **Project settings**
2. Scroll down to **Your apps** → click the `</>` (web) icon
3. Register the app (any nickname) — skip Firebase Hosting for now
4. Copy the config object that looks like:
   ```js
   const firebaseConfig = {
     apiKey: "AIza...",
     authDomain: "sleeperbid.firebaseapp.com",
     databaseURL: "https://sleeperbid-default-rtdb.firebaseio.com",
     projectId: "sleeperbid",
     storageBucket: "sleeperbid.appspot.com",
     messagingSenderId: "123456789",
     appId: "1:123456789:web:abc123"
   };
   ```
5. Open `js/firebase-config.js` in this project and replace the placeholder values with yours.

### Step 3 — Secure your database (important!)

In Firebase Console → **Realtime Database → Rules**, replace the default rules with:

```json
{
  "rules": {
    "leagues": {
      "$leagueId": {
        ".read": true,
        ".write": true
      }
    }
  }
}
```

Click **Publish**. This allows anyone with the app URL to read/write — which is what you want for a shared league tool. (For extra security you can add Firebase Auth later.)

### Step 4 — Deploy to GitHub Pages

1. **Create a GitHub repo** (e.g. `sleeperbid`) — make it **public**
2. Push this entire folder to the repo:
   ```bash
   git init
   git add .
   git commit -m "Initial SleeperBid setup"
   git remote add origin https://github.com/YOUR_USERNAME/sleeperbid.git
   git push -u origin main
   ```
3. In GitHub → repo → **Settings → Pages**
4. Under **Source**, select **Deploy from a branch** → `main` → `/ (root)` → Save
5. Your app will be live at:
   ```
   https://YOUR_USERNAME.github.io/sleeperbid/
   ```

> **Alternatively**, drag the folder into [Netlify Drop](https://app.netlify.com/drop) for instant hosting with a shareable URL — no GitHub needed.

---

## How to use

### For all teams
1. Open the app URL
2. Enter your **Sleeper username** (no password needed)
3. The commissioner enters the **League ID** on first visit — saved automatically after that

### Nominating a player
- Go to **Free Agents** tab
- Find a player, click **Nominate**
- Enter your opening max bid → **Start Auction**
- You can only have **one active nomination at a time**

### Bidding
- Go to **Active Auctions**
- Click **Bid** on any auction
- Enter your **maximum** — the system only bids what it needs to beat the competition
- If your max gets beaten, you'll see **"Outbid"** on the card and can bid again
- Every new leading bid resets the **8-hour timer**

### Proxy bid logic (like eBay)
- You enter: `$45` max
- Competitor bids `$30` max → you're shown as winning at `$31`
- Competitor raises to `$50` max → they win at `$46`, you're outbid
- Bids are **blind** — no one sees your max, only the current leading amount

### Commissioner workflow
1. When an auction expires, go to **Commissioner** tab
2. See all **Pending** auctions with winner and price
3. Add the player to the winning team **in Sleeper**
4. Click **Mark Processed ✓** — FAAB is automatically deducted in the app

---

## File structure
```
sleeperbid/
├── index.html              # Main app shell
├── css/
│   └── style.css           # All styles
├── js/
│   ├── firebase-config.js  # ← YOUR Firebase credentials go here
│   ├── sleeper.js          # Sleeper API calls
│   ├── auction.js          # Proxy bid logic + Firebase read/write
│   ├── ui.js               # All rendering
│   └── app.js              # Main controller
└── README.md
```

---

## Sharing with your league

Once deployed, just share the URL. Each team member:
1. Opens the link
2. Logs in with their **Sleeper username**
3. They're automatically connected to your league (the league ID is stored after first setup)

> **Tip:** Bookmark or add to home screen on mobile for app-like access.

---

## Troubleshooting

| Problem | Fix |
|---|---|
| "User not found" | Check Sleeper username spelling (case-sensitive) |
| Bids not syncing | Check Firebase config values in `firebase-config.js` |
| "League not found" | Verify league ID in Sleeper app → Settings |
| Players not loading | Player DB is ~10MB — wait a moment, it caches after first load |
| FAAB looks wrong | Use Commissioner tab to manually override FAAB balances |

---

## Notes
- Player data is cached in the browser for 24 hours (reduces API load)
- FAAB balances pull from Sleeper's API and can be overridden by the commissioner
- All bid history is stored in Firebase and visible in the bid modal
- The commissioner must manually process wins in the Sleeper app — this tool doesn't write back to Sleeper
