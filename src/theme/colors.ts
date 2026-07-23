export const colors = {
  day: {
    backgroundStart: '#E0F7FA', // Sky Cyan
    backgroundEnd: '#FFB47B',   // Warm Yellow
    primary: '#FF7E5F',         // Sunrise Orange
    secondary: '#FEB47B',       // Gold
    accent: '#FF4E50',          // Soft Pink/Red
    cardBackground: 'rgba(255, 255, 255, 0.12)',
    cardBorder: 'rgba(255, 255, 255, 0.25)',
    textPrimary: '#1E293B',     // Slate Dark
    textSecondary: '#64748B',   // Slate Muted
    buttonText: '#FFFFFF',
    streakFlame: '#FF7E5F',
  },
  night: {
    backgroundStart: '#110B29', // Deep Twilight
    backgroundEnd: '#0F2027',   // Slate Navy
    primary: '#2C3E50',         // Twilight Purple
    secondary: '#0F2027',       // Midnight
    accent: '#F39C12',          // Neon Amber
    cardBackground: 'rgba(15, 20, 30, 0.65)',
    cardBorder: 'rgba(255, 255, 255, 0.08)',
    textPrimary: '#F8F9FA',     // Near White
    textSecondary: '#B0B5C0',   // Muted Silver
    buttonText: '#110B29',
    streakFlame: '#F39C12',
  }
};
export type ThemeColors = typeof colors.day;
