import React from 'react';

export type Language = 'en' | 'am';
export type ViewState = 'landing' | 'login' | 'dashboard' | 'admin' | 'prizes' | 'terms';

export interface Winner {
  id: number | string;
  name: string;
  nameAm: string;
  prize: string;
  prizeAm: string;
  cycle: string;
  cycleAm: string;
  location: string;
  locationAm: string;
}

export interface AppNotification {
  id: number | string;
  title: { en: string; am: string };
  desc: { en: string; am: string };
  time: Date;
  urgent: boolean;
  read: boolean;
}

export interface AppSettings {
  nextDrawDateEn: string;
  nextDrawDateAm: string;
  potValue: number;
  totalMembers: number;
  cycle: number;
  daysRemaining: number;
  drawDate: string;
  carsDelivered: number;
  trustScore: number;
  prizeName: string;
  prizeValue: string;
  prizeImage: string;
  prizeImages?: string[]; // Added support for multiple images
  recentWinners: Winner[];
  liveStreamUrl: string;
  isLive: boolean;
  registrationEnabled: boolean;
  adminPassword?: string;
}

export interface User {
  id?: number | string;
  name: string;
  phone: string;
  status: 'PENDING' | 'VERIFIED';
  contribution: number;
  prizeNumber?: number;
  joinedDate?: string;
}

export interface NavProps {
  view: ViewState;
  setView: (view: ViewState) => void;
  language: Language;
  setLanguage: React.Dispatch<React.SetStateAction<Language>>;
  user: User | null;
  logout: () => void;
}

export interface FeedItem {
  id: number;
  name: string;
  action: string;
  time: string;
}