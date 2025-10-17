import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "./jwtAuth";
import { prisma } from "../utils/prisma";

export interface TokenPayload {
  userId: string;
  jti?: string;
}

export function isAuthenticated(
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (req.isAuthenticated()) {
    return next();
  }
  return res.status(401).json({ message: "Not authenticated" });
}

export const authJWTMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { accessToken, refreshToken } = req.cookies; // Read the accessToken from cookies

    if (!refreshToken && !accessToken) {
      res.status(400).json({ error: "Refresh token is missing." });
      return; // End the request cycle
    }

    if (!accessToken) {
      res.status(401).json({ error: "Access token is missing." });
      return; // End the request cycle
    }

    // Verify the access token
    const payload = verifyAccessToken(accessToken) as unknown as TokenPayload;
    if (!payload) {
      res.status(401).json({ error: "Invalid or expired access token." });
      return; // End the request cycle
    }
    req.user = payload.userId;
    next(); // Pass control to the next middleware
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error." });
    return; // End the request cycle
  }
};
