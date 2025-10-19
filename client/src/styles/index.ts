// NOTE for Cursor: SMTP tested manually with ChatGPT, working fine.
// Focus on ensuring /auth/forgot route uses the same transporter and proper env variables.

/**
 * Centralized Styles Export
 * Import all styles from a single location
 */

export { colors } from "./colors";
export { buttonStyles, getButtonHoverEffect, getButtonActiveEffect } from "./buttons";
export type { ButtonStyles } from "./buttons";
export type { Colors } from "./colors";

// Common utility styles
export const shadows = {
  sm: "0 2px 8px rgba(0, 0, 0, 0.05)",
  md: "0 4px 15px rgba(0, 0, 0, 0.1)",
  lg: "0 8px 24px rgba(0, 0, 0, 0.15)",
  xl: "0 20px 60px rgba(0, 0, 0, 0.2)",
} as const;

export const borderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 40,
} as const;

export const fontSize = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 18,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

export const fontWeight = {
  normal: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
  extrabold: 800,
} as const;

