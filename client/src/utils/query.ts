// הופך כל מקור אפשרי ל-URLSearchParams אמיתי, כדי שתמיד יהיה .get()
export function ensureSearchParams(
  source?: string | URLSearchParams | URL | Record<string, any> | null
): URLSearchParams {
  if (!source) return new URLSearchParams();

  // אם כבר קיבלנו URLSearchParams
  if (typeof (source as any).get === 'function' && source instanceof URLSearchParams) {
    return source as URLSearchParams;
  }

  // אם זה URL מלא
  if (source instanceof URL) {
    return new URLSearchParams(source.search || '');
  }

  // אם זה מחרוזת "?a=1&b=2" או "a=1&b=2"
  if (typeof source === 'string') {
    const s = source.startsWith('?') ? source : `?${source}`;
    return new URLSearchParams(s);
  }

  // אם זה אובייקט רגיל {a:1,b:2}
  if (typeof source === 'object') {
    const entries: [string, string][] = Object.entries(source).map(([k, v]) => [k, String(v ?? '')]);
    return new URLSearchParams(entries);
  }

  return new URLSearchParams();
}

// קיצור נוח לשליפה בטוחה
export function qget(name: string, source?: string | URLSearchParams | URL | Record<string, any> | null): string | null {
  return ensureSearchParams(source).get(name);
}

// פונקציה נוחה לשליפה בטוחה של מספר
export function qgetNumber(name: string, source?: string | URLSearchParams | URL | Record<string, any> | null, defaultValue: number = 0): number {
  const value = qget(name, source);
  const parsed = Number(value);
  return isNaN(parsed) ? defaultValue : parsed;
}

// פונקציה נוחה לשליפה בטוחה של boolean
export function qgetBoolean(name: string, source?: string | URLSearchParams | URL | Record<string, any> | null, defaultValue: boolean = false): boolean {
  const value = qget(name, source);
  if (!value) return defaultValue;
  return value.toLowerCase() === 'true' || value === '1';
}
