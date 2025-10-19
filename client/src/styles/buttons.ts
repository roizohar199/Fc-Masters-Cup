/**
 * Centralized Button Styles
 * Reusable button styles across the application
 */

import { CSSProperties } from "react";
import { colors } from "./colors";

export const buttonBase: CSSProperties = {
  padding: "14px 24px",
  borderRadius: 12,
  border: "none",
  fontSize: 15,
  fontWeight: 700,
  cursor: "pointer",
  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  whiteSpace: "nowrap",
};

export const buttonStyles = {
  // Primary button
  primary: {
    ...buttonBase,
    background: colors.primary.gradient,
    color: colors.neutral.white,
    boxShadow: "0 4px 20px rgba(102, 126, 234, 0.4)",
  },

  // Secondary button
  secondary: {
    ...buttonBase,
    background: colors.secondary.gradient,
    color: colors.neutral.white,
    boxShadow: "0 4px 20px rgba(245, 87, 108, 0.4)",
  },

  // Success button
  success: {
    ...buttonBase,
    background: colors.success.gradient,
    color: colors.neutral.white,
    boxShadow: "0 4px 15px rgba(67, 233, 123, 0.4)",
  },

  // Warning button
  warning: {
    ...buttonBase,
    background: colors.warning.gradient,
    color: colors.neutral.white,
    boxShadow: "0 4px 15px rgba(255, 152, 0, 0.4)",
  },

  // Error/Danger button
  danger: {
    ...buttonBase,
    background: colors.error.gradient,
    color: colors.neutral.white,
    boxShadow: "0 4px 15px rgba(244, 67, 54, 0.4)",
  },

  // Info button
  info: {
    ...buttonBase,
    background: colors.info.gradient,
    color: colors.neutral.white,
    boxShadow: "0 4px 15px rgba(79, 172, 254, 0.4)",
  },

  // Outline button
  outline: {
    ...buttonBase,
    background: colors.neutral.white,
    color: colors.primary.main,
    border: `2px solid ${colors.primary.main}`,
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)",
  },

  // Ghost button
  ghost: {
    ...buttonBase,
    background: "rgba(255, 255, 255, 0.9)",
    color: colors.text.primary,
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)",
  },

  // Disabled button
  disabled: {
    ...buttonBase,
    background: colors.neutral.gray300,
    color: colors.neutral.gray500,
    cursor: "not-allowed",
    opacity: 0.6,
    boxShadow: "none",
  },

  // Small button
  small: {
    ...buttonBase,
    padding: "8px 16px",
    fontSize: 13,
    borderRadius: 8,
  },

  // Large button
  large: {
    ...buttonBase,
    padding: "16px 32px",
    fontSize: 17,
    borderRadius: 14,
  },

  // Icon button
  icon: {
    ...buttonBase,
    padding: "12px",
    borderRadius: 10,
    minWidth: 44,
    minHeight: 44,
    justifyContent: "center",
  },
} as const;

/**
 * Get hover styles for a button
 */
export const getButtonHoverEffect = () => ({
  transform: "translateY(-2px)",
  filter: "brightness(1.05)",
});

/**
 * Get active/pressed styles for a button
 */
export const getButtonActiveEffect = () => ({
  transform: "translateY(0)",
  filter: "brightness(0.95)",
});

export type ButtonStyles = typeof buttonStyles;

