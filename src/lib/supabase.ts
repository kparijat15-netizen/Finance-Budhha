// Optional: Supabase integration for cloud backup
// To use, uncomment addSpendToCloud() calls in CommandBar
// Requires: DATABASE_URL environment variable + Supabase setup

import type { IncomeEntry, UnnecessarySpend, EmiLoan } from '../types/finance'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

interface SupabaseSpend extends UnnecessarySpend {
  created_at?: string
}

interface SupabaseIncome extends IncomeEntry {
  created_at?: string
}

interface SupabaseLoan extends EmiLoan {
  created_at?: string
}

/**
 * Optional: Sync spend to cloud (Supabase)
 * Not enabled by default - uses localStorage only
 * To enable: call this after addSpend() in CommandBar
 */
export async function syncSpendToCloud(spend: UnnecessarySpend) {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.debug('Supabase not configured - using localStorage only')
    return
  }

  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/spends`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
      },
      body: JSON.stringify({
        ...spend,
        created_at: new Date().toISOString(),
      }),
    })

    if (!res.ok) {
      console.warn('Failed to sync spend to cloud:', await res.text())
    }
  } catch (err) {
    console.warn('Cloud sync disabled - using localStorage:', err)
  }
}

export async function syncIncomeToCloud(income: IncomeEntry) {
  if (!SUPABASE_URL || !SUPABASE_KEY) return

  try {
    await fetch(`${SUPABASE_URL}/rest/v1/incomes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
      },
      body: JSON.stringify({
        ...income,
        created_at: new Date().toISOString(),
      }),
    })
  } catch (err) {
    console.warn('Cloud sync failed:', err)
  }
}

export async function syncLoanToCloud(loan: EmiLoan) {
  if (!SUPABASE_URL || !SUPABASE_KEY) return

  try {
    await fetch(`${SUPABASE_URL}/rest/v1/loans`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
      },
      body: JSON.stringify({
        ...loan,
        created_at: new Date().toISOString(),
      }),
    })
  } catch (err) {
    console.warn('Cloud sync failed:', err)
  }
}
