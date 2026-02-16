/**
 * CaStar Design System — Colors
 * Source: Figma UI Kit
 */

export const colors = {
  // === Neutral Colors ===
  neutral: {
    950: '#101010',
    900: '#1A1A1A',
    850: '#1E1E1E',
    800: '#262626',
    700: '#333333',
    600: '#4D4D4D',
    500: '#808080',
    400: '#B3B3B3',
    350: '#C2C2C2',
    300: '#D4D4D4',
    250: '#DBDBDB',
    200: '#E5E5E5',
    150: '#EDEDED',
    100: '#F2F2F2',
    50: '#F6F6F6',
  },

  // === White with opacity ===
  white: {
    100: '#FFFFFF',       // 100%
    70: 'rgba(255, 255, 255, 0.7)',  // 70%
    50: 'rgba(255, 255, 255, 0.5)',  // 50%
    40: 'rgba(255, 255, 255, 0.4)',  // 40%
    30: 'rgba(255, 255, 255, 0.3)',  // 30%
    20: 'rgba(255, 255, 255, 0.2)',  // 20%
  },

  // === Warning Colors ===
  warning: {
    950: '#332103',
    900: '#7A4F07',
    800: '#A3690A',
    700: '#CC830C',
    600: '#F09D0F',
    500: '#FAAD14',
    400: '#FBC44B',
    300: '#FCDB82',
    200: '#FDE8A8',
    100: '#FEF2CE',
    75: '#FFF9E8',
    50: '#FFFCF8',
  },

  // === Error Colors ===
  error: {
    900: '#B31B1B',
    800: '#CC1F1F',
    700: '#E52222',
    600: '#F03D3D',
    500: '#F55858',
    400: '#F87171',
    300: '#FCA5A5',
    200: '#FECACA',
    100: '#FEE2E2',
    75: '#FFF1F1',
    50: '#FFF8F8',
  },

  // === Information Colors ===
  information: {
    900: '#164AB3',
    800: '#1A56CC',
    700: '#1D62E5',
    600: '#3478F0',
    500: '#4B8DF5',
    400: '#71A3F8',
    300: '#A5C4FC',
    200: '#CADAFE',
    100: '#E2ECFE',
    75: '#F1F6FF',
    50: '#F8FAFF',
  },

  // === Success Colors ===
  success: {
    900: '#09AD4D',
    800: '#0FC95C',
    700: '#17E56C',
    600: '#3DF08A',
    500: '#58F59E',
    400: '#71F8AF',
    300: '#A5FCD0',
    200: '#CAFEE3',
    100: '#E2FEF0',
    75: '#F0FFF7',
    50: '#F7FDFA',
  },

  // === Semantic aliases ===
  background: '#101010',
  surface: '#1A1A1A',
  surfaceElevated: '#1E1E1E',
  text: '#FFFFFF',
  textSecondary: 'rgba(255, 255, 255, 0.7)',
  textTertiary: 'rgba(255, 255, 255, 0.5)',
  textDisabled: 'rgba(255, 255, 255, 0.3)',
  border: '#262626',
  borderLight: '#333333',
} as const;

export type ColorToken = typeof colors;
