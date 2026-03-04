import React, { createContext, useContext, useState } from 'react';

// ─── Color Token Types ────────────────────────────────────────────────────────

export interface ColorTokens {
  bg:         string;
  card:       string;
  border:     string;
  text:       string;
  muted:      string;
  blue:       string;
  green:      string;
  purple:     string;
  orange:     string;
  red:        string;
  radius:     string;
  sidebarBg:  string;
}

export type ThemeMode = 'light' | 'dark';

// ─── Theme Definitions ────────────────────────────────────────────────────────

const lightTokens: ColorTokens = {
  bg:        '#f8fafc',
  card:      '#ffffff',
  border:    '#e2e8f0',
  text:      '#0f172a',
  muted:     '#64748b',
  blue:      '#2563eb',
  green:     '#059669',
  purple:    '#7c3aed',
  orange:    '#d97706',
  red:       '#dc2626',
  radius:    '12px',
  sidebarBg: '#f1f5f9',
};

const darkTokens: ColorTokens = {
  bg:        '#0a0f1e',
  card:      '#1a2235',
  border:    '#1e2d45',
  text:      '#f1f5f9',
  muted:     '#94a3b8',
  blue:      '#3b82f6',
  green:     '#10b981',
  purple:    '#8b5cf6',
  orange:    '#f59e0b',
  red:       '#ef4444',
  radius:    '12px',
  sidebarBg: '#0d1526',
};

// ─── Context ──────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'theme-mode';

interface ThemeContextValue {
  mode:   ThemeMode;
  tokens: ColorTokens;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setMode] = useState<ThemeMode>(
    () => (localStorage.getItem(STORAGE_KEY) as ThemeMode | null) ?? 'light',
  );

  const toggle = () => {
    setMode(prev => {
      const next: ThemeMode = prev === 'light' ? 'dark' : 'light';
      localStorage.setItem(STORAGE_KEY, next);
      return next;
    });
  };

  return (
    <ThemeContext.Provider value={{ mode, tokens: mode === 'light' ? lightTokens : darkTokens, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
};

// ─── Hooks ────────────────────────────────────────────────────────────────────

export function useTheme(): ColorTokens {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider');
  return ctx.tokens;
}

export function useThemeToggle(): { mode: ThemeMode; toggle: () => void } {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useThemeToggle must be used inside ThemeProvider');
  return { mode: ctx.mode, toggle: ctx.toggle };
}
