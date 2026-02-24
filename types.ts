
export interface VibeUser {
  id: string;
  name: string;
  vibe: string;
  avatar_url?: string;
  lat: number;
  lng: number;
  distance_meters?: number;
  discoverable?: boolean;
  updated_at?: string;
}

export interface Story {
  id: string;
  user_id: string;
  name: string;
  image_url: string;
  caption?: string;
  lat: number;
  lng: number;
  distance_meters?: number;
  created_at: string;
  expires_at: string;
}

export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
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
