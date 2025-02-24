import { Server } from "socket.io";
import Flower from "./models/Flower";
import { socketAuthenticator } from "./middleware/authenticator";
import Bid from "./models/Bid";
import User from "./models/User";

export const initializeSocket = (io: Server) => {
  // Use the socket authentication middleware
  io.use(socketAuthenticator);

  io.on("connection", (socket) => {
    // Start Auction
    socket.on("startAuction", async (flowerId: string) => {
      try {
        const flower = await Flower.findById(flowerId);
        if (!flower) {
          return socket.emit("auctionError", { message: "Flower not found" });
        }
        if (flower.startDateTime > new Date()) {
          flower.status = "live";
          await flower.save();
          io.emit("auctionStarted", flower);
        }
      } catch (error) {
        console.error("Error starting auction:", error);
        socket.emit("auctionError", { message: "Failed to start auction" });
      }
    });

    // Retrieve Auction Details
    socket.on("getAuctionDetails", async (flowerId: string) => {
      try {
        const flower = await Flower.findById(flowerId);
        if (flower) {
          socket.emit("auctionDetails", flower);
        } else {
          socket.emit("auctionError", { message: "Flower not found" });
        }
      } catch (error) {
        console.error("Error fetching auction details:", error);
        socket.emit("auctionError", {
          message: "Failed to fetch auction details",
        });
      }
    });

    // Handle User Bids
    socket.on(
      "placeBid",
      async (data: { flowerId: string; bidPrice: number }) => {
        try {
          // Retrieve the flower document
          const flower = await Flower.findById(data.flowerId);
          if (!flower) {
            return socket.emit("bidError", { message: "Flower not found" });
          }
          // Ensure the bid is valid
          if (
            !(
              flower.status === "live" && data.bidPrice > flower.currentBidPrice
            )
          ) {
            return socket.emit("bidError", {
              message: "Bid must be higher than current price",
            });
          }
          // Extract the user ID (adjust according to your user schema; here we assume 'id')
          const userId = socket.data.user?.id;
          if (!userId) {
            return socket.emit("bidError", {
              message: "User not authenticated",
            });
          }

          // Update the flower's current bid price
          flower.currentBidPrice = data.bidPrice;

          // 1. Save the bid record
          const bid = new Bid({
            user: userId,
            flower: data.flowerId,
            amount: data.bidPrice,
            bidTime: new Date(),
          });
          const savedBid = await bid.save();

          // 2. Determine if this bid is now the highest
          const highestBidForFlower = await Bid.findOne({
            flower: data.flowerId,
          }).sort({ amount: -1 });
          const isHighest = highestBidForFlower
            ? highestBidForFlower._id.equals(savedBid._id)
            : false;

          // 3. Prepare the bidding status entry using the full flower object
          const bidStatusEntry = {
            flower: flower.toObject(), // convert to a plain object
            bidAmount: data.bidPrice,
            highestBid: isHighest,
          };

          // 4. Update biddingStatus for all users who have bids on this flower
          // Query by matching the nested property "flower._id"
          const usersWithBids = await User.find({
            "biddingStatus.flower._id": data.flowerId,
          });
          for (const otherUser of usersWithBids) {
            otherUser.biddingStatus = otherUser.biddingStatus.map((entry) => {
              if (
                entry.flower &&
                entry.flower._id &&
                entry.flower._id.toString() === flower._id.toString()
              ) {
                return { ...entry, highestBid: false };
              }
              return entry;
            });
            await otherUser.save();
          }

          // 5. Update the current user's biddingStatus
          const user = await User.findById(userId);
          if (user) {
            // Add the new bid entry, ensuring highestBid is true for the current user's entry
            user.biddingStatus.push({ ...bidStatusEntry, highestBid: true });
            // Keep only the latest 10 bids
            while (user.biddingStatus.length > 10) {
              user.biddingStatus.shift();
            }
            await user.save();
          }

          // 6. Save the winning bidId inside the flower document if this is the highest bid
          if (isHighest) {
            flower.winningBid = savedBid._id; // Ensure your Flower model supports this field
          }
          await flower.save();

          // Emit the bid update to all clients with the userId and updated flower data
          io.emit("bidUpdated", { userId, flower });
        } catch (error) {
          console.error("Error placing bid:", error);
          socket.emit("bidError", { message: "Failed to place bid" });
        }
      }
    );

    socket.on("disconnect", () => {
      console.log("User Disconnected:", socket.id);
    });
  });
};
