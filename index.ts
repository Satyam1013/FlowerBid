import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();

import http from 'http';
import { Server as SocketIOServer } from 'socket.io';

import { connectDB } from './database/connection';
import { authenticator } from './middleware/authenticator';

import adminRouter from './routes/admin.route';
import authRouter from './routes/auth.route';
import flowerRouter from './routes/flower.route';
import { startBidCleanupCron } from './cleanup/bid.cleanup.cron';

const app = express();
app.use(express.json());
app.use(cors());

app.use('/api/admin', adminRouter);
app.use('/api/flowers', authenticator, flowerRouter);
app.use('/api/auth', authRouter);

const server = http.createServer(app);

const io = new SocketIOServer(server, {
  cors: {
    origin: '*', // Allow all origins; adjust as needed
  },
});

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});

startBidCleanupCron();

const PORT = process.env.PORT || 8080;

connectDB().then(() => {
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});

export { io };
