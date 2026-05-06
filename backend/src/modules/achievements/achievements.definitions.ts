export type AchievementDefinition = {
  code: string
  title: string
  description: string
  iconUrl?: string
  criteria: Record<string, unknown>
}

export const ACHIEVEMENTS: AchievementDefinition[] = [
  {
    code: 'sapling_tree_deer',
    title: 'Peach Tree Unlocked',
    description: 'Grow a sacred Peach Tree with the Deer guardian.',
    criteria: { gameSlug: 'spirit-sapling', guardianId: 'deer' },
  },
  {
    code: 'sapling_tree_fox',
    title: 'Persimmon Tree Unlocked',
    description: 'Grow a sacred Persimmon Tree with the Fox guardian.',
    criteria: { gameSlug: 'spirit-sapling', guardianId: 'fox' },
  },
  {
    code: 'sapling_tree_kodama',
    title: 'Pear Tree Unlocked',
    description: 'Grow a sacred Pear Tree with the Kodama guardian.',
    criteria: { gameSlug: 'spirit-sapling', guardianId: 'kodama' },
  },
  {
    code: 'sapling_tree_mononoke',
    title: 'Apple Tree Unlocked',
    description: 'Grow a sacred Apple Tree with the Mononoke guardian.',
    criteria: { gameSlug: 'spirit-sapling', guardianId: 'mononoke' },
  },
  {
    code: 'sapling_all_trees',
    title: 'Grove Orchard Keeper',
    description: 'Unlock all four sacred Spirit Sapling trees.',
    criteria: { gameSlug: 'spirit-sapling', requiredTrees: 4 },
  },
  {
    code: 'delivery_under_60',
    title: 'One-Minute Courier',
    description: 'Finish Delivery on the Wind in under 60 seconds.',
    criteria: { gameSlug: 'delivery-on-the-wind', completionTimeSecondsLt: 60 },
  },
  {
    code: 'drift_score_200',
    title: 'Windcatcher Adept',
    description: 'Score more than 200 points in Spirit Drift.',
    criteria: { gameSlug: 'spirit-drift', scoreGt: 200 },
  },
  {
    code: 'half_moon_score_50',
    title: 'Moonlit Strategist',
    description: 'Score at least 50 total points in Rise of the Half Moon.',
    criteria: { gameSlug: 'half-moon', scoreGte: 50 },
  },
]
