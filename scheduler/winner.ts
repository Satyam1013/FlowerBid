import schedule from "node-cron";
import { Types } from "mongoose";
import Flower from "../models/Flower";
import Bid from "../models/Bid";

export const startWinnerScheduler = () => {
  // Runs every minute
  schedule.schedule("* * * * *", async () => {
    try {
      const endedFlowers = await Flower.find({
        bidEndTime: { $lt: new Date() },
        winningBid: { $exists: false },
      });

      for (const flower of endedFlowers) {
        // Get the highest bid; if tie, the earlier bid wins.
        const winningBids = await Bid.find({ flower: flower._id })
          .sort({ amount: -1, bidTime: 1 })
          .limit(1);

        if (winningBids.length > 0) {
          // Cast the _id to Types.ObjectId to match the expected type
          flower.winningBid = winningBids[0]._id as Types.ObjectId;
          await flower.save();
          console.log(
            `Flower "${flower.name}" won by user ${winningBids[0].user}`
          );
        }
      }
    } catch (err) {
      console.error("Error in winner scheduler:", err);
    }
  });
};
