const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
dotenv.config();

const { connectDB } = require("./database/connection");
const { authenticator } = require("./middleware/authenticator");

const bidRouter = require("./routes/bid.route").default;
const adminRouter = require("./routes/admin.route").default;
const authRouter = require("./routes/auth.route").default;
const { startWinnerScheduler } = require("./scheduler/winner");

const app = express();

app.use(express.json());
app.use(cors());

app.use("/api/bids", authenticator, bidRouter);
app.use("/api/admin", authenticator, adminRouter);
app.use("/api/auth", authRouter);

startWinnerScheduler();


connectDB().then(() => {
  app.listen(process.env.PORT, () => {
    console.log(`Server running on port ${process.env.PORT}`);
  });
});
