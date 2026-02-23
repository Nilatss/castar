/**
 * Shared scaling utilities used across all screens.
 * Figma frame = 393px — this maps Figma units to device pixels.
 */
import { Dimensions } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const FIGMA_WIDTH = 393;
export const scale = (v: number) => (v / FIGMA_WIDTH) * SCREEN_WIDTH;

// Glow render sizes (3x of Figma circle size to simulate blur spread)
export const GLOW_RENDER_SIZE = 1050; // 350 * 3
export const GLOW2_RENDER_SIZE = 477; // 159 * 3
