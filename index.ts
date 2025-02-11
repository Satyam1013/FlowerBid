const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
dotenv.config();

const { connectDB } = require("./database/connection");
const { authenticator } = require("./middleware/authenticator");

const adminRouter = require("./routes/admin.route").default;
const authRouter = require("./routes/auth.route").default;
const flowerRouter = require("./routes/flower.route").default;

const http = require("http");
const socketIo = require("socket.io");

const app = express();
app.use(express.json());
app.use(cors());

app.use("/api/admin", adminRouter);
app.use("/api/flowers", authenticator, flowerRouter);
app.use("/api/auth", authRouter);

// Create an HTTP server from your Express app
const server = http.createServer(app);

connectDB().then(() => {
  app.listen(process.env.PORT, () => {
    console.log(`Server running on port ${process.env.PORT}`);
  });
});

// Create and attach the Socket.IO instance using require
const io = new socketIo.Server(server, {
  cors: {
    origin: "*", // Allow all origins; adjust as needed
  },
});

// Listen for socket connections
io.on("connection", (socket: any) => {
  console.log(`User connected: ${socket.id}`);

  // You can add additional socket event listeners here
  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});

// Optionally, export the Socket.IO instance for use in other modules (e.g., controllers)
module.exports.io = io;
