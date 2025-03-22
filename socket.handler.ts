import { Server } from "socket.io";
import Flower from "./models/Flower";
import { socketAuthenticator } from "./middleware/authenticator";
import Bid from "./models/Bid";
import User from "./models/User";
import { FlowerStatus } from "./types/flower.types";

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
        if (flower.startTime > new Date()) {
          flower.status = FlowerStatus.LIVE;
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

    // Handle User Bids with concurrency handling
    socket.on(
      "placeBid",
      async (data: { flowerId: string; bidPrice: number }) => {
        try {
          // Retrieve the flower document
          const flower = await Flower.findById(data.flowerId);
          if (!flower) {
            return socket.emit("bidError", { message: "Flower not found" });
          }

          // If bidding time has ended, update status and inform client.
          if (new Date() > flower.endTime) {
            flower.status = FlowerStatus.CLOSED;
            await flower.save();
            io.emit("auctionStatusUpdated", flower);
            return socket.emit("bidError", {
              message: "Bidding time has ended. Auction closed.",
            });
          }
          // ⚠️ Missing Check:
          if (new Date() < flower.startTime) {
            return socket.emit("bidError", {
              message: "Auction has not started yet.",
            });
          }

          // Atomically update the flower's current bid price.
          // The condition ensures that only a bid strictly greater than the currentBidPrice will update.
          const updatedFlower = await Flower.findOneAndUpdate(
            { _id: data.flowerId, status: FlowerStatus.LIVE },
            { $max: { currentBidPrice: data.bidPrice } }, // Ensures only a higher bid updates it
            { new: true }
          );

          // If no document was updated, then the bid was not strictly higher.
          if (!updatedFlower) {
            return socket.emit("bidError", {
              message: "Bid must be higher than current price",
            });
          }

          // Extract the user ID (assuming it's stored as 'id' on socket.data.user)
          const userId = socket.data.user?.id;
          if (!userId) {
            return socket.emit("bidError", {
              message: "User not authenticated",
            });
          }

          // Save the bid record (bidTime and winningBid get their defaults)
          const savedBid = await Bid.create({
            user: userId,
            flower: data.flowerId,
            amount: data.bidPrice,
            winningBid: true,
          });

          await savedBid.save();

          await Bid.updateMany(
            { flower: data.flowerId, _id: { $ne: savedBid._id } },
            { $set: { winningBid: false } }
          );

          // Update the flower document's winningBid field.
          updatedFlower.winningBid = savedBid._id;
          await updatedFlower.save();

          // Prepare a bidding status entry for the users using the full flower object.
          const bidStatusEntry = {
            flower: updatedFlower.toObject(),
            bidAmount: data.bidPrice,
            highestBid: true,
          };

          // Update biddingStatus for all users who have bids on this flower,
          // setting highestBid to false for those entries.
          const usersWithBids = await User.find({
            "biddingStatus.flower._id": data.flowerId,
          });
          for (const otherUser of usersWithBids) {
            otherUser.biddingStatus = otherUser.biddingStatus.map((entry) => {
              if (
                entry.flower &&
                entry.flower._id &&
                entry.flower._id.toString() === data.flowerId
              ) {
                return { ...entry, highestBid: false };
              }
              return entry;
            });
            await otherUser.save();
          }

          // Update the current user's biddingStatus
          const user = await User.findById(userId);
          if (user) {
            user.biddingStatus.push({ ...bidStatusEntry });
            // Keep only the latest 10 bids
            while (user.biddingStatus.length > 10) {
              user.biddingStatus.shift();
            }
            await user.save();
          }

          // Emit the bid update to all clients with the userId and updated flower data
          io.emit("bidUpdated", { userId, flower: updatedFlower });
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
