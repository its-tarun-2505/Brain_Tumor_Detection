const express = require('express');
const router = express.Router();
const { transporter, emailTemplates } = require('../nodemailer-config');
const nodemailer = require('nodemailer');

router.post('/send-otp', async (req, res) => {
  try {
    const { email, otp, templateType = 'signup' } = req.body;
    
    console.log(`Sending OTP ${otp} to ${email} using template: ${templateType}`);
    
    // Validate request
    if (!email || !otp) {
      return res.status(400).json({ error: 'Email and OTP are required' });
    }
    
    // Get email template
    const template = emailTemplates[templateType] || emailTemplates.signup;
    const { subject, html } = template(otp);
    
    // Send email
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || '"Brain Tumor Detection" <no-reply@braintumordetection.com>',
      to: email,
      subject: subject,
      html: html
    });
    
    console.log('Message sent: %s', info.messageId);
    
    // For ethereal emails only, provide the preview URL for testing
    if (process.env.EMAIL_SERVICE === 'ethereal') {
      console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
      console.log(`TEST MODE: Email to ${email} with OTP ${otp} would be sent in production`);
    }
    
    // Always log the OTP in development for testing purposes
    if (process.env.NODE_ENV !== 'production') {
      console.log(`OTP for ${email} is ${otp}`);
    }
    
    return res.status(200).json({ 
      message: 'OTP sent successfully',
      // In development or when using ethereal, return the OTP for testing
      testOtp: (process.env.NODE_ENV !== 'production' || process.env.EMAIL_SERVICE === 'ethereal') ? otp : undefined
    });
  } catch (error) {
    console.error('Error sending OTP:', error);
    return res.status(500).json({ error: 'Failed to send OTP' });
  }
});

module.exports = router; 