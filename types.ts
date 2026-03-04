
export interface VibeUser {
  id: string;
  name: string;
  vibe: string;
  avatar_url?: string;
  lat: number;
  lng: number;
  distance_meters?: number;
  discoverable?: boolean;
  profile_privacy?: 'everyone' | 'private';
  story_privacy?: 'everyone' | 'private';
  chat_privacy?: 'everyone' | 'private';
  updated_at?: string;
}

export interface Story {
  id: string;
  user_id: string;
  name: string;
  vibe?: string;
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

export interface MapEvent {
  id: string;
  title: string;
  description: string;
  lat: number;
  lng: number;
  start_time: string;
  end_time: string;
  type: 'music' | 'food' | 'art' | 'party' | 'other';
  image_url?: string;
  distance_meters?: number;
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
