import { createClient, RedisClientType } from "redis";
import dotenv from "dotenv";
dotenv.config();

const redisUrl = process.env.REDIS_URL || "redis://127.0.0.1:6379";

const client: RedisClientType = createClient({ url: redisUrl });

client.on("error", (err: Error) => {
  console.error("Redis error:", err);
});

client
  .connect()
  .then(() => {
    console.log("Connected to Redis at:", redisUrl);
  })
  .catch((err: Error) => {
    console.error("Error connecting to Redis:", err);
  });

export default client;
