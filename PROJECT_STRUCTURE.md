# Finance Budhha — Project Directory Structure

```text
Finance Budhha/
├── public/
│   └── icons/
├── src/
│   ├── app/                          # Next.js App Router entry
│   ├── components/                   # shared ui/components
│   ├── constants/                    # app constants and enums
│   ├── features/
│   │   ├── ai-buddy/
│   │   │   └── components/
│   │   ├── finance/
│   │   │   ├── components/
│   │   │   └── engine/
│   │   └── goals/
│   │       └── components/
│   ├── hooks/                        # reusable React hooks
│   ├── lib/
│   │   ├── calculations/             # pure calculation logic
│   │   ├── db/                       # Dexie IndexedDB setup
│   │   └── validators/               # zod validators
│   ├── services/                     # API/Supabase/LLM clients
│   ├── store/                        # Zustand stores
│   └── types/                        # domain types + schemas
└── PROJECT_STRUCTURE.md
```

## Notes
- Mobile-first PWA structure with clear feature boundaries.
- `src/lib/calculations` keeps finance math deterministic and testable.
- `src/types` hosts both TypeScript types and Zod schemas for input safety.
- This is ready for Next.js 14 App Router and Shadcn/Tailwind integration.
