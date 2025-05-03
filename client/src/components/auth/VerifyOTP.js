import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../../config/api';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  CircularProgress,
  Alert
} from '@mui/material';

const VerifyOTP = () => {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const userId = location.state?.userId;
  const email = location.state?.email;

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!userId) {
      setError('User ID is missing. Please go back to signup.');
      return;
    }

    if (!otp) {
      setError('Please enter OTP code');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/verify-otp`, {
        userId,
        otp
      });

      setSuccess('Email verified successfully!');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (error) {
      setError(error.response?.data?.error || 'OTP verification failed. Please try again.');
      console.error('OTP verification error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (!userId || !email) {
      setError('User information is missing. Please go back to signup.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/resend-otp`, {
        userId,
        email
      });
      
      setSuccess('OTP has been resent to your email');
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to resend OTP');
      console.error('Resend OTP error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Paper elevation={3} sx={{ p: 4, mt: 8 }}>
        <Typography variant="h5" component="h1" gutterBottom align="center">
          Verify Your Email
        </Typography>
        
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
        
        <Typography variant="body1" sx={{ mb: 3 }}>
          We've sent a verification code to your email. Please enter it below to verify your account.
        </Typography>
        
        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="OTP Code"
            variant="outlined"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            margin="normal"
            disabled={loading}
          />
          
          <Box sx={{ mt: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Verify OTP'}
            </Button>
            
            <Button
              variant="text"
              color="primary"
              onClick={handleResendOTP}
              disabled={loading}
            >
              Resend OTP
            </Button>
          </Box>
        </form>
      </Paper>
    </Container>
  );
};

export default VerifyOTP; 