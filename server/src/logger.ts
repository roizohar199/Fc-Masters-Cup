/**
 * מערכת לוגים מרוכזת לפרויקט
 */

type LogLevel = "info" | "warn" | "error" | "success" | "debug";

const colors = {
  info: "\x1b[36m",    // cyan
  warn: "\x1b[33m",    // yellow
  error: "\x1b[31m",   // red
  success: "\x1b[32m", // green
  debug: "\x1b[35m",   // magenta
  reset: "\x1b[0m"
};

const icons = {
  info: "ℹ️",
  warn: "⚠️",
  error: "❌",
  success: "✅",
  debug: "🔍"
};

function formatMessage(level: LogLevel, context: string, message: string, data?: any): string {
  const timestamp = new Date().toISOString();
  const color = colors[level];
  const icon = icons[level];
  const reset = colors.reset;
  
  let logMessage = `${color}${icon} [${timestamp}] [${context.toUpperCase()}] ${message}${reset}`;
  
  if (data !== undefined) {
    logMessage += `\n${color}   Data: ${JSON.stringify(data, null, 2)}${reset}`;
  }
  
  return logMessage;
}

export const logger = {
  info: (context: string, message: string, data?: any) => {
    console.log(formatMessage("info", context, message, data));
  },
  
  warn: (context: string, message: string, data?: any) => {
    console.warn(formatMessage("warn", context, message, data));
  },
  
  error: (context: string, message: string, error?: any) => {
    const errorData = error instanceof Error 
      ? { message: error.message, stack: error.stack }
      : error;
    console.error(formatMessage("error", context, message, errorData));
  },
  
  success: (context: string, message: string, data?: any) => {
    console.log(formatMessage("success", context, message, data));
  },
  
  debug: (context: string, message: string, data?: any) => {
    if (process.env.NODE_ENV === "development") {
      console.log(formatMessage("debug", context, message, data));
    }
  }
};
