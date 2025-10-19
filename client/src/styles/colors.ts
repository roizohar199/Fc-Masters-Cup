/**
 * Centralized Color System
 * All colors used across the application
 */

export const colors = {
  // Primary colors
  primary: {
    main: "#667eea",
    light: "#8b9ef5",
    dark: "#4f60c7",
    gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  },

  // Secondary colors
  secondary: {
    main: "#f093fb",
    light: "#f5b4ff",
    dark: "#c764d8",
    gradient: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
  },

  // Success
  success: {
    main: "#4caf50",
    light: "#81c784",
    dark: "#388e3c",
    gradient: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
  },

  // Warning
  warning: {
    main: "#ff9800",
    light: "#ffb74d",
    dark: "#f57c00",
    gradient: "linear-gradient(135deg, #ff9800 0%, #f57c00 100%)",
  },

  // Error
  error: {
    main: "#f44336",
    light: "#e57373",
    dark: "#d32f2f",
    gradient: "linear-gradient(135deg, #f44336 0%, #d32f2f 100%)",
  },

  // Info
  info: {
    main: "#2196F3",
    light: "#64b5f6",
    dark: "#1976D2",
    gradient: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
  },

  // Neutral colors
  neutral: {
    white: "#ffffff",
    black: "#000000",
    gray50: "#fafafa",
    gray100: "#f5f5f5",
    gray200: "#eeeeee",
    gray300: "#e0e0e0",
    gray400: "#bdbdbd",
    gray500: "#9e9e9e",
    gray600: "#757575",
    gray700: "#616161",
    gray800: "#424242",
    gray900: "#212121",
  },

  // Semantic colors
  text: {
    primary: "#333333",
    secondary: "#666666",
    disabled: "#999999",
    hint: "#cccccc",
  },

  // Background colors
  background: {
    default: "#fafafa",
    paper: "#ffffff",
    gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    gradientLight: "linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)",
  },

  // Tournament stages
  stages: {
    r16: {
      bg: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      border: "#667eea",
      light: "#667eea20",
    },
    qf: {
      bg: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
      border: "#f093fb",
      light: "#f093fb20",
    },
    sf: {
      bg: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
      border: "#4facfe",
      light: "#4facfe20",
    },
    final: {
      bg: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
      border: "#43e97b",
      light: "#43e97b20",
    },
  },

  // Status colors
  status: {
    online: "#4caf50",
    offline: "#9e9e9e",
    connected: "#2196F3",
    blocked: "#f44336",
    pending: "#ff9800",
    approved: "#4caf50",
    rejected: "#f44336",
  },
} as const;

export type Colors = typeof colors;

