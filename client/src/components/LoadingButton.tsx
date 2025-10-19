/**
 * Loading Button Component
 * A button that displays loading state during async operations
 */

import React, { CSSProperties } from "react";
import { buttonStyles, getButtonHoverEffect, getButtonActiveEffect } from "../styles";

interface LoadingButtonProps {
  onClick?: () => void | Promise<void>;
  disabled?: boolean;
  loading?: boolean;
  variant?: keyof typeof buttonStyles;
  children: React.ReactNode;
  style?: CSSProperties;
  type?: "button" | "submit" | "reset";
  className?: string;
}

const LoadingButton: React.FC<LoadingButtonProps> = ({
  onClick,
  disabled = false,
  loading = false,
  variant = "primary",
  children,
  style,
  type = "button",
  className
}) => {
  const [isHovered, setIsHovered] = React.useState(false);
  const [isPressed, setIsPressed] = React.useState(false);
  
  const isDisabled = disabled || loading;
  const buttonStyle = isDisabled ? buttonStyles.disabled : buttonStyles[variant];

  const handleClick = async () => {
    if (onClick && !isDisabled) {
      await onClick();
    }
  };

  const combinedStyle: CSSProperties = {
    ...buttonStyle,
    ...style,
    ...(isHovered && !isDisabled ? getButtonHoverEffect() : {}),
    ...(isPressed && !isDisabled ? getButtonActiveEffect() : {}),
  };

  return (
    <button
      type={type}
      onClick={handleClick}
      disabled={isDisabled}
      className={className}
      style={combinedStyle}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setIsPressed(false);
      }}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
    >
      {loading ? (
        <>
          <span style={{ 
            display: "inline-block",
            animation: "spin 1s linear infinite",
          }}>
            ⏳
          </span>
          <span>טוען...</span>
          <style>{`
            @keyframes spin {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
          `}</style>
        </>
      ) : (
        children
      )}
    </button>
  );
};

export default LoadingButton;

/**
 * Usage Example:
 * 
 * const [loading, setLoading] = useState(false);
 * 
 * const handleSubmit = async () => {
 *   setLoading(true);
 *   try {
 *     await api('/api/tournaments', { method: 'POST', ... });
 *     alert('Success!');
 *   } catch (error) {
 *     alert('Error: ' + error.message);
 *   } finally {
 *     setLoading(false);
 *   }
 * };
 * 
 * <LoadingButton 
 *   onClick={handleSubmit} 
 *   loading={loading}
 *   variant="primary"
 * >
 *   צור טורניר
 * </LoadingButton>
 */

