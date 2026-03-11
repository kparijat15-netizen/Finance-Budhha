# Backend Architecture Options

## Current Setup (Recommended for MVP)

```
Frontend (Vercel)  ←→  Groq API  (Free LLM)
     ↓
localStorage (client-side only)
```

**Pros:**
- ✅ Zero backend maintenance
- ✅ Zero database cost ($0)
- ✅ Works offline
- ✅ Data stays on device

**Cons:**
- ❌ No multi-device sync
- ❌ Data lost if browser cleared

---

## Option A: Add Supabase (PostgreSQL) - RECOMMENDED

```
Frontend (Vercel)  ←→  Supabase API  (PostgreSQL)
     ↓
Groq API  (Free LLM)
```

**Setup:** 5 minutes  
**Cost:** $0 (free tier)  
**Data:** Cloud backup

### Add Supabase

1. Go to https://supabase.com/dashboard
2. Create new project (free tier)
3. Get URL and API key from Settings > API
4. Add to Vercel environment variables:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJx...
   ```

5. Optional: Create tables with SQL:
   ```sql
   CREATE TABLE spends (id TEXT PRIMARY KEY, category TEXT, amount NUMERIC, ...);
   CREATE TABLE incomes (id TEXT PRIMARY KEY, source TEXT, amount NUMERIC, ...);
   CREATE TABLE loans (id TEXT PRIMARY KEY, ...);
   ```

### Use in App

Add calls in CommandBar.tsx:
```typescript
import { syncSpendToCloud } from '@/lib/supabase'

// After addSpend()
addSpend(spend)
await syncSpendToCloud(spend)  // New line
```

**Free Tier Limits:**
- 500MB storage
- Unlimited API calls
- Real-time subscriptions
- Row-level security

---

## Option B: Firebase (Google) - Alternative

```
Frontend (Vercel)  ←→  Firebase  (Realtime DB or Firestore)
```

**Cost:** $0 (free tier)  
**Setup:** 10 minutes  
**Best for:** Real-time updates

### Setup Firebase

1. Go to https://console.firebase.google.com
2. Create new project
3. Create Firestore database (free tier)
4. Get config from Settings

### Add to Project

```bash
npm install firebase
```

Create `lib/firebase.ts`:
```typescript
import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'

const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_KEY,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT,
  // ... other config
}

const app = initializeApp(config)
export const db = getFirestore(app)
```

**Free Tier Limits:**
- 1GB storage
- 50K reads/day
- 20K writes/day

---

## Option C: MongoDB + Backend Server - Advanced

```
Frontend (Vercel)  ←→  Next.js API Routes  ←→  MongoDB Atlas
                           ↓
                        Groq API
```

**Cost:** $0 (MongoDB free tier)  
**Setup:** 15 minutes  
**Best for:** Complex backend logic

### Add MongoDB

1. Go to https://mongodb.com/cloud/atlas
2. Create free cluster
3. Get connection string
4. Add to Vercel: `MONGODB_URI=mongodb+srv://...`

### Add to Project

```bash
npm install mongodb
```

Create `lib/mongodb.ts`:
```typescript
import { MongoClient } from 'mongodb'

const client = new MongoClient(process.env.MONGODB_URI!)
export async function connectDB() {
  return client.db('finance-buddha')
}
```

**Free Tier Limits:**
- 512MB storage
- Shared cluster
- Limited performance

---

## Option D: Neon (PostgreSQL) - Best for SQL Lovers

```
Frontend (Vercel)  ←→  Neon API  (PostgreSQL)
```

**Cost:** $0 (free tier)  
**Setup:** 5 minutes  
**Best for:** SQL developers

### Setup Neon

1. Go to https://console.neon.tech
2. Create new project (free tier)
3. Get connection string
4. Add to Vercel: `DATABASE_URL=postgres://...`

**Free Tier:**
- 3GB storage
- Unlimited connections
- Auto-scaling

---

## Comparison Table

| Feature | Supabase | Firebase | MongoDB | Neon |
|---------|----------|----------|---------|------|
| **Setup Time** | 5 min | 10 min | 15 min | 5 min |
| **Cost** | $0 | $0 | $0 | $0 |
| **Storage** | 500MB | 1GB | 512MB | 3GB |
| **Best For** | SQL + Auth | Real-time | Flexible | SQL |
| **Learning Curve** | Easy | Medium | Medium | Easy |
| ****Recommendation** | ✅ BEST | ⭐ Real-time | 👍 Complex | ⭐ SQL Power |

---

## Recommended Architecture

### For MVP (Now)
**Vercel + Groq + localStorage**
- Zero setup
- Works immediately
- Free forever

### For Production (After MVP)
**Vercel + Groq + Supabase**
- Cloud backup
- Multi-device sync
- Still free tier
- Only add if needed

### For Enterprise (Scaling)
**Vercel + Groq + Supabase + Custom API**
- Upgrade Supabase to paid
- Add custom middleware
- Implement caching
- Monitor usage

---

## Migration Path

```
Today:
  localStorage
     ↓
When needed:
  localStorage + Supabase sync
     ↓
When scaling:
  Full Supabase + API routes
     ↓
When enterprise:
  Dedicated backend + Database cluster
```

---

## Quick Start with Supabase

**Step 1:** Create Supabase project (https://supabase.com)
**Step 2:** Copy URL and key to Vercel environment
**Step 3:** Create tables (use SQL provided)
**Step 4:** Import the `lib/supabase.ts` functions
**Step 5:** Call `syncSpendToCloud()` after `addSpend()`
**Step 6:** Redeploy

**Time: 10 minutes**

---

## Pricing Growth

| Users | Stage | Estimated Cost |
|-------|-------|-----------------|
| 1 | MVP | $0/mo |
| 1 | With backup | $0/mo (Supabase free) |
| 100 | Growing | $25/mo (Supabase Pro) |
| 1000+ | Scale | $100+/mo (Custom infra) |

---

**Current Recommendation:** Deploy now with localStorage, add Supabase later if needed.

This gives you: Best user experience + Zero cost + Easy migration path.
