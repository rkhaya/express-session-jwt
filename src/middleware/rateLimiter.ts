import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import RedisStore from "rate-limit-redis";
import type { Request } from "express";
import { redisClient } from "../utils/redis";

export const loginLimiter = rateLimit({
  store: new RedisStore({
    sendCommand: (...args: string[]) => redisClient.sendCommand(args),
    prefix: "rl_login_",
  }),

  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 5,

  // ✅ Officially safe IP + email key
  keyGenerator: (req: Request): string => {
    // use express-rate-limit's built-in IPv6-safe normalizer
    const ip = ipKeyGenerator(req.ip || "unknown");
    const email = (req.body?.email || "").toLowerCase().trim();
    return `${ip}:${email}`;
  },

  skipSuccessfulRequests: false, // only count failed logins
  message: {
    success: false,
    message: "Too many failed login attempts. Please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});
