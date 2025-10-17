import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import session from "express-session";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import passport from "passport";
import authRoutes from "./routes/authRoutes";
dotenv.config();
import "./config/passport";
import { config } from "./config/config";
const app = express();

app.use(express.json());
app.use(helmet());
app.use(cookieParser());
app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" }));
app.use(morgan("common"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(
  cors({
    // Adjust to your client origin
    origin: "http://localhost:5173",
    credentials: true,
  })
);

app.use(session(config.session));
app.use(passport.initialize());
app.use(passport.session());

app.use("/auth", authRoutes);

const server = app.listen(3000, () =>
  console.log(`
 Server ready at: http://localhost:3000`)
);
