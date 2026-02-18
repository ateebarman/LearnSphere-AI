import Redis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

let redisClient;

const connectRedis = () => {
  if (process.env.REDIS_URL) {
    console.log('🔌 Connecting to Redis (Upstash)...');
    redisClient = new Redis(process.env.REDIS_URL, {
      tls: { rejectUnauthorized: false }, // Required for Upstash
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      retryStrategy: (times) => {
        if (times > 5) {
            console.warn('❌ Redis connection failed after 5 retries. Caching will be disabled.');
            return null; // Stop retrying
        }
        return Math.min(times * 50, 2000);
      },
    });
  } else {
    console.warn('⚠️ REDIS_URL not found. Caching will be disabled.');
    // Create a dummy client that fails gracefully or does nothing
    // For now, we'll just not initialize it, and consumers should check if redisClient exists
    return null;
  }

  redisClient.on('connect', () => {
    console.log('✅ Redis Connected');
  });

  redisClient.on('error', (err) => {
    console.error('❌ Redis Error:', err.message);
  });

  return redisClient;
};

// Initialize connection
if (!redisClient) {
    connectRedis();
}

export { redisClient, connectRedis };
