export type Rarity = 'common' | 'rare' | 'epic' | 'legendary'
export type AchievementCategory = 'drift' | 'sapling' | 'delivery' | 'halfmoon' | 'grove' | 'secret'

export type AchievementDefinition = {
  code: string
  title: string
  description: string
  icon: string
  rarity: Rarity
  category: AchievementCategory
  iconUrl?: string
  secret?: boolean
  hint?: string
  future?: boolean
  criteria: Record<string, unknown>
}

export const ACHIEVEMENTS: AchievementDefinition[] = [

  // ── Spirit Sapling ──────────────────────────────────────────────────────────
  {
    code: 'sapling_tree_deer',
    title: 'Peach Tree Unlocked',
    description: 'Grow a sacred Peach Tree with the Deer guardian.',
    icon: '🦌', rarity: 'common', category: 'sapling',
    criteria: { gameSlug: 'spirit-sapling', guardianId: 'deer' },
  },
  {
    code: 'sapling_tree_fox',
    title: 'Persimmon Tree Unlocked',
    description: 'Grow a sacred Persimmon Tree with the Fox guardian.',
    icon: '🦊', rarity: 'common', category: 'sapling',
    criteria: { gameSlug: 'spirit-sapling', guardianId: 'fox' },
  },
  {
    code: 'sapling_tree_kodama',
    title: 'Pear Tree Unlocked',
    description: 'Grow a sacred Pear Tree with the Kodama guardian.',
    icon: '🌿', rarity: 'common', category: 'sapling',
    criteria: { gameSlug: 'spirit-sapling', guardianId: 'kodama' },
  },
  {
    code: 'sapling_tree_mononoke',
    title: 'Apple Tree Unlocked',
    description: 'Grow a sacred Apple Tree with the Mononoke guardian.',
    icon: '👹', rarity: 'common', category: 'sapling',
    criteria: { gameSlug: 'spirit-sapling', guardianId: 'mononoke' },
  },
  {
    code: 'sapling_all_trees',
    title: 'Grove Orchard Keeper',
    description: 'Unlock all four sacred Spirit Sapling trees.',
    icon: '🌳', rarity: 'rare', category: 'sapling',
    criteria: { gameSlug: 'spirit-sapling', requiredTrees: 4 },
  },
  {
    code: 'sapling_10_sessions',
    title: 'Patient Gardener',
    description: 'Tend to the sapling grove across 10 sessions.',
    icon: '🌱', rarity: 'common', category: 'sapling',
    criteria: { gameSlug: 'spirit-sapling', sessionCountGte: 10 },
  },
  {
    code: 'sapling_harmony',
    title: 'In Harmony',
    description: 'Complete a Spirit Sapling session with the harmony bonus.',
    icon: '✨', rarity: 'rare', category: 'sapling',
    criteria: { gameSlug: 'spirit-sapling', harmonyBonus: true },
  },
  {
    code: 'sapling_harmony_5',
    title: 'Grove Attuned',
    description: 'Achieve the harmony bonus in 5 separate Spirit Sapling sessions.',
    icon: '🌸', rarity: 'epic', category: 'sapling',
    criteria: { gameSlug: 'spirit-sapling', harmonyBonusCount: 5 },
  },
  {
    code: 'sapling_guardian_devoted',
    title: 'Guardian Bond',
    description: 'Complete 10 Spirit Sapling sessions with the same guardian.',
    icon: '🫶', rarity: 'rare', category: 'sapling',
    criteria: { gameSlug: 'spirit-sapling', sameGuardianCount: 10 },
  },
  {
    code: 'sapling_hidden_seed_first',
    title: 'Forest Whisper',
    description: 'Discover your first hidden seed scattered through the grove.',
    icon: '🌰', rarity: 'rare', category: 'sapling',
    future: true,
    criteria: { gameSlug: 'spirit-sapling', hiddenSeedFound: 1 },
  },
  {
    code: 'sapling_hidden_seeds_all',
    title: 'Secret Keeper',
    description: 'Find every hidden seed in the Spirit Sapling grove.',
    icon: '🗝️', rarity: 'legendary', category: 'sapling',
    future: true,
    criteria: { gameSlug: 'spirit-sapling', allHiddenSeedsFound: true },
  },

  // ── Delivery on the Wind ────────────────────────────────────────────────────
  {
    code: 'delivery_under_60',
    title: 'One-Minute Courier',
    description: 'Finish Delivery on the Wind in under 60 seconds.',
    icon: '📦', rarity: 'rare', category: 'delivery',
    criteria: { gameSlug: 'delivery-on-the-wind', completionTimeSecondsLt: 60 },
  },
  {
    code: 'delivery_under_45',
    title: 'Tailwind Specialist',
    description: 'Finish Delivery on the Wind in under 45 seconds.',
    icon: '💨', rarity: 'epic', category: 'delivery',
    criteria: { gameSlug: 'delivery-on-the-wind', completionTimeSecondsLt: 45 },
  },
  {
    code: 'delivery_under_30',
    title: 'Phantom Courier',
    description: 'Complete every delivery in under 30 seconds — barely a whisper.',
    icon: '⚡', rarity: 'legendary', category: 'delivery',
    criteria: { gameSlug: 'delivery-on-the-wind', completionTimeSecondsLt: 30 },
  },
  {
    code: 'delivery_10_sessions',
    title: 'Courier in Training',
    description: 'Complete 10 Delivery on the Wind runs.',
    icon: '🗺️', rarity: 'common', category: 'delivery',
    criteria: { gameSlug: 'delivery-on-the-wind', sessionCountGte: 10 },
  },
  {
    code: 'delivery_50_sessions',
    title: 'Village Lifeline',
    description: 'Make 50 successful deliveries through the wind.',
    icon: '🏅', rarity: 'rare', category: 'delivery',
    criteria: { gameSlug: 'delivery-on-the-wind', sessionCountGte: 50 },
  },
  {
    code: 'delivery_map_village',
    title: 'Village Runner',
    description: 'Complete a delivery run on the Village map.',
    icon: '🏘️', rarity: 'common', category: 'delivery',
    future: true,
    criteria: { gameSlug: 'delivery-on-the-wind', mapId: 'village' },
  },
  {
    code: 'delivery_map_forest',
    title: 'Forest Courier',
    description: 'Navigate the winding Forest delivery route.',
    icon: '🌲', rarity: 'common', category: 'delivery',
    future: true,
    criteria: { gameSlug: 'delivery-on-the-wind', mapId: 'forest' },
  },
  {
    code: 'delivery_map_cliffs',
    title: 'Cliffside Daredevil',
    description: 'Conquer the treacherous Cliffs delivery route.',
    icon: '⛰️', rarity: 'rare', category: 'delivery',
    future: true,
    criteria: { gameSlug: 'delivery-on-the-wind', mapId: 'cliffs' },
  },
  {
    code: 'delivery_all_maps',
    title: 'Route Master',
    description: 'Complete a delivery on every available map.',
    icon: '🧭', rarity: 'epic', category: 'delivery',
    future: true,
    criteria: { gameSlug: 'delivery-on-the-wind', allMapsCleared: true },
  },

  // ── Spirit Drift ────────────────────────────────────────────────────────────
  {
    code: 'drift_score_200',
    title: 'Windcatcher Adept',
    description: 'Score more than 200 points in Spirit Drift.',
    icon: '🌊', rarity: 'common', category: 'drift',
    criteria: { gameSlug: 'spirit-drift', scoreGt: 200 },
  },
  {
    code: 'drift_score_500',
    title: 'Gale Rider',
    description: 'Score more than 500 points in a single Spirit Drift run.',
    icon: '🌀', rarity: 'rare', category: 'drift',
    criteria: { gameSlug: 'spirit-drift', scoreGt: 500 },
  },
  {
    code: 'drift_score_1000',
    title: 'Tempest Soul',
    description: 'Reach 1000 points in Spirit Drift — the wind is yours.',
    icon: '🌪️', rarity: 'epic', category: 'drift',
    criteria: { gameSlug: 'spirit-drift', scoreGt: 1000 },
  },
  {
    code: 'drift_10_sessions',
    title: 'Drift Devotee',
    description: 'Play Spirit Drift across 10 sessions.',
    icon: '🍃', rarity: 'common', category: 'drift',
    criteria: { gameSlug: 'spirit-drift', sessionCountGte: 10 },
  },
  {
    code: 'drift_50_sessions',
    title: 'Spirit of the Current',
    description: 'Drift through 50 Spirit Drift sessions.',
    icon: '🌬️', rarity: 'rare', category: 'drift',
    criteria: { gameSlug: 'spirit-drift', sessionCountGte: 50 },
  },
  {
    code: 'drift_atmosphere_dawn',
    title: 'First Light Wanderer',
    description: 'Play a Spirit Drift session in the Dawn atmosphere.',
    icon: '🌅', rarity: 'rare', category: 'drift',
    future: true,
    criteria: { gameSlug: 'spirit-drift', atmosphereId: 'dawn' },
  },
  {
    code: 'drift_atmosphere_storm',
    title: 'Storm Chaser',
    description: 'Brave the tempest and drift through the Storm atmosphere.',
    icon: '⛈️', rarity: 'rare', category: 'drift',
    future: true,
    criteria: { gameSlug: 'spirit-drift', atmosphereId: 'storm' },
  },
  {
    code: 'drift_atmosphere_night',
    title: 'Night Drifter',
    description: 'Drift through the grove under starlight.',
    icon: '🌠', rarity: 'rare', category: 'drift',
    future: true,
    criteria: { gameSlug: 'spirit-drift', atmosphereId: 'night' },
  },
  {
    code: 'drift_all_atmospheres',
    title: 'Atmosphere Seeker',
    description: 'Experience every atmosphere Spirit Drift has to offer.',
    icon: '🎴', rarity: 'epic', category: 'drift',
    future: true,
    criteria: { gameSlug: 'spirit-drift', allAtmospheresCleared: true },
  },

  // ── Rise of the Half Moon ───────────────────────────────────────────────────
  {
    code: 'half_moon_score_50',
    title: 'Moonlit Strategist',
    description: 'Score at least 50 total points in Rise of the Half Moon.',
    icon: '🌙', rarity: 'common', category: 'halfmoon',
    criteria: { gameSlug: 'half-moon', scoreGte: 50 },
  },
  {
    code: 'half_moon_score_100',
    title: 'Crescent Sage',
    description: 'Score 100 or more points in Rise of the Half Moon.',
    icon: '🌛', rarity: 'rare', category: 'halfmoon',
    criteria: { gameSlug: 'half-moon', scoreGte: 100 },
  },
  {
    code: 'half_moon_score_200',
    title: 'Full Moon Sovereign',
    description: 'Reach 200 points in Rise of the Half Moon.',
    icon: '🌕', rarity: 'epic', category: 'halfmoon',
    criteria: { gameSlug: 'half-moon', scoreGte: 200 },
  },
  {
    code: 'half_moon_10_sessions',
    title: 'Moon Apprentice',
    description: 'Play 10 sessions of Rise of the Half Moon.',
    icon: '🎴', rarity: 'common', category: 'halfmoon',
    criteria: { gameSlug: 'half-moon', sessionCountGte: 10 },
  },
  {
    code: 'half_moon_wins_5',
    title: 'Rising Crescent',
    description: 'Win 5 games of Rise of the Half Moon.',
    icon: '👑', rarity: 'rare', category: 'halfmoon',
    criteria: { gameSlug: 'half-moon', winsGte: 5 },
  },
  {
    code: 'half_moon_special_card',
    title: 'Card of Power',
    description: 'Play one of the Half Moon\'s special cards.',
    icon: '✴️', rarity: 'rare', category: 'halfmoon',
    future: true,
    criteria: { gameSlug: 'half-moon', specialCardPlayed: 1 },
  },
  {
    code: 'half_moon_all_specials',
    title: 'Master Architect',
    description: 'Use every type of special card in Rise of the Half Moon.',
    icon: '🃏', rarity: 'legendary', category: 'halfmoon',
    future: true,
    criteria: { gameSlug: 'half-moon', allSpecialCardsUsed: true },
  },

  // ── Grove-wide ──────────────────────────────────────────────────────────────
  {
    code: 'grove_first_session',
    title: 'First Steps into the Grove',
    description: 'Play your very first game in Whisperwind Grove.',
    icon: '🏕️', rarity: 'common', category: 'grove',
    criteria: { totalSessionsGte: 1 },
  },
  {
    code: 'grove_10_sessions',
    title: 'Grove Apprentice',
    description: 'Play 10 total sessions across all grove games.',
    icon: '🌿', rarity: 'common', category: 'grove',
    criteria: { totalSessionsGte: 10 },
  },
  {
    code: 'grove_50_sessions',
    title: 'Grove Keeper',
    description: 'Reach 50 total sessions — you truly belong here.',
    icon: '🍀', rarity: 'rare', category: 'grove',
    criteria: { totalSessionsGte: 50 },
  },
  {
    code: 'grove_100_sessions',
    title: 'Grove Elder',
    description: 'Accumulate 100 total sessions — a true spirit of the grove.',
    icon: '🌲', rarity: 'epic', category: 'grove',
    criteria: { totalSessionsGte: 100 },
  },
  {
    code: 'grove_all_games',
    title: 'Wandering Spirit',
    description: 'Play at least one session in all four grove games.',
    icon: '🗺️', rarity: 'rare', category: 'grove',
    criteria: { allGamesPlayed: true },
  },
  {
    code: 'grove_3_in_day',
    title: 'Spirited Day',
    description: 'Play 3 different grove games in a single day.',
    icon: '🌞', rarity: 'rare', category: 'grove',
    criteria: { differentGamesInDay: 3 },
  },

  // ── Secret / Easter Eggs ────────────────────────────────────────────────────
  {
    code: 'easter_midnight',
    title: 'Midnight Wanderer',
    description: 'Play a game between midnight and 4am — even the grove sleeps.',
    icon: '🌌', rarity: 'legendary', category: 'secret',
    secret: true,
    hint: 'The grove takes on a different character in the small hours...',
    criteria: { sessionHourRange: [0, 4] },
  },
  {
    code: 'easter_early_bird',
    title: 'Dawn Spirit',
    description: 'Play before the sun has fully risen.',
    icon: '🌄', rarity: 'legendary', category: 'secret',
    secret: true,
    hint: 'Some spirits only emerge at first light...',
    criteria: { sessionHourRange: [4, 6] },
  },
  {
    code: 'easter_5_in_day',
    title: 'Lost in the Grove',
    description: 'Play 5 sessions in a single day — you\'re truly absorbed.',
    icon: '🔥', rarity: 'epic', category: 'secret',
    secret: true,
    hint: 'A spirit fully absorbed knows no time...',
    criteria: { sessionsInDay: 5 },
  },
]
