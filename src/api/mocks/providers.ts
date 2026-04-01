import { Provider, ProviderTag } from '@/types/provider';

const makeIsoSlot = (daysFromNow: number, hours: number): string => {
  const baseDate = new Date();
  baseDate.setDate(baseDate.getDate() + daysFromNow);
  baseDate.setHours(hours, 0, 0, 0);
  return baseDate.toISOString();
};

export const PROVIDER_TAGS: ProviderTag[] = ['hair', 'makeup', 'nails', 'skincare', 'barber'];

export const MOCK_PROVIDERS: Provider[] = [
  {
    id: 'pro_1',
    name: 'Sarah Glam Studio',
    city: 'Paris 11e',
    bio: 'Experte coiffure événementielle et glam look.',
    coverImageUrl: 'https://picsum.photos/seed/upperglam-sarah-cover/1280/860',
    avatarImageUrl: 'https://picsum.photos/seed/upperglam-sarah-avatar/200/200',
    rating: 4.9,
    reviewCount: 187,
    priceFrom: 65,
    currency: 'EUR',
    serviceModes: ['home', 'institute'],
    instituteAddress: '48 rue Oberkampf, 75011 Paris',
    tags: ['hair', 'makeup'],
    nextSlots: [
      makeIsoSlot(0, 18),
      makeIsoSlot(0, 20),
      makeIsoSlot(1, 10),
      makeIsoSlot(1, 14),
      makeIsoSlot(2, 11),
      makeIsoSlot(2, 16),
    ],
    gallery: [
      {
        id: 'pro1-gallery-1',
        imageUrl: 'https://picsum.photos/seed/upperglam-sarah-gallery-1/900/1200',
        title: 'Brushing soirée',
      },
      {
        id: 'pro1-gallery-2',
        imageUrl: 'https://picsum.photos/seed/upperglam-sarah-gallery-2/900/1200',
        title: 'Chignon mariage',
      },
      {
        id: 'pro1-gallery-3',
        imageUrl: 'https://picsum.photos/seed/upperglam-sarah-gallery-3/900/1200',
        title: 'Nude glow',
      },
    ],
  },
  {
    id: 'pro_2',
    name: 'Nour Beauty House',
    city: 'Paris 15e',
    bio: 'Maquillage, skincare et préparation shooting.',
    coverImageUrl: 'https://picsum.photos/seed/upperglam-nour-cover/1280/860',
    avatarImageUrl: 'https://picsum.photos/seed/upperglam-nour-avatar/200/200',
    rating: 4.8,
    reviewCount: 142,
    priceFrom: 70,
    currency: 'EUR',
    serviceModes: ['institute'],
    instituteAddress: '22 rue de Vaugirard, 75015 Paris',
    tags: ['makeup', 'skincare'],
    nextSlots: [
      makeIsoSlot(0, 19),
      makeIsoSlot(1, 12),
      makeIsoSlot(1, 18),
      makeIsoSlot(2, 9),
      makeIsoSlot(3, 13),
      makeIsoSlot(3, 17),
    ],
    gallery: [
      {
        id: 'pro2-gallery-1',
        imageUrl: 'https://picsum.photos/seed/upperglam-nour-gallery-1/900/1200',
        title: 'Full glam',
      },
      {
        id: 'pro2-gallery-2',
        imageUrl: 'https://picsum.photos/seed/upperglam-nour-gallery-2/900/1200',
        title: 'Skin prep mariée',
      },
      {
        id: 'pro2-gallery-3',
        imageUrl: 'https://picsum.photos/seed/upperglam-nour-gallery-3/900/1200',
        title: 'Soft matte',
      },
    ],
  },
  {
    id: 'pro_3',
    name: 'Barber Luxe Mobile',
    city: 'Boulogne',
    bio: 'Service barber premium à domicile.',
    coverImageUrl: 'https://picsum.photos/seed/upperglam-barber-cover/1280/860',
    avatarImageUrl: 'https://picsum.photos/seed/upperglam-barber-avatar/200/200',
    rating: 4.7,
    reviewCount: 91,
    priceFrom: 40,
    currency: 'EUR',
    serviceModes: ['home'],
    tags: ['barber', 'hair'],
    nextSlots: [
      makeIsoSlot(0, 17),
      makeIsoSlot(1, 8),
      makeIsoSlot(1, 19),
      makeIsoSlot(2, 11),
      makeIsoSlot(2, 18),
      makeIsoSlot(3, 10),
    ],
    gallery: [
      {
        id: 'pro3-gallery-1',
        imageUrl: 'https://picsum.photos/seed/upperglam-barber-gallery-1/900/1200',
        title: 'Fade clean',
      },
      {
        id: 'pro3-gallery-2',
        imageUrl: 'https://picsum.photos/seed/upperglam-barber-gallery-2/900/1200',
        title: 'Contour précis',
      },
      {
        id: 'pro3-gallery-3',
        imageUrl: 'https://picsum.photos/seed/upperglam-barber-gallery-3/900/1200',
        title: 'Rasage premium',
      },
    ],
  },
  {
    id: 'pro_4',
    name: 'Nails & Glow by Lina',
    city: 'Paris 3e',
    bio: 'Nail art et beauté des mains en express.',
    coverImageUrl: 'https://picsum.photos/seed/upperglam-nails-cover/1280/860',
    avatarImageUrl: 'https://picsum.photos/seed/upperglam-nails-avatar/200/200',
    rating: 4.9,
    reviewCount: 230,
    priceFrom: 55,
    currency: 'EUR',
    serviceModes: ['home', 'institute'],
    instituteAddress: '9 rue de Turenne, 75003 Paris',
    tags: ['nails'],
    nextSlots: [
      makeIsoSlot(0, 17),
      makeIsoSlot(0, 19),
      makeIsoSlot(1, 11),
      makeIsoSlot(2, 14),
      makeIsoSlot(3, 16),
      makeIsoSlot(4, 10),
    ],
    gallery: [
      {
        id: 'pro4-gallery-1',
        imageUrl: 'https://picsum.photos/seed/upperglam-nails-gallery-1/900/1200',
        title: 'French moderne',
      },
      {
        id: 'pro4-gallery-2',
        imageUrl: 'https://picsum.photos/seed/upperglam-nails-gallery-2/900/1200',
        title: 'Nail art gold',
      },
      {
        id: 'pro4-gallery-3',
        imageUrl: 'https://picsum.photos/seed/upperglam-nails-gallery-3/900/1200',
        title: 'Semi premium',
      },
    ],
  },
  {
    id: 'pro_5',
    name: 'Atelier Skin Reset',
    city: 'Neuilly',
    bio: 'Rituels skincare express avant événement.',
    coverImageUrl: 'https://picsum.photos/seed/upperglam-skin-cover/1280/860',
    avatarImageUrl: 'https://picsum.photos/seed/upperglam-skin-avatar/200/200',
    rating: 4.6,
    reviewCount: 58,
    priceFrom: 75,
    currency: 'EUR',
    serviceModes: ['institute'],
    instituteAddress: '11 avenue Charles-de-Gaulle, 92200 Neuilly',
    tags: ['skincare'],
    nextSlots: [
      makeIsoSlot(1, 16),
      makeIsoSlot(2, 10),
      makeIsoSlot(2, 15),
      makeIsoSlot(3, 9),
      makeIsoSlot(4, 9),
      makeIsoSlot(4, 14),
    ],
    gallery: [
      {
        id: 'pro5-gallery-1',
        imageUrl: 'https://picsum.photos/seed/upperglam-skin-gallery-1/900/1200',
        title: 'Hydra boost',
      },
      {
        id: 'pro5-gallery-2',
        imageUrl: 'https://picsum.photos/seed/upperglam-skin-gallery-2/900/1200',
        title: 'Glow prep',
      },
      {
        id: 'pro5-gallery-3',
        imageUrl: 'https://picsum.photos/seed/upperglam-skin-gallery-3/900/1200',
        title: 'Nettoyage expert',
      },
    ],
  },
];
