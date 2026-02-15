
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
  targetUserId?: string | number; // Optional: If present, only this user sees it
}

export interface CurrentWinner {
  userId: string | number;
  userName: string;
  ticketNumber: number;
  prizeName: string;
  announcedAt: string;
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
  prizeImages?: string[]; 
  recentWinners: Winner[];
  currentWinner?: CurrentWinner | null; // New field for live winner announcement
  winnerAnnouncementMode: boolean; // Toggle to replace prize card with winner card
  liveStreamUrl: string;
  isLive: boolean;
  registrationEnabled: boolean;
  adminPassword?: string;
  ticketSelectionEnabled: boolean; // New field to control ticket grid interactivity
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
