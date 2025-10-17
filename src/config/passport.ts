import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { PrismaClient } from "@prisma/client";
import { verifyPassword } from "../utils/password";

const prisma = new PrismaClient();

passport.use(
  new LocalStrategy(
    { usernameField: "email", passwordField: "password" },
    async (email, password, done) => {
      try {
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
          return done(null, false, { message: "Invalid credentials" });
        }

        const valid = await verifyPassword(password, user.password);
        if (!valid) {
          return done(null, false, { message: "Invalid credentials" });
        }

        return done(null, {
          id: user.id,
          role: user.role,
          email: user.email,
          username: user.username,
        });
      } catch (err) {
        return done(err);
      }
    }
  )
);

// Serialize / Deserialize
passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, username: true, role: true },
    });
    done(null, user);
  } catch (err) {
    done(err);
  }
});

export default passport;
