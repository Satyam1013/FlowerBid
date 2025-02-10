const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
dotenv.config();

const { connectDB } = require("./database/connection");
const { authenticator } = require("./middleware/authenticator");

const adminRouter = require("./routes/admin.route").default;
const authRouter = require("./routes/auth.route").default;
const flowerRouter = require("./routes/flower.route").default;

const { startWinnerScheduler } = require("./scheduler/winner");

const app = express();

app.use(express.json());
app.use(cors());

app.use("/api/admin", authenticator, adminRouter);
app.use("/api/flowers", authenticator, flowerRouter);
app.use("/api/auth", authRouter);

startWinnerScheduler();

connectDB().then(() => {
  app.listen(process.env.PORT, () => {
    console.log(`Server running on port ${process.env.PORT}`);
  });
});
