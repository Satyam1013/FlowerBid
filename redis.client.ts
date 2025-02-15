import { createClient } from 'redis';
import dotenv from 'dotenv';
dotenv.config();

const client = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
});

client.on('error', (err: Error) => {
  console.error('Redis error:', err);
});

client.connect()
  .then(() => {
    console.log('Connected to Redis');
  })
  .catch((err: Error) => {
    console.error('Error connecting to Redis:', err);
  });

export default client;
