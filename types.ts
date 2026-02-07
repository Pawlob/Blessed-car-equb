import React from 'react';

export type Language = 'en' | 'am';
export type ViewState = 'landing' | 'login' | 'dashboard';

export interface User {
  name: string;
  phone: string;
  status: 'PENDING' | 'VERIFIED';
  contribution: number;
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