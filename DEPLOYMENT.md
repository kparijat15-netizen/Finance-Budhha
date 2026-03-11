# 🚀 Finance Buddha - Deployment Guide

## Quick Start (5 minutes)

### 1. Prepare Code for Deployment

```bash
# Go to project directory
cd /Users/parijatkuljarni/Desktop/Finance\ Budhha

# Create .gitignore (already done)
# Create .env.local with your API key

# Initialize Git (if not done)
git init
git add .
git commit -m "Initial commit"
```

### 2. Get Groq API Key (FREE)

1. Visit: https://console.groq.com/keys
2. Sign up (free account)
3. Click "Create API Key"
4. Copy the key
5. Add to `.env.local`: `GROQ_API_KEY=gsk_...`

**Free Tier includes:**
- 30 requests per minute
- Unlimited monthly calls (generous limits)
- Access to llama-3.1-8b model

### 3. Deploy to Vercel (FREE)

**Best Option - Takes 2 minutes**

#### Step A: Create GitHub Repository

```bash
# Create new repo at https://github.com/new
# Name it: finance-buddha

# Add remote
git remote add origin https://github.com/YOUR_USERNAME/finance-buddha.git
git branch -M main
git push -u origin main
```

#### Step B: Deploy with Vercel

1. Go to https://vercel.com/new
2. Sign in with GitHub
3. Select your `finance-buddha` repository
4. Click **Deploy**
5. Wait ~2 minutes for build to complete

#### Step C: Add Environment Variables

1. In Vercel Dashboard, click on your project
2. Go to **Settings > Environment Variables**
3. Add new variable:
   - Name: `GROQ_API_KEY`
   - Value: `gsk_...` (your API key)
4. Go to **Deployments > Re-deploy** (the latest one)

**✅ Done! Your app is live!**

Example URL: `https://finance-buddha-abc123.vercel.app`

---

## Advanced: Add Cloud Database (Optional)

### Supabase Setup (Free Tier - PostgreSQL)

**Why add database?**
- Cloud backup of data
- Share data across devices
- Export/analytics later

#### Step 1: Create Supabase Project

1. Go to https://supabase.com/dashboard
2. Sign in with GitHub
3. Click **New Project**
4. Fill in:
   - Name: `finance-buddha`
   - Password: Generate secure password
   - Region: Choose closest to you
5. Wait ~2 minutes for database creation

#### Step 2: Create Tables (Optional)

Go to **SQL Editor** and paste:

```sql
-- Spends table
CREATE TABLE spends (
  id TEXT PRIMARY KEY,
  category TEXT,
  amount NUMERIC,
  merchant TEXT,
  memo TEXT,
  spent_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Incomes table
CREATE TABLE incomes (
  id TEXT PRIMARY KEY,
  source TEXT,
  amount NUMERIC,
  received_at TIMESTAMP,
  note TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Loans table
CREATE TABLE loans (
  id TEXT PRIMARY KEY,
  lender_name TEXT,
  label TEXT,
  principal_outstanding NUMERIC,
  annual_interest_rate NUMERIC,
  monthly_emi NUMERIC,
  due_day_of_month INT,
  opened_on DATE,
  is_active BOOLEAN,
  created_at TIMESTAMP DEFAULT NOW()
);
```

Click **RUN** button.

#### Step 3: Add to Vercel

1. In Supabase, go to **Settings > API**
2. Copy:
   - `Project URL` → Add as `NEXT_PUBLIC_SUPABASE_URL`
   - `Anon key` → Add as `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. In Vercel Settings > Environment Variables, add both
4. Re-deploy

---

## Deployment Comparison

| Hosting | Cost | Setup Time | Best For |
|---------|------|-----------|----------|
| **Vercel** | Free | 2 min | This project ✅ |
| Netlify | Free | 3 min | Alternative to Vercel |
| Railway | Free | 5 min | With custom backend |
| Render | Free | 5 min | With custom backend |

---

## Database Comparison

| Database | Cost | Setup | Best For |
|----------|------|-------|----------|
| **Supabase** | Free | 3 min | PostgreSQL + API ✅ |
| Firebase | Free | 5 min | Real-time apps |
| Neon | Free | 3 min | PostgreSQL only |
| MongoDB Atlas | Free | 5 min | NoSQL databases |

**Recommendation:** Supabase + Vercel (best combo for this project)

---

## Custom Limits (Free Tiers)

### Vercel
- ✅ Unlimited deployments
- ✅ 100GB bandwidth/month
- ✅ 10 serverless functions
- ✅ 50ms function duration (enough for API calls)
- ✅ Zero cold starts for this load

### Groq API
- ✅ 30 req/min (for free)
- ✅ 1000 req/day (generous)
- ✅ Unlimited monthly (fair use)
- ✅ Access to llama-3.1-8b

### Supabase (Free Tier)
- ✅ 500MB database storage
- ✅ Unlimited API calls
- ✅ 50MB/month file storage
- ✅ Auth users
- ✅ Real-time subscriptions

**Enough for:** 1 user with years of data

---

## Post-Deployment Checklist

- [ ] Domain set (optional - use Vercel subdomain)
- [ ] GROQ_API_KEY configured in Vercel
- [ ] Supabase URL/keys configured (if using)
- [ ] Test the app: https://your-app.vercel.app
- [ ] Create account at Groq to monitor usage
- [ ] Monitor Vercel analytics (optional)

---

## Custom Domain (Optional)

### Add Your Own Domain

1. Buy domain at:
   - Namecheap.com (cheapest)
   - GoDaddy.com
   - Vercel Domains

2. In Vercel **Settings > Domains**
   - Add your domain
   - Update DNS records (Vercel provides steps)
   - Wait ~15 min for DNS propagation

**Cost:** Domain only ($0-15/year), hosting still FREE

---

## Scaling After Launch

When you outgrow free tier:

| When | Upgrade | Cost |
|------|---------|------|
| >100GB bandwidth/mo | Vercel Pro | $20/mo |
| >500MB data | Supabase Pro | $25/mo |
| >100 concurrent users | Vercel Advanced | Custom |

---

## Troubleshooting

### "GROQ_API_KEY not found"
- Add to `.env.local` locally
- Add to Vercel environment variables
- **Redeploy** from Vercel dashboard

### "Build failed"
- Check build logs in Vercel
- Run `npm run build` locally to debug
- Ensure TypeScript has no errors: `npm run lint`

### "API returns 500 error"
- Check API key is valid
- Check Groq API status: https://status.groq.com
- Check Vercel function logs

### "Can't connect to Supabase"
- Verify URL/keys in environment
- Check Supabase project is active
- Ensure rows public access enabled (in RLS)

---

## Maintenance

### Update Dependencies
```bash
npm update
git commit -m "Update dependencies"
git push origin main
# Vercel auto-redeploys
```

### Monitor Usage
- **Groq:** https://console.groq.com (check usage)
- **Vercel:** Dashboard analytics
- **Supabase:** Dashboard metrics

### Backup Data (Supabase)
```bash
# Monthly export in Supabase Settings > Backups
# Or use: pg_dump (command line)
```

---

## Final Cost Breakdown

| Service | Cost | Why Free |
|---------|------|----------|
| Vercel Hosting | $0 | Free tier for up to 10 functions |
| Groq API | $0 | Free tier (generous limits) |
| Supabase Database | $0 | Free tier (500MB enough) |
| Domain (optional) | $10/yr | Not needed - use Vercel subdomain |
| **TOTAL** | **$0-10/yr** | ✅ Production ready |

---

## Live Example

Once deployed, your app will be:
- ✅ Accessible from anywhere
- ✅ Fast (Vercel edge network)
- ✅ Scalable (auto-scales)
- ✅ Secure (HTTPS, environment variables)
- ✅ Backed up (Supabase)
- ✅ Free forever (within fair use)

**Example production URL:**
`https://finance-buddha.vercel.app`

---

**Need help?**
- Vercel docs: https://vercel.com/docs
- Groq API docs: https://console.groq.com/docs
- Supabase docs: https://supabase.com/docs
