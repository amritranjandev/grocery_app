import cookieParser from 'cookie-parser';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connect } from 'mongoose';
import connectDB from './configs/db.js';
import userRouter from './routes/userRoute.js';
import sellerRouter from './routes/sellerRoute.js';
import connectCloudinary from './configs/cloudinary.js';
import productRouter from './routes/productRoute.js';
import cartRouter from './routes/cartRoute.js';
import addressRouter from './routes/addressRoute.js';
import orderRouter from './routes/orderRoute.js';
import { stripeWebhooks } from './controllers/orderController.js';

// load environment variables from .env file
dotenv.config()

const app = express();
const PORT = process.env.PORT || 4000;

console.log("env test: ",process.env.TEST);

// Database connection
await connectDB();
await connectCloudinary();

const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'https://example.com', // Add your production domain here
  'https://grocery-app-frontend-alpha.vercel.app',
];

app.post('/stripe', express.raw({type: 'application/json'}), stripeWebhooks)


// Middleware configuration
app.use(express.json());
app.use(cookieParser());
app.use(cors({ origin: allowedOrigins, credentials: true }));

app.get('/', (req, res) => {
  res.send('Hello World!');
});
app.use('/api/user', userRouter)
app.use('/api/seller', sellerRouter)
app.use('/api/product', productRouter)
app.use('/api/cart', cartRouter)
app.use('/api/address', addressRouter)
app.use('/api/order', orderRouter)

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
