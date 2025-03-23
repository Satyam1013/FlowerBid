import express from "express";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();

import http from "http";
import { Server as SocketIOServer } from "socket.io";

import { connectDB } from "./database/connection";
import { authenticator } from "./middleware/authenticator";

import adminRouter from "./routes/admin.route";
import authRouter from "./routes/auth.route";
import flowerRouter from "./routes/flower.route";
import userRouter from "./routes/user.route";
import sellerRouter from "./routes/seller.route";

import { initializeSocket } from "./socket.handler";

const app = express();
app.use(express.json());
app.use(cors());

app.use("/api/auth", authRouter);
app.use("/api/admin", adminRouter);
app.use("/api/seller", sellerRouter);
app.use("/api/user", authenticator, userRouter);
app.use("/api/flowers", flowerRouter);

const server = http.createServer(app);
const PORT = process.env.PORT || 8080;

const io = new SocketIOServer(server, {
  cors: {
    origin: [
      "http://stembid.com",
      "https://stembid.com",
      "http://localhost:8080",
      "https://api.stembid.com:8080",
    ],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  },
});

initializeSocket(io);

connectDB().then(() => {
  server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
});

export { io };
