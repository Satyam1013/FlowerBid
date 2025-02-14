import schedule from "node-cron";
import Flower from "../models/Flower";
import Bid from "../models/Bid";

// This cron job will run every night at 1 AM (server's local time)
export const startBidCleanupCron = () => {
  schedule.schedule("0 1 * * *", async () => {
    console.log("Running daily bid cleanup job at 1 AM...");

    try {
      // Find all closed auctions (flowers with status "closed")
      const closedFlowers = await Flower.find(
        { status: "closed" },
        { _id: 1, winningBid: 1 }
      );
      const closedFlowerIds = closedFlowers.map((flower) => flower._id);

      // Get an array of winning bid IDs (if any) for these closed flowers
      const winningBidIds = closedFlowers
        .filter((flower) => flower.winningBid)
        .map((flower) => flower.winningBid!.toString());

      // Delete all bids for these closed flowers that are not the winning bid
      await Bid.deleteMany({
        flower: { $in: closedFlowerIds },
        _id: { $nin: winningBidIds },
      });

      console.log("Bid cleanup completed for closed auctions.");
    } catch (error) {
      console.error("Error during bid cleanup:", error);
    }
  });
};
