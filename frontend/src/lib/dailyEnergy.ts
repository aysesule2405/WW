// Daily Spirit Energy — per-day action budget tracked in localStorage.
// Resets automatically when the date changes (local time).

export const DAILY_ENERGY_TOTAL = 12

type DailyEnergyRecord = { date: string; remaining: number }

function todayStr(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const KEY = 'ww_sapling_daily_energy'

export function loadDailyEnergy(): number {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return DAILY_ENERGY_TOTAL
    const rec: DailyEnergyRecord = JSON.parse(raw)
    return rec.date === todayStr() ? rec.remaining : DAILY_ENERGY_TOTAL
  } catch {
    return DAILY_ENERGY_TOTAL
  }
}

export function spendDailyEnergy(amount: number): number {
  const next = Math.max(0, loadDailyEnergy() - amount)
  localStorage.setItem(KEY, JSON.stringify({ date: todayStr(), remaining: next }))
  return next
}

export function restoreDailyEnergy(amount: number): number {
  const next = Math.min(DAILY_ENERGY_TOTAL, loadDailyEnergy() + amount)
  localStorage.setItem(KEY, JSON.stringify({ date: todayStr(), remaining: next }))
  return next
}

export function peekDailyEnergyDate(): string | null {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    return (JSON.parse(raw) as DailyEnergyRecord).date
  } catch {
    return null
  }
}
