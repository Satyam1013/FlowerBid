import { createClient, RedisClientType } from "redis";
import dotenv from "dotenv";
dotenv.config();

const redisUrl = process.env.REDIS_URL;

let client: RedisClientType | null = null;

if (redisUrl && redisUrl !== "redis://localhost:6379") {
  client = createClient({ url: redisUrl });

  client.on("error", (err: Error) => {
    console.error("Redis error:", err);
  });

  client
    .connect()
    .then(() => {
      console.log("Connected to Redis");
    })
    .catch((err: Error) => {
      console.error("Error connecting to Redis:", err);
    });
} else {
  console.log("No valid Redis URL provided, skipping Redis connection.");
}

export default client;
