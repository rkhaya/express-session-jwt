import express from "express";
import {
  authJWTMiddleware,
  isAuthenticated,
} from "../middleware/isAuthenticated";
import {
  loginUser,
  signupUser,
  getCurrentUser,
  logoutUser,
} from "../controllers/authController";
import { loginLimiter } from "../middleware/rateLimiter";

const router = express.Router();

router.post("/login", loginLimiter, loginUser);
router.post("/signup", signupUser);
router.get("/me", isAuthenticated, getCurrentUser);
router.post("/logout", isAuthenticated, logoutUser);

export default router;
