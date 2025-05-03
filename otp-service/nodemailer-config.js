const nodemailer = require('nodemailer');
require('dotenv').config();

// Create a transporter object
let transporter;

// Use ethereal for testing or configured service
if (process.env.EMAIL_SERVICE === 'ethereal') {
  // For testing - will log emails to console instead of actually sending them
  transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: {
      user: 'chasity98@ethereal.email',
      pass: 'FHj3zDKvnDpqmScQHn'
    }
  });
} else if (process.env.EMAIL_SERVICE === 'gmail') {
  // Gmail with specific configuration
  transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    },
    tls: {
      rejectUnauthorized: false // Avoid issues with self-signed certificates
    }
  });
} else {
  // For other services
  transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  });
}

// Email templates
const emailTemplates = {
  signup: (otp) => ({
    subject: 'Verify Your Brain Tumor Detection Account',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        <h2 style="color: #4a4a4a; text-align: center;">Welcome to Brain Tumor Detection</h2>
        <p style="color: #666; line-height: 1.5;">Thank you for registering with our Brain Tumor Detection platform. To complete your registration, please use the following OTP code:</p>
        <div style="background-color: #f5f5f5; padding: 15px; text-align: center; border-radius: 4px; margin: 20px 0;">
          <h1 style="color: #3f51b5; letter-spacing: 5px; margin: 0;">${otp}</h1>
        </div>
        <p style="color: #666; line-height: 1.5;">This code will expire in 30 minutes. Please do not share this code with anyone.</p>
        <p style="color: #666; line-height: 1.5;">If you did not request this code, please ignore this email.</p>
        <div style="margin-top: 40px; text-align: center; color: #999; font-size: 12px;">
          <p>&copy; ${new Date().getFullYear()} Brain Tumor Detection. All rights reserved.</p>
        </div>
      </div>
    `
  }),
  
  reset: (otp) => ({
    subject: 'Reset Your Brain Tumor Detection Password',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        <h2 style="color: #4a4a4a; text-align: center;">Password Reset Request</h2>
        <p style="color: #666; line-height: 1.5;">You recently requested to reset your password for your Brain Tumor Detection account. Use the following OTP code to reset your password:</p>
        <div style="background-color: #f5f5f5; padding: 15px; text-align: center; border-radius: 4px; margin: 20px 0;">
          <h1 style="color: #f44336; letter-spacing: 5px; margin: 0;">${otp}</h1>
        </div>
        <p style="color: #666; line-height: 1.5;">This code will expire in 30 minutes. If you did not request a password reset, please ignore this email or contact support if you have concerns.</p>
        <div style="margin-top: 40px; text-align: center; color: #999; font-size: 12px;">
          <p>&copy; ${new Date().getFullYear()} Brain Tumor Detection. All rights reserved.</p>
        </div>
      </div>
    `
  }),
  
  verification: (otp) => ({
    subject: 'Email Verification for Brain Tumor Detection',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        <h2 style="color: #4a4a4a; text-align: center;">Email Verification</h2>
        <p style="color: #666; line-height: 1.5;">Please use the following OTP code to verify your email address:</p>
        <div style="background-color: #f5f5f5; padding: 15px; text-align: center; border-radius: 4px; margin: 20px 0;">
          <h1 style="color: #4caf50; letter-spacing: 5px; margin: 0;">${otp}</h1>
        </div>
        <p style="color: #666; line-height: 1.5;">This code will expire in 30 minutes. Please do not share this code with anyone.</p>
        <p style="color: #666; line-height: 1.5;">If you did not request this code, please ignore this email.</p>
        <div style="margin-top: 40px; text-align: center; color: #999; font-size: 12px;">
          <p>&copy; ${new Date().getFullYear()} Brain Tumor Detection. All rights reserved.</p>
        </div>
      </div>
    `
  })
};

module.exports = { transporter, emailTemplates }; 