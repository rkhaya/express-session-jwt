import jwt from "jsonwebtoken";
import { redisClient } from "../utils/redis";
import { v4 as uuidv4 } from "uuid";
import { config } from "../config/config";

/* -------------------------------------------------------------------------- */
/*                                ENV CHECKS                                  */
/* -------------------------------------------------------------------------- */

const jwt_access_secret = config.JWT_ACCESS_SECRET;
const jwt_refresh_secret = config.JWT_REFRESH_SECRET;

if (!jwt_access_secret || !jwt_refresh_secret) {
  throw new Error("❌ Missing JWT secrets in environment variables.");
}

/* -------------------------------------------------------------------------- */
/*                                  TYPES                                     */
/* -------------------------------------------------------------------------- */

interface AccessTokenPayload {
  userId: string;
  iat: number;
  exp: number;
}

interface RefreshTokenPayload extends AccessTokenPayload {
  jti: string;
}

/* -------------------------------------------------------------------------- */
/*                            TOKEN GENERATION                                */
/* -------------------------------------------------------------------------- */

/** Generate access + refresh tokens for a user */
export function generateTokens(userId: string) {
  const jti = uuidv4(); // unique refresh token identifier

  const accessToken = jwt.sign({ userId }, jwt_access_secret, {
    expiresIn: "15m", // short-lived
  });

  const refreshToken = jwt.sign({ userId, jti }, jwt_refresh_secret, {
    expiresIn: "7d", // long-lived
  });

  return { accessToken, refreshToken, jti };
}

/* -------------------------------------------------------------------------- */
/*                              REDIS STORAGE                                 */
/* -------------------------------------------------------------------------- */

/** Store refresh token JTI in Redis (with TTL) */
export async function storeRefreshToken(userId: string, jti: string) {
  const key = `refreshToken:${userId}:${jti}`;
  const ttl = 7 * 24 * 60 * 60; // 7 days in seconds
  await redisClient.set(key, "true", { EX: ttl });
}

/** Revoke a specific refresh token */
export async function revokeRefreshToken(userId: string, jti: string) {
  await redisClient.del(`refreshToken:${userId}:${jti}`);
}

/** Revoke all refresh tokens for a user (logout everywhere) */
export async function revokeAllUserTokens(userId: string) {
  const pattern = `refreshToken:${userId}:*`;
  const keys = await redisClient.keys(pattern);
  if (keys.length) {
    await redisClient.del(keys);
  }
}

/* -------------------------------------------------------------------------- */
/*                            TOKEN VERIFICATION                              */
/* -------------------------------------------------------------------------- */

/** Verify access token */
export function verifyAccessToken(token: string): AccessTokenPayload | null {
  try {
    return jwt.verify(token, jwt_access_secret) as AccessTokenPayload;
  } catch {
    return null;
  }
}

/** Verify refresh token and ensure it exists in Redis */
export async function verifyRefreshToken(
  token: string
): Promise<RefreshTokenPayload | null> {
  try {
    const payload = jwt.verify(
      token,
      jwt_refresh_secret
    ) as RefreshTokenPayload;

    const key = `refreshToken:${payload.userId}:${payload.jti}`;
    const exists = await redisClient.exists(key);
    if (!exists) return null; // revoked or expired in Redis

    return payload;
  } catch {
    return null;
  }
}

/* -------------------------------------------------------------------------- */
/*                               REFRESH LOGIC                                */
/* -------------------------------------------------------------------------- */

/** Refresh token flow: verify, revoke old, issue new tokens */
export async function rotateTokens(
  refreshToken: string
): Promise<{ accessToken: string; refreshToken: string } | null> {
  const payload = await verifyRefreshToken(refreshToken);
  if (!payload) return null;

  // Revoke old refresh token
  await revokeRefreshToken(payload.userId, payload.jti);

  // Generate new tokens + store
  const {
    accessToken,
    refreshToken: newRefreshToken,
    jti,
  } = generateTokens(payload.userId);
  await storeRefreshToken(payload.userId, jti);

  return { accessToken, refreshToken: newRefreshToken };
}
