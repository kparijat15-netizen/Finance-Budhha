# Finance Buddha 🧘‍♂️💰

**Your AI-powered personal finance advisor** - Dashboard, debt strategy, and natural language commands.

> ⚡ **Deploy for FREE in 5 minutes** → See [QUICK_START.md](QUICK_START.md)

## ✨ Features

- 📊 **Live Dashboard** - Health score (savings/EMI/spending), 6-month cashflow trends, pain-point detection
- 🤖 **AI Command Bar** - "add 2k vape today" → auto-detects category (health) + amount
- 💳 **Expense Tracking** - Unnecessary spends by category (food, travel, shopping, entertainment, fuel, utilities, health)
- 💰 **Income Management** - Track salary, bonus, other income sources
- 📈 **Loan/EMI Tracking** - Monitor loans, calculate EMI payoff strategies (snowball vs avalanche)
- 🎯 **Goals** - Smoking cessation tracker (days quit + money saved), diet macro tracking
- 🔄 **Auto-Sync** - localStorage by default, optional Supabase for cloud backup
- 📱 **Mobile-First** - Works on phone, tablet, desktop

## 🚀 Quick Deploy (5 minutes)

```bash
# 1. Get API key (free) from https://console.groq.com/keys
# 2. Push to GitHub
git push origin main

# 3. Deploy to Vercel (go to https://vercel.com/new)
# 4. Add environment variable: GROQ_API_KEY=gsk_...
# 5. Done! 🎉
```

**See [QUICK_START.md](QUICK_START.md) for detailed steps**

## 💻 Tech Stack

- **Frontend:** Next.js 14, React 18, TypeScript, Tailwind CSS
- **State:** Zustand + localStorage (offline-first)
- **AI:** Groq API (llama-3.1-8b) + deterministic fallback
- **Validation:** Zod
- **Icons:** Lucide React
- **Optional DB:** Supabase (PostgreSQL)

## 💰 Cost: $0/Month

| Service | Limit | Enough For |
|---------|-------|-----------|
| **Vercel** | 100GB bandwidth/mo | ✅ This app |
| **Groq API** | 30 req/min | ✅ Heavy daily use |
| **Supabase** | 500MB database | ✅ Years of data |

## 📚 Documentation

- [QUICK_START.md](QUICK_START.md) - Deploy in 5 min
- [DEPLOYMENT.md](DEPLOYMENT.md) - Advanced setup, custom domain, troubleshooting

## 🛠 Development

```bash
npm install
cp .env.local.example .env.local  # Add GROQ_API_KEY
npm run dev
# Open http://localhost:3000
```

## 🤖 Try These Commands

- "add 500 food today"
- "show pain points"
- "what if I cut spends by 5k"
- "debt status"

## 🔒 Security & Production Ready

- ✅ API keys in environment variables only
- ✅ .gitignore prevents accidental commits
- ✅ Zod validation on all inputs
- ✅ TypeScript strict mode
- ✅ All critical bugs fixed
- ✅ Accessibility compliant

---

**🚀 Ready? See [QUICK_START.md](QUICK_START.md) to deploy!**
- EMI and bonus savings logic in [src/lib/calculations/emiCalculator.ts](src/lib/calculations/emiCalculator.ts)
- Personal profile constants in [src/constants/profile.ts](src/constants/profile.ts)

## Next
- Scaffold Next.js 14 App Router + Tailwind + Shadcn/UI
- Add Dexie local-first persistence
- Add dashboard pages for EMI, spends, goals, and AI financial buddy
