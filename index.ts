import express from "express";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();

import https from "https";
import fs from "fs";

import { connectDB } from "./database/connection";
import { authenticator } from "./middleware/authenticator";

import adminRouter from "./routes/admin.route";
import authRouter from "./routes/auth.route";
import flowerRouter from "./routes/flower.route";
import userRouter from "./routes/user.route";
import sellerRouter from "./routes/seller.route";

import { initializeSocket } from "./socket.handler";
import { ServerOptions, Server as SocketIOServer } from "socket.io";

const app = express();
app.use(express.json());
app.use(cors());

app.use("/api/auth", authRouter);
app.use("/api/admin", adminRouter);
app.use("/api/seller", sellerRouter);
app.use("/api/user", authenticator, userRouter);
app.use("/api/flowers", flowerRouter);

const privateKey = fs.readFileSync(
  "/etc/letsencrypt/live/api.stembid.com/privkey.pem",
  "utf8"
);
const certificate = fs.readFileSync(
  "/etc/letsencrypt/live/api.stembid.com/fullchain.pem",
  "utf8"
);

const credentials = { key: privateKey, cert: certificate };

// Create HTTPS Server
const server = https.createServer(credentials, app);
const PORT = process.env.PORT || 8080;

const socketOptions: Partial<ServerOptions> = {
  cors: {
    origin: [
      "https://stembid.com",
      "http://localhost:8080",
      "https://api.stembid.com",
    ],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  },
};

const io = new SocketIOServer(server, socketOptions);

initializeSocket(io);

connectDB().then(() => {
  server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
});

export { io };
