// server/src/utils/ids.ts
import { randomUUID } from "node:crypto";

export function uuid(): string {
  return randomUUID();
}

export function genToken(len = 32): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let out = '';
  for (let i = 0; i < len; i++) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}

export function genPin(digits = 6): string {
  const n = Math.floor(Math.random() * Math.pow(10, digits));
  return n.toString().padStart(digits, '0'); // למשל "038417"
}

