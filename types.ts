
export interface VibeUser {
  id: string;
  name: string;
  vibe: string;
  lat: number;
  lng: number;
  distance: string;
  verified: boolean;
  avatar: string;
  score?: number;
  matched?: boolean;
  story?: boolean;
}

export interface Promo {
  id: string;
  title: string;
  description: string;
  discount: string;
  lat: number;
  lng: number;
  active: boolean;
}

export enum TabType {
  SWIPE = 'SWIPE',
  MAP = 'MAP',
  ROULETTE = 'ROULETTE',
  STORIES = 'STORIES',
  PROMOS = 'PROMOS',
  PROFILE = 'PROFILE',
  CHAT = 'CHAT',
  TRENDING = 'TRENDING'
}
