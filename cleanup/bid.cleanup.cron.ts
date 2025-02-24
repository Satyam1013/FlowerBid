import cron from "node-cron";
import Flower from "../models/Flower";
import Bid from "../models/Bid";

export const startAuctionCleanupCron = () => {
  cron.schedule(
    "0 1 * * *", // Runs at 1 AM daily
    async () => {
      console.log(
        "🛠 Running auction status update & bid cleanup job at 1 AM..."
      );
      try {
        // Find closed flowers
        const closedFlowers = await Flower.find(
          { status: "closed" },
          { _id: 1 }
        );
        const closedFlowerIds = closedFlowers.map((flower) => flower._id);

        // Delete all bids for closed flowers that are not winning bids
        await Bid.deleteMany({
          flower: { $in: closedFlowerIds },
          winningBid: false, // Delete if winningBid is false
        });

        console.log("✅ Bid cleanup completed.");
      } catch (error) {
        console.error("❌ Error during auction cleanup:", error);
      }
    },
    {
      scheduled: true,
      timezone: "Asia/Kolkata",
    }
  );
};
