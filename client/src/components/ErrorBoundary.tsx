import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

/**
 * Error Boundary Component
 * Catches React errors and displays a fallback UI instead of crashing the entire app
 */
class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error details for debugging
    console.error("❌ Error caught by Error Boundary:", error);
    console.error("Error Info:", errorInfo);
    
    // You can also log the error to an error reporting service here
    this.setState({ errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = "/";
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          padding: 20
        }}>
          <div style={{
            backgroundColor: "rgba(255, 255, 255, 0.95)",
            borderRadius: 20,
            padding: 40,
            maxWidth: 600,
            width: "100%",
            boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
            textAlign: "center",
            direction: "rtl"
          }}>
            {/* Icon */}
            <div style={{
              fontSize: 80,
              marginBottom: 20
            }}>
              😔
            </div>

            {/* Title */}
            <h1 style={{
              fontSize: 32,
              fontWeight: 700,
              color: "#333",
              marginBottom: 12
            }}>
              אופס! משהו השתבש
            </h1>

            {/* Description */}
            <p style={{
              fontSize: 18,
              color: "#666",
              marginBottom: 24,
              lineHeight: 1.6
            }}>
              התרחשה שגיאה בלתי צפויה. אנחנו מצטערים על אי הנוחות.
            </p>

            {/* Error details (for debugging) */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div style={{
                backgroundColor: "#f5f5f5",
                borderRadius: 12,
                padding: 16,
                marginBottom: 24,
                textAlign: "right",
                maxHeight: 200,
                overflow: "auto",
                fontFamily: "monospace",
                fontSize: 12
              }}>
                <div style={{ fontWeight: 700, marginBottom: 8, color: "#e53e3e" }}>
                  שגיאה טכנית:
                </div>
                <div style={{ color: "#666" }}>
                  {this.state.error.toString()}
                </div>
                {this.state.errorInfo && (
                  <div style={{ marginTop: 8, color: "#666", fontSize: 11 }}>
                    {this.state.errorInfo.componentStack}
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            <div style={{
              display: "flex",
              gap: 12,
              justifyContent: "center",
              flexWrap: "wrap"
            }}>
              <button
                onClick={this.handleReload}
                style={{
                  padding: "14px 28px",
                  borderRadius: 12,
                  border: "none",
                  fontSize: 16,
                  fontWeight: 700,
                  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  color: "#fff",
                  cursor: "pointer",
                  boxShadow: "0 4px 15px rgba(102, 126, 234, 0.4)",
                  transition: "all 0.3s"
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = "0 6px 20px rgba(102, 126, 234, 0.5)";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 4px 15px rgba(102, 126, 234, 0.4)";
                }}
              >
                🔄 רענן את הדף
              </button>

              <button
                onClick={this.handleGoHome}
                style={{
                  padding: "14px 28px",
                  borderRadius: 12,
                  border: "2px solid #667eea",
                  fontSize: 16,
                  fontWeight: 700,
                  background: "white",
                  color: "#667eea",
                  cursor: "pointer",
                  transition: "all 0.3s"
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = "#f5f5f5";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = "white";
                }}
              >
                🏠 חזור לדף הבית
              </button>
            </div>

            {/* Help text */}
            <p style={{
              marginTop: 24,
              fontSize: 14,
              color: "#999"
            }}>
              אם הבעיה נמשכת, אנא פנה לתמיכה הטכנית
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

