/**
 * מערכת רספונסיביות גלובלית
 * Media Queries וגדלים מותאמים לכל המכשירים
 */

// Breakpoints
export const breakpoints = {
  mobile: '480px',
  tablet: '768px', 
  desktop: '1024px',
  large: '1200px'
};

// Media Query helpers
export const mediaQueries = {
  mobile: `@media (max-width: ${breakpoints.mobile})`,
  tablet: `@media (max-width: ${breakpoints.tablet})`,
  desktop: `@media (min-width: ${breakpoints.desktop})`,
  large: `@media (min-width: ${breakpoints.large})`
};

// Responsive font sizes
export const fontSizes = {
  mobile: {
    xs: '10px',
    sm: '12px', 
    base: '14px',
    lg: '16px',
    xl: '18px',
    '2xl': '20px',
    '3xl': '24px',
    '4xl': '28px'
  },
  tablet: {
    xs: '11px',
    sm: '13px',
    base: '15px', 
    lg: '17px',
    xl: '19px',
    '2xl': '22px',
    '3xl': '26px',
    '4xl': '32px'
  },
  desktop: {
    xs: '12px',
    sm: '14px',
    base: '16px',
    lg: '18px', 
    xl: '20px',
    '2xl': '24px',
    '3xl': '28px',
    '4xl': '36px'
  }
};

// Responsive spacing
export const spacing = {
  mobile: {
    xs: '4px',
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '20px',
    '2xl': '24px',
    '3xl': '32px'
  },
  tablet: {
    xs: '6px',
    sm: '10px', 
    md: '14px',
    lg: '18px',
    xl: '22px',
    '2xl': '26px',
    '3xl': '34px'
  },
  desktop: {
    xs: '8px',
    sm: '12px',
    md: '16px', 
    lg: '20px',
    xl: '24px',
    '2xl': '28px',
    '3xl': '36px'
  }
};

// Responsive grid helpers
export const gridResponsive = {
  mobile: {
    columns: '1fr',
    gap: '12px',
    padding: '16px'
  },
  tablet: {
    columns: 'repeat(2, 1fr)', 
    gap: '16px',
    padding: '20px'
  },
  desktop: {
    columns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '20px', 
    padding: '24px'
  }
};

// Responsive navigation
export const navResponsive = {
  mobile: {
    direction: 'column',
    gap: '8px',
    padding: '12px',
    fontSize: '14px'
  },
  tablet: {
    direction: 'row',
    gap: '12px', 
    padding: '14px',
    fontSize: '15px'
  },
  desktop: {
    direction: 'row',
    gap: '12px',
    padding: '14px',
    fontSize: '15px'
  }
};

// Responsive form styles
export const formResponsive = {
  mobile: {
    gridColumns: '1fr',
    inputPadding: '12px',
    fontSize: '14px',
    gap: '12px'
  },
  tablet: {
    gridColumns: 'repeat(2, 1fr)',
    inputPadding: '14px', 
    fontSize: '15px',
    gap: '16px'
  },
  desktop: {
    gridColumns: 'repeat(2, 1fr)',
    inputPadding: '14px',
    fontSize: '15px', 
    gap: '16px'
  }
};
