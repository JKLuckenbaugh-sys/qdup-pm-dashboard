# Studio Desk — Content Agency Dashboard

A clean, fast project management dashboard built for content marketing agencies.
**Stack:** React + Vite · Firebase (Auth + Firestore) · Tailwind CSS · Netlify

---

## Quick Start

### 1. Install dependencies
```bash
cd content-dashboard
npm install
```

### 2. Set up Firebase

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click **Add project** → name it (e.g. "studio-desk")
3. Once created, click the **Web** icon (</>) to add a web app
4. Copy the config values shown

#### Enable Authentication:
- Sidebar → **Authentication** → **Get started**
- Enable **Email/Password** provider

#### Enable Firestore:
- Sidebar → **Firestore Database** → **Create database**
- Choose **Production mode** (we'll apply rules next)
- Pick any region (us-east1 is fine)

#### Deploy Security Rules:
- Install Firebase CLI: `npm install -g firebase-tools`
- `firebase login`
- `firebase init firestore` (select your project)
- Copy the contents of `firestore.rules` into the rules editor in Firebase Console
  OR run: `firebase deploy --only firestore:rules`

### 3. Add your environment variables

```bash
cp .env.example .env
```

Open `.env` and fill in your Firebase values:
```
VITE_FIREBASE_API_KEY=your_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### 4. Create your first admin user

You need to bootstrap your first admin manually:

1. In Firebase Console → Authentication → Users → **Add user**
   - Enter your email + a password
   - Copy the **UID** shown

2. In Firestore → **users** collection → **Add document**
   - Document ID: paste your UID
   - Add these fields:
     ```
     name    (string)  → Your Name
     email   (string)  → your@email.com
     role    (string)  → admin
     clientId (null)   → null
     ```

### 5. Run locally
```bash
npm run dev
```
Open http://localhost:5173 and log in.

---

## Deploy to Netlify

### Option A: GitHub (recommended)
1. Push this folder to a GitHub repo
2. Go to [Netlify](https://app.netlify.com) → **Add new site** → **Import from Git**
3. Connect your repo
4. Build settings (auto-detected from netlify.toml):
   - Build command: `npm run build`
   - Publish directory: `dist`
5. Go to **Site settings → Environment variables** and add all your `VITE_FIREBASE_*` vars
6. Deploy!

### Option B: Netlify CLI
```bash
npm install -g netlify-cli
npm run build
netlify deploy --prod --dir=dist
```
Add your env vars in the Netlify dashboard afterward.

---

## Project Structure

```
src/
├── components/
│   ├── auth/          # Login, ProtectedRoute
│   ├── layout/        # Sidebar, TopBar, Layout
│   ├── modals/        # Modal base, ItemDetailModal
│   └── project/       # GroupSection, ItemRow, SubItemRow, CardView
├── context/
│   └── AuthContext.jsx    # Firebase auth + user profile
├── pages/
│   ├── Dashboard.jsx      # Home — all clients overview
│   ├── ClientView.jsx     # Client workspace — all projects
│   ├── ProjectView.jsx    # Project — groups + items (list & board)
│   └── AdminPanel.jsx     # Manage users & clients
└── utils/
    └── constants.js       # Statuses, content types, helpers
```

---

## User Roles

| Role    | Can do |
|---------|--------|
| **Admin**  | Everything — add clients, create users, delete anything |
| **Staff**  | Create/edit groups, items, subitems — update statuses |
| **Client** | View their projects only — comment, approve content |

---

## Data Hierarchy

```
clients/{clientId}
  └── projects/{projectId}
        └── groups/{groupId}
              └── items/{itemId}
                    └── subitems/{subitemId}

comments/{commentId}   ← flat collection, filtered by itemId
users/{uid}            ← one doc per user, uid = Firebase Auth uid
```

---

## Adding Features (safe pattern)

The codebase is intentionally modular. To add a new feature:

1. **New field on items** → Add to `ItemDetailModal.jsx` form + save in `handleSave()`
2. **New page** → Create in `src/pages/`, add route in `App.jsx`, add nav link in `Sidebar.jsx`
3. **New modal** → Copy `Modal.jsx` as a base
4. **New status** → Add to `STATUSES` array in `constants.js` — everything else updates automatically

Never edit `firebase.js` or `AuthContext.jsx` unless changing auth provider.

---

## Cost Estimate

| Service | Free Tier | Your likely usage |
|---------|-----------|-------------------|
| Firebase Firestore | 50k reads/day, 20k writes/day | Well under |
| Firebase Auth | 10k users/month | Way under |
| Netlify | 100GB bandwidth, 300 build min/month | Well under |
| **Total** | **$0/month** | For a small agency |

You'd need 50,000+ daily active users before hitting paid tiers.
