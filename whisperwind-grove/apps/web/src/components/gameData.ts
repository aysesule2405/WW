export type GameInfo = {
  id: string;
  title: string;
  description: string;
  thumbnail?: string; // optional URL or local path for card thumbnail
  available?: boolean;
};

export const games: GameInfo[] = [
  {
    id: 'spirit-drift',
    title: 'Spirit Drift',
    description:
      'Catch drifting spirits across changing elemental worlds and follow their gentle flow.',
  thumbnail: '/assets/thumbnails/spirit-drift-placeholder.png',
    available: true,
  },
  {
    id: 'delivery-on-the-wind',
    title: 'Delivery on the Wind',
    description:
      'Prepare cozy orders and fly across the sky to deliver them with care.',
  thumbnail: '/assets/thumbnails/delivery-placeholder.png',
    available: false,
  },
  {
    id: 'spirit-sapling',
    title: 'Spirit Sapling',
    description:
      'Nurture a small sapling with balance and patience until it grows strong and alive.',
  thumbnail: '/assets/thumbnails/sapling-placeholder.png',
    available: false,
  },
];

export default games;
