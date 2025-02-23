import { Server } from "socket.io";
import Flower from "./models/Flower";

export const initializeSocket = (io: Server) => {
  io.on("connection", (socket) => {
    console.log("User Connected:", socket.id);

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
        } else {
          socket.emit("auctionError", {
            message: "Auction start time is not in the future.",
          });
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
          const flower = await Flower.findById(data.flowerId);
          if (!flower) {
            return socket.emit("bidError", { message: "Flower not found" });
          }

          // Ensure auction is active and the bid is valid
          if (
            flower.status === "live" &&
            data.bidPrice > flower.currentBidPrice
          ) {
            flower.currentBidPrice = data.bidPrice;
            await flower.save();
            io.emit("bidUpdated", flower);
          } else {
            socket.emit("bidError", {
              message: "Bid must be higher than current price",
            });
          }
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
