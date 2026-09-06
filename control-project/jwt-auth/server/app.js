const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const router = require('./router/index.js');
const errorMiddleware = require('./middlewares/error-middleware.js');

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(cors({
    credentials: true,
    origin: process.env.CLIENT_URL || 'http://localhost:5173'
}));

app.use('/api', router);
app.use(errorMiddleware);

// Кэшируем подключение между вызовами (важно для serverless)
let isConnected = false;
async function connectDB() {
    if (isConnected || mongoose.connection.readyState === 1) return;
    await mongoose.connect(process.env.DB_URL);
    isConnected = true;
    console.log('Успешное подключение к БД MongoDB');
}

module.exports = { app, connectDB };