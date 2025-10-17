import { Request, Response, NextFunction } from "express";
import passport from "passport";
import { prisma } from "../utils/prisma";
import { hashPassword } from "../utils/password";

/** @desc Log in user */
export const loginUser = (req: Request, res: Response, next: NextFunction) => {
  passport.authenticate("local", (err: any, user: any, info: any) => {
    if (err) return next(err);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: info?.message || "Invalid credentials",
      });
    }

    req.login(user, (err) => {
      if (err) return next(err);
      const { id, email, username, role } = user;
      res.json({
        success: true,
        message: "Logged in successfully",
        user: { id, email, username, role },
      });
    });
  })(req, res, next);
};

/** @desc Register new user */
export const signupUser = async (req: Request, res: Response) => {
  const { email, username, password } = req.body;

  if (!email || !password || !username) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  try {
    const hashed = await hashPassword(password);
    const user = await prisma.user.create({
      data: { email, username, password: hashed },
    });

    res.status(201).json({
      success: true,
      message: "User created successfully",
      user: { id: user.id, email: user.email, username: user.username },
    });
  } catch (err: any) {
    console.error("Signup error:", err);
    res.status(500).json({ message: "Error creating user" });
  }
};

/** @desc Get current user */
export const getCurrentUser = (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Not authenticated",
    });
  }

  // Destructure only the safe fields you want to expose
  const { email, username, role } = req.user as {
    email?: string;
    username?: string;
    role?: string;
  };

  res.json({
    email: email || null,
    username: username || null,
    role: role || null,
  });
};

/** @desc Logout user */
export const logoutUser = (req: Request, res: Response, next: NextFunction) => {
  req.logout((err) => {
    if (err) return next(err);

    req.session.destroy((err) => {
      if (err) return next(err);
      res.clearCookie("connect.sid");
      res.json({ success: true, message: "Logged out successfully" });
    });
  });
};
