export type GameInfo = {
  id: string;
  title: string;
  description: string;
  thumbnail?: string; // optional URL or local path for card thumbnail
  gameBg?: string; // optional URL or local path for card background image
  postSelectionBg?: string; // optional URL for selected game background
  postSelectionPanelBg?: string; // optional URL for score-board/plant-seed panel image
  available?: boolean;
};

export const games: GameInfo[] = [
  {
    id: 'spirit-drift',
    title: 'Spirit Drift',
    description:
      'Catch drifting spirits across changing elemental worlds and follow their gentle flow.',
    thumbnail: '/assets/thumbnails/spirit-drift-placeholder.svg',
    gameBg: '/assets/game_bgs/spirit-drift.png',
    postSelectionBg: '/assets/backgrounds/spirit-drift/game-bg.png',
    postSelectionPanelBg: '/assets/backgrounds/spirit-drift/score-board.png',
    available: true,
  },
  {
    id: 'delivery-on-the-wind',
    title: 'Delivery on the Wind',
    description:
      'Prepare cozy orders and fly across the sky to deliver them with care.',
    thumbnail: '/assets/thumbnails/delivery-placeholder.svg',
    gameBg: '/assets/game_bgs/delivery-on-the-wind.png',
    postSelectionBg: '/assets/backgrounds/delivery-on-the-wind/game-bg.png',
    postSelectionPanelBg: '/assets/backgrounds/delivery-on-the-wind/score-board.png',
    available: true,
  },
  {
    id: 'spirit-sapling',
    title: 'Spirit Sapling',
    description:
      'Nurture a small sapling with balance and patience until it grows strong and alive.',
    thumbnail: '/assets/thumbnails/sapling-placeholder.svg',
    gameBg: '/assets/game_bgs/spirit-sapling.png',
    postSelectionBg: '/assets/backgrounds/spirit-sapling/game-bg.png',
    postSelectionPanelBg: '/assets/backgrounds/spirit-sapling/plant-seed.png',
    available: true,
  },
  {
    id: 'half-moon',
    title: 'Rise of the Half Moon',
    description:
      'Place lunar phase cards on an enchanted board, form cycles, and outwit the mysterious Half Moon.',
    thumbnail: '/assets/game_bgs/rise-of-the-half-moon.png',
    gameBg:    '/assets/game_bgs/rise-of-the-half-moon.png',
    postSelectionBg: '/assets/backgrounds/rise-of-the-half-moon/Rise of the Half Moon background.png',
    available: true,
  },
];

export default games;
