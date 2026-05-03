import express from 'express';
import path from 'path';
import dotenv from 'dotenv';

// Load .env from the backend folder
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const app = express();
app.use(express.json());

app.get('/', (_req, res) => {
  res.send('game-backend: ok');
});

const port = process.env.PORT || 4000;
app.listen(Number(port), () => {
  // eslint-disable-next-line no-console
  console.log(`game-backend listening on ${port}`);
});
