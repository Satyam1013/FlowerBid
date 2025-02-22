import schedule from "node-cron";
import Flower from "../models/Flower";
import Bid from "../models/Bid";

export const startBidCleanupCron = () => {
  schedule.schedule(
    "0 1 * * *",
    async () => {
      console.log("Running daily bid cleanup job at 1 AM...");

      try {
        const closedFlowers = await Flower.find(
          { status: "closed" },
          { _id: 1, winningBid: 1 }
        );
        const closedFlowerIds = closedFlowers.map((flower) => flower._id);

        const winningBidIds = closedFlowers
          .filter((flower) => flower.winningBid)
          .map((flower) => flower.winningBid!.toString());

        await Bid.deleteMany({
          flower: { $in: closedFlowerIds },
          _id: { $nin: winningBidIds },
        });

        console.log("✅ Bid cleanup completed.");
      } catch (error) {
        console.error("❌ Error during bid cleanup:", error);
      }
    },
    {
      scheduled: true,
      timezone: "Asia/Kolkata",
    }
  );
};
