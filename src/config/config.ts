import { redisStore } from "../utils/redis";

export const config = {
  session: {
    store: redisStore,
    secret: (process.env.SESSION_SECRET as string) || "default",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // true in production behind HTTPS
      maxAge: 1000 * 60 * 60 * 24, // 1 day
    },
  },
  redis: {
    host: process.env.REDIS_HOST || "localhost",
    port: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT) : 6379,
    password: process.env.REDIS_PASSWORD || undefined,
  },
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || "default",
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || "default2",
};
