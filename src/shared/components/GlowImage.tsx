/**
 * GPU-accelerated glow backgrounds.
 *
 * Pre-rendered 256×256 PNG radial gradients scaled via <Image> (GPU)
 * instead of SVG RadialGradient (CPU, ~1.1M pixel computation per glow).
 *
 * Two variants:
 * - Standard (glow.png): subtle white glow for backgrounds
 * - Vivid (glow-vivid.png): brighter glow for colored success/error states
 *
 * Use `tintColor` for non-white variants (green success, red error).
 */
import React from 'react';
import { Image } from 'react-native';
import { scale, GLOW_RENDER_SIZE, GLOW2_RENDER_SIZE } from '../constants/scaling';

// Pre-loaded at build time by Metro (PNG decode is GPU-accelerated)
const glowStd = require('../../assets/images/glow.png');
const glowVivid = require('../../assets/images/glow-vivid.png');

interface GlowProps {
  /** Glow color. Defaults to white (no tint). */
  color?: string;
  /** Use vivid (higher opacity) variant for colored glows. */
  vivid?: boolean;
  /** Legacy SVG gradient ID — ignored, kept for API compat. */
  id?: string;
}

/** Large background glow (1050 Figma px). GPU-scaled from 256px PNG. */
export const GlowCircle1 = React.memo(({ color, vivid = false }: GlowProps) => (
  <Image
    source={vivid ? glowVivid : glowStd}
    tintColor={color && color !== '#FFF' ? color : undefined}
    style={{
      width: scale(GLOW_RENDER_SIZE),
      height: scale(GLOW_RENDER_SIZE),
    }}
  />
));
GlowCircle1.displayName = 'GlowCircle1';

/** Small background glow (477 Figma px). GPU-scaled from 256px PNG. */
export const GlowCircle2 = React.memo(({ color, vivid = false }: GlowProps) => (
  <Image
    source={vivid ? glowVivid : glowStd}
    tintColor={color && color !== '#FFF' ? color : undefined}
    style={{
      width: scale(GLOW2_RENDER_SIZE),
      height: scale(GLOW2_RENDER_SIZE),
    }}
  />
));
GlowCircle2.displayName = 'GlowCircle2';
