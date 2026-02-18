import { redisClient } from '../config/redis.js';

/**
 * Retrieve data from cache
 * @param {string} key 
 * @returns {Promise<any|null>} Parsed data or null
 */
export const getFromCache = async (key) => {
  if (!redisClient) return null;
  
  try {
    const data = await redisClient.get(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error(`Cache GET error for key ${key}:`, error.message);
    return null; // Fail gracefully
  }
};

/**
 * Set data in cache
 * @param {string} key 
 * @param {any} data 
 * @param {number} ttlSeconds 
 */
export const setInCache = async (key, data, ttlSeconds = 3600) => {
  if (!redisClient) return;

  try {
    await redisClient.set(key, JSON.stringify(data), 'EX', ttlSeconds);
  } catch (error) {
    console.error(`Cache SET error for key ${key}:`, error.message);
  }
};

/**
 * Helper to wrap standard Express responses with caching
 * Usage: return cacheResponse(res, 'my-key', data, 300);
 */
export const cacheResponse = async (res, key, data, ttlSeconds = 3600) => {
    // Fire and forget cache set
    setInCache(key, data, ttlSeconds);
    return res.json(data);
};
