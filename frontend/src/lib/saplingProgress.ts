// Persistent Spirit Sapling progress — challenge tracking and guardian unlocks.
// Stored in localStorage so it survives across sessions without a backend call.

export type SaplingProgress = {
  harvestsByGuardian: Record<string, number>
  talkFreeHarvests:   number
  totalEventsSurvived: number
  unlockedGuardians:  string[]
}

export type LockedGuardianDef = {
  id:              string
  name:            string
  lore:            string
  synergy:         'water' | 'sun' | 'talk' | 'spirit' | 'any'
  unlockLabel:     string
  unlockProgress:  (p: SaplingProgress) => number
  unlockTotal:     number
  placeholderImage: string
}

const STORAGE_KEY = 'ww_sapling_progress'

const DEFAULTS: SaplingProgress = {
  harvestsByGuardian:  {},
  talkFreeHarvests:    0,
  totalEventsSurvived: 0,
  unlockedGuardians:   [],
}

export function loadSaplingProgress(): SaplingProgress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : { ...DEFAULTS }
  } catch {
    return { ...DEFAULTS }
  }
}

export function saveSaplingProgress(p: SaplingProgress): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(p))
}

const ORIGINAL_IDS = ['deer', 'fox', 'kodama', 'mononoke']

// Guardians unlocked by completing specific challenges.
// Art placeholders are CSS-filtered versions of existing images until dedicated assets are created.
export const LOCKED_GUARDIANS: LockedGuardianDef[] = [
  {
    id:               'wanderer',
    name:             'The Wanderer',
    lore:             'Belongs to no grove — and therefore to all of them. Adapts to whatever the forest needs.',
    synergy:          'any',
    unlockLabel:      'Harvest with all four guardians',
    unlockProgress:   (p) => ORIGINAL_IDS.filter(id => (p.harvestsByGuardian[id] ?? 0) > 0).length,
    unlockTotal:      4,
    placeholderImage: '/assets/backgrounds/spirit-sapling/guardians/mononoke-guardian.png',
  },
  {
    id:               'silent',
    name:             'The Silent One',
    lore:             'Some things grow best without words. It watches. It remembers. It knows.',
    synergy:          'spirit',
    unlockLabel:      'Complete 3 harvests without talking to the spirit',
    unlockProgress:   (p) => Math.min(p.talkFreeHarvests, 3),
    unlockTotal:      3,
    placeholderImage: '/assets/backgrounds/spirit-sapling/guardians/kodama-guardian.png',
  },
]

export function checkUnlocks(p: SaplingProgress): string[] {
  return LOCKED_GUARDIANS
    .filter(g => !p.unlockedGuardians.includes(g.id))
    .filter(g => g.unlockProgress(p) >= g.unlockTotal)
    .map(g => g.id)
}

export function updateProgressAfterHarvest(
  guardianId:     string,
  eventsSurvived: number,
  usedTalk:       boolean,
): SaplingProgress {
  const p = loadSaplingProgress()
  p.harvestsByGuardian[guardianId] = (p.harvestsByGuardian[guardianId] ?? 0) + 1
  p.totalEventsSurvived += eventsSurvived
  if (!usedTalk) p.talkFreeHarvests += 1
  const newUnlocks = checkUnlocks(p)
  if (newUnlocks.length > 0) {
    p.unlockedGuardians = [...p.unlockedGuardians, ...newUnlocks]
  }
  saveSaplingProgress(p)
  return p
}
