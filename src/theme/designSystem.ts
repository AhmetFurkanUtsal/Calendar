export const Colors = {
  primary: {
    50: '#F0F9FF',
    100: '#E0F2FE',
    500: '#0EA5E9', // Ana Sky Blue
    600: '#0284C7',
    900: '#0C4A6E',
  },
  neutral: {
    50: '#FAFAFA', // Light background
    100: '#F5F5F5', // Card background
    200: '#E5E5E5', // Border
    400: '#A3A3A3', // Placeholder
    600: '#525252', // Secondary text
    700: '#374151', // Darker text
    800: '#262626', // Primary text
    900: '#171717', // Headers
  },
  semantic: {
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',
  },
  // Lifestyle Categories (ÖZEL İSTEK)
  lifestyle: {
    dini: '#8B5CF6', // Purple 🕌
    hayvanseverlik: '#F59E0B', // Orange 🐾
    cevre: '#10B981', // Green 🌱
    saglik: '#EF4444', // Red ❤️
    kariyer: '#3B82F6', // Blue 💼
    kisisel: '#6B7280', // Gray 👤
  },
};

export const Typography = {
  h1: {fontSize: 32, fontWeight: '700' as const, lineHeight: 40},
  h2: {fontSize: 24, fontWeight: '600' as const, lineHeight: 32},
  h3: {fontSize: 20, fontWeight: '600' as const, lineHeight: 28},
  body: {fontSize: 16, fontWeight: '400' as const, lineHeight: 24},
  caption: {fontSize: 14, fontWeight: '400' as const, lineHeight: 20},
  small: {fontSize: 12, fontWeight: '400' as const, lineHeight: 16},
};

// 8px Grid Spacing System (ÖZEL İSTEK)
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const BorderRadius = {
  sm: 4,
  md: 8, // Standard 8px (ÖZEL İSTEK)
  lg: 12,
  xl: 16,
  full: 999,
};

// Subtle Shadows (Minimalist)
export const Shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
};

export const DesignSystem = {
  Colors,
  Typography,
  Spacing,
  BorderRadius,
  Shadows,
};
