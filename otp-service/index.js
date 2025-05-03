const express = require('express');
const cors = require('cors');
require('dotenv').config();
const sendOtpRoute = require('./routes/sendOtp');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api', sendOtpRoute);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy' });
});

// Start server
app.listen(PORT, () => {
  console.log(`OTP service running on port ${PORT}`);
}); 