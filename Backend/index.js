import dotenv from 'dotenv';
dotenv.config({ quiet: true });
import express from 'express';
import pool from './db/db.js';
import cookieParser from 'cookie-parser';
import authRoutes from "./routes/auth.route.js";
import queueRoutes from "./routes/queue.route.js";
import shopRoutes from "./routes/shop.route.js";
import publicRoutes from "./routes/public.route.js";
import { startNotifier } from './jobs/notifier.js';
import { startCleanup } from './jobs/cleanup.js';
import helmet from 'helmet';
import cors from 'cors';
import { errorHandler, notFound } from './middlewares/error.middleware.js';

const app = express();

// behind a hosting proxy (Render, Railway...) so rate limits see the real client IP
if (process.env.NODE_ENV === 'production') app.set('trust proxy', 1);

app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());

//routes 
app.use('/auth', authRoutes)
app.use('/shops', shopRoutes);
app.use('/queues', queueRoutes);
app.use('/api', publicRoutes);

// connect the database
app.get('/test-db', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM queues');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error In Db', reason: err.message });
  }
});

app.use(notFound);
app.use(errorHandler);

// connect the server
app.listen(process.env.PORT || 3000, () => {
  console.log(`Server is running at port ${process.env.PORT}`);
  startNotifier();
  startCleanup();
})

