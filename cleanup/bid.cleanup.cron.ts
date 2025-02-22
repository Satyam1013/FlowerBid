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
        const currentTime = new Date();

        // **Step 1: Update Flower Status**
        await Flower.updateMany(
          {
            status: { $in: ["live", "upcoming"] },
            endDateTime: { $lte: currentTime },
          },
          { $set: { status: "closed" } }
        );
        console.log("✅ Updated closed auctions.");

        // **Step 2: Cleanup Bids**
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
          _id: { $nin: winningBidIds }, // Keep only winning bid
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
