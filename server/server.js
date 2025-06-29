import cookieParser from "cookie-parser";
import express from "express";
import cors from 'cors';

import connectDB from "./configs/db.js";
import "dotenv/config";
import userRouter from "./routes/userRoute.js";
import sellerRouter from "./routes/sellerRoute.js";
import connectCloudinary from "./configs/cloudinary.js";
import productRouter from "./routes/productRoute.js";
import cartRouter from "./routes/cartRoute.js";
import addressRouter from "./routes/addressRoute.js";
import orderRouter from "./routes/orderRote.js";
import { stripeWebhooks } from "./controllers/orderController.js";
// const express = require('express');
const app = express();
const port = process.env.PORT || 4000;

// ✅ Connect DB and Cloudinary
await connectDB();
await connectCloudinary();

// app.use(cors({
//   origin: ['http://localhost:5173', 'https://groseryweb.vercel.app'],
//   credentials: true
// }));
// ---------------------change code start ------------------------------

// const allowedOrigins = ['http://localhost:5173', 'https://groseryweb.vercel.app'];

const allowedOrigins = ['http://localhost:5173','https://groseryweb.vercel.app'];

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
   optionsSuccessStatus: 200
}));

// --------------------- change code close----------------------------------

//  Stripe webhook must come BEFORE body parsing
app.post('/stripe', express.raw({ type: 'application/json' }), stripeWebhooks);

//  Body & Cookie Parsers
app.use(express.json());
app.use(cookieParser());

//  All Routes
app.get('/', (req, res) => res.send("API is Working"));
app.use('/api/user', userRouter);
app.use('/api/seller', sellerRouter);
app.use('/api/product', productRouter);
app.use('/api/cart', cartRouter);
app.use('/api/address', addressRouter);
app.use('/api/order', orderRouter);

// ✅ Start Server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
