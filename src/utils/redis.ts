import { RedisStore } from "connect-redis";
import { createClient } from "redis";
import { config } from "../config/config";

// ✅ Build URL safely from env vars
const redisUrl: string =
  process.env.REDIS_TLS === "true"
    ? `rediss://${config.redis.host}:${config.redis.port}`
    : `redis://${config.redis.host}:${config.redis.port}`;

// ✅ Initialize Redis client with credentials
export const redisClient: ReturnType<typeof createClient> = createClient({
  url: redisUrl,
  password: config.redis.password,
});

redisClient.connect().catch(console.error);

redisClient.on("connect", () => {
  console.log("✅ Connected to Redis");
});

redisClient.on("error", (err: Error) => {
  console.error("❌ Redis error:", err);
});

// ✅ Initialize store for express-session
export const redisStore = new RedisStore({
  client: redisClient,
  prefix: "myapp:",
});
