# ⚡ QUICK START - Deploy in 5 Minutes

## Step 1: Get API Key (2 min)
```
1. Go to https://console.groq.com/keys
2. Sign up (free)
3. Create API key
4. Copy it
```

## Step 2: Setup Git (2 min)
```bash
cd ~/Desktop/Finance\ Budhha

# Create GitHub repo at https://github.com/new
git remote add origin https://github.com/YOUR_USERNAME/finance-buddha.git
git branch -M main
git push -u origin main
```

## Step 3: Deploy to Vercel (1 min)
```
1. Go to https://vercel.com/new
2. Sign in with GitHub
3. Import finance-buddha repo
4. Click Deploy
5. Done! Wait 2 min
```

## Step 4: Add API Key to Vercel (1 min)
```
1. In Vercel Dashboard > Settings > Environment Variables
2. Add: GROQ_API_KEY = gsk_...
3. Go to Deployments > Redeploy latest
```

## 🎉 LIVE! Your app is now at:
```
https://finance-buddha-XXXXX.vercel.app
```

---

## Optional: Add Database

1. Go to https://supabase.com/dashboard
2. Create new project (free tier)
3. In Vercel add env vars:
   - NEXT_PUBLIC_SUPABASE_URL
   - NEXT_PUBLIC_SUPABASE_ANON_KEY
4. Redeploy

---

## Verify Everything Works

### Test Frontend
- Open your Vercel URL
- Try: "add 500 food today"
- Should see success card

### Test Backend
- Open DevTools (F12)
- Go to Network tab
- Send command
- Check /api/command response

### Test API Key
- Go to https://console.groq.com
- Check usage stats

---

## Total Cost
**$0/month (Forever Free)** ✅

---

## Support
- Stuck? Check DEPLOYMENT.md in project
- Vercel issues? https://vercel.com/docs
- API issues? https://console.groq.com/docs
