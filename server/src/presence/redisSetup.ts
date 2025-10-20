/**
 * Redis setup and initialization
 * Ensures Redis connection is established before server starts
 */

import { redis } from "./redisPresence.js";
import { logger } from "../logger.js";

/**
 * Initialize Redis connection
 * Call this before starting the server
 */
export async function initializeRedis(): Promise<void> {
  try {
    await redis.connect();
    logger.info("redis", "Redis connection established successfully");
  } catch (error) {
    logger.error("redis", "Failed to connect to Redis", error);
    throw new Error("Redis connection failed. Please ensure Redis is running.");
  }
}

/**
 * Test Redis connection
 * Useful for health checks
 */
export async function testRedisConnection(): Promise<boolean> {
  try {
    await redis.ping();
    return true;
  } catch (error) {
    logger.error("redis", "Redis ping failed", error);
    return false;
  }
}

/**
 * Get Redis connection status
 */
export function getRedisStatus(): string {
  return redis.isReady ? "ready" : redis.isOpen ? "connecting" : "disconnected";
}
