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

          // Validate auction timing
          if (new Date() > flower.endTime) {
            flower.status = FlowerStatus.CLOSED;
            await flower.save();
            io.emit("auctionStatusUpdated", flower);
            return socket.emit("bidError", {
              message: "Bidding time has ended. Auction closed.",
            });
          }

          if (new Date() < flower.startTime) {
            return socket.emit("bidError", {
              message: "Auction has not started yet.",
            });
          }

          // Extract the user ID
          const userId = socket.data.user?.id;
          if (!userId) {
            return socket.emit("bidError", {
              message: "User not authenticated",
            });
          }

          // Retrieve the user
          const user = await User.findById(userId);
          if (!user) {
            return socket.emit("bidError", { message: "User not found" });
          }

          // ❌ Check if the user's balance is less than the bid amount or 10% of bid price is more than balance
          if (
            user.balance < data.bidPrice ||
            data.bidPrice * 0.1 > user.balance
          ) {
            return socket.emit("bidError", {
              message: "Insufficient balance to place this bid",
            });
          }

          // Atomically update the flower's current bid price
          const updatedFlower = await Flower.findOneAndUpdate(
            { _id: data.flowerId, status: FlowerStatus.LIVE },
            { $max: { currentBidPrice: data.bidPrice } },
            { new: true }
          );

          if (!updatedFlower) {
            return socket.emit("bidError", {
              message: "Bid must be higher than current price",
            });
          }

          // Save the bid record
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

          updatedFlower.winningBid = savedBid._id;
          await updatedFlower.save();

          // Update biddingStatus for all users who have bids on this flower
          const usersWithBids = await User.find({
            "biddingStatus.flower": data.flowerId,
          });

          for (const otherUser of usersWithBids) {
            otherUser.biddingStatus = otherUser.biddingStatus.map((entry) =>
              entry.flower && entry.flower.toString() === data.flowerId
                ? { ...entry, highestBid: false }
                : entry
            );
            await otherUser.save();
          }

          // Update the current user's biddingStatus
          user.biddingStatus.push({
            flower: updatedFlower._id,
            bidAmount: data.bidPrice,
            highestBid: true,
          });

          while (user.biddingStatus.length > 10) {
            user.biddingStatus.shift();
          }

          await user.save();

          // Emit the bid update
          io.emit("bidUpdated", { userId, flower: updatedFlower });
        } catch (error) {
          console.error("Error placing bid:", error);
          socket.emit("bidError", { message: "Failed to place bid" });
        }
      }
    );

    socket.on("endAuction", async (flowerId: string) => {
      try {
        const flower = await Flower.findById(flowerId);
        if (!flower || flower.status !== FlowerStatus.LIVE) {
          return socket.emit("auctionError", {
            message: "Auction not found or already closed",
          });
        }

        flower.status = FlowerStatus.CLOSED;
        await flower.save();

        const winningBid = await Bid.findOne({
          flower: flowerId,
          winningBid: true,
        }).populate("user");

        if (winningBid && winningBid.user) {
          const winner = await User.findById(winningBid.user._id);
          if (winner) {
            if (winner.balance < winningBid.amount) {
              return socket.emit("auctionError", {
                message: "Winner has insufficient balance!",
              });
            }

            // Deduct balance from winner
            winner.balance -= winningBid.amount;
            await winner.save();

            // Notify all clients about the auction result
            io.emit("auctionWinner", {
              userId: winner._id,
              flowerId,
              winningBid: winningBid.amount,
              balance: winner.balance,
            });
          }
        }
      } catch (error) {
        console.error("Error finalizing auction:", error);
        socket.emit("auctionError", { message: "Failed to finalize auction" });
      }
    });

    socket.on("disconnect", (reason) => {
      console.log(`Socket disconnected: ${socket.id}, Reason: ${reason}`);
    });
  });
};
