const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
dotenv.config();

const { connectDB } = require("./database/connection");
const { authenticator } = require("./middleware/authenticator");

const adminRouter = require("./routes/admin.route").default;
const authRouter = require("./routes/auth.route").default;
const flowerRouter = require("./routes/flower.route").default;
const { startBidCleanupCron } = require("./cleanup/bid.cleanup.cron");

const http = require("http");
const socketIo = require("socket.io");

const app = express();
app.use(express.json());
app.use(cors());

app.use("/api/admin", adminRouter);
app.use("/api/flowers", authenticator, flowerRouter);
app.use("/api/auth", authRouter);

const server = http.createServer(app);

const io = new socketIo.Server(server, {
  cors: {
    origin: "*", // Allow all origins; adjust as needed
  },
});

io.on("connection", (socket: any) => {
  console.log(`User connected: ${socket.id}`);

  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});

startBidCleanupCron();

const PORT = process.env.PORT || 3000

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});

module.exports.io = io;
