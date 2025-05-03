import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Button,
  TextField,
  Typography,
  Container,
  Paper,
  Alert,
  Grid,
  Snackbar
} from '@mui/material';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import { useAuth } from '../contexts/AuthContext';
import AnimatedLoader from '../components/AnimatedLoader';

// Motion components
const MotionContainer = motion(Container);
const MotionPaper = motion(Paper);
const MotionBox = motion(Box);

const VerifyOTP = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { verifyOTP, resendOTP } = useAuth();
  
  // Get userId and email from location state
  const [userId, setUserId] = useState('');
  const [email, setEmail] = useState('');
  
  // Debug message for development
  const [devOTP, setDevOTP] = useState('');
  const [showDevOTP, setShowDevOTP] = useState(false);
  
  useEffect(() => {
    // Get user ID from location state
    if (location.state?.userId) {
      setUserId(location.state.userId);
      console.log('UserId from location state:', location.state.userId);
    } else {
      // Try to get from sessionStorage as fallback
      try {
        const pendingVerification = JSON.parse(sessionStorage.getItem('pendingVerification'));
        if (pendingVerification?.userId) {
          setUserId(pendingVerification.userId);
          console.log('UserId from sessionStorage:', pendingVerification.userId);
          
          // Also set email if available
          if (pendingVerification.email && !email) {
            setEmail(pendingVerification.email);
          }
        } else {
          // If no userId in state or sessionStorage, redirect to signup
          toast.error('Missing user ID. Please try signing up again.');
          navigate('/signup');
        }
      } catch (error) {
        console.error('Error retrieving verification data:', error);
        toast.error('Missing user ID. Please try signing up again.');
        navigate('/signup');
      }
    }
    
    // Get email from location state
    if (location.state?.email) {
      setEmail(location.state.email);
      console.log('Email from location state:', location.state.email);
    }
    
    // Show debug message in development
    const urlParams = new URLSearchParams(window.location.search);
    const debug = urlParams.get('debug');
    if (debug === 'true' || process.env.NODE_ENV === 'development') {
      setShowDevOTP(true);
    }
  }, [location.state, navigate, email]);
  
  // OTP input state
  const [otp, setOtp] = useState('');
  
  // UI states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const [otpExpiry, setOtpExpiry] = useState(5 * 60); // 5 minutes in seconds
  
  // Start countdown timer for resend button
  useEffect(() => {
    let timer;
    if (countdown > 0 && !canResend) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    } else {
      setCanResend(true);
    }
    
    return () => clearTimeout(timer);
  }, [countdown, canResend]);
  
  // OTP expiry countdown
  useEffect(() => {
    // Start OTP expiry timer when component mounts or userId changes
    if (userId) {
      setOtpExpiry(5 * 60); // Reset to 5 minutes
      
      const expiryTimer = setInterval(() => {
        setOtpExpiry(prev => {
          if (prev <= 1) {
            clearInterval(expiryTimer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      return () => clearInterval(expiryTimer);
    }
  }, [userId]);
  
  // Format remaining time as MM:SS
  const formatTime = (timeInSeconds) => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = timeInSeconds % 60;
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };
  
  // Handle OTP input change
  const handleOtpChange = (e) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    if (value.length <= 6) {
      setOtp(value);
    }
    
    // Clear error when typing
    if (error) {
      setError('');
    }
  };
  
  // Handle verify OTP
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    
    // Validate OTP
    if (!otp || otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }
    
    if (!userId) {
      setError('User ID is missing. Please try again or contact support.');
      return;
    }
    
    try {
      setLoading(true);
      const result = await verifyOTP(userId, otp);
      
      if (result.success) {
        toast.success('Email verified successfully!');
        navigate('/dashboard', { replace: true });
      } else {
        setError(result.error);
      }
    } catch (err) {
      console.error('OTP verification error:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle resend OTP
  const handleResendOTP = async () => {
    if (!userId) {
      setError('User ID is missing. Please try again.');
      return;
    }
    
    try {
      setLoading(true);
      const result = await resendOTP(userId);
      
      if (result.success) {
        toast.info('A new OTP has been sent to your email');
        setCountdown(30);
        setCanResend(false);
        setOtpExpiry(5 * 60); // Reset expiry timer to 5 minutes
        
        // For development/testing - check console for OTP
        console.log('Check server console for OTP code');
      } else {
        setError(result.error);
      }
    } catch (err) {
      console.error('Resend OTP error:', err);
      setError('Failed to resend OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        when: "beforeChildren",
        staggerChildren: 0.1
      }
    }
  };
  
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4
      }
    }
  };

  return (
    <MotionContainer 
      maxWidth="sm" 
      sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        justifyContent: 'center',
        minHeight: 'calc(100vh - 64px)' 
      }}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <MotionPaper 
        elevation={3} 
        sx={{ p: 4, borderRadius: 2 }}
        variants={itemVariants}
      >
        <Typography variant="h4" component="h1" gutterBottom align="center">
          Verify Your Email
        </Typography>
        
        <Typography variant="body1" paragraph align="center">
          We've sent a 6-digit OTP to your email{email ? ` (${email})` : ''}. 
          Please enter it below to verify your account.
        </Typography>
        
        <Typography 
          variant="body2" 
          color={otpExpiry < 60 ? "error" : "text.secondary"} 
          paragraph 
          align="center"
          sx={{ fontWeight: otpExpiry < 60 ? 'bold' : 'normal' }}
        >
          This OTP will expire in {formatTime(otpExpiry)}
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        <Box component="form" onSubmit={handleVerifyOTP} noValidate>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Enter OTP"
                value={otp}
                onChange={handleOtpChange}
                margin="normal"
                variant="outlined"
                type="text"
                autoComplete="one-time-code"
                autoFocus
                inputProps={{ 
                  inputMode: 'numeric', 
                  pattern: '[0-9]*',
                  maxLength: 6
                }}
                required
                disabled={loading}
              />
            </Grid>
            
            <Grid item xs={12}>
              <Button
                type="submit"
                fullWidth
                variant="contained"
                color="primary"
                disabled={loading || otp.length !== 6 || otpExpiry === 0}
                sx={{ mt: 1 }}
              >
                {loading ? 'Verifying...' : 'Verify OTP'}
              </Button>
            </Grid>
          </Grid>
          
          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Typography variant="body2" display="inline">
              Didn't receive the OTP? 
            </Typography>
            {canResend ? (
              <Button 
                color="primary" 
                onClick={handleResendOTP} 
                sx={{ ml: 1 }}
                disabled={loading}
              >
                Resend
              </Button>
            ) : (
              <Typography variant="body2" color="text.secondary" display="inline" sx={{ ml: 1 }}>
                Resend in {countdown}s
              </Typography>
            )}
          </Box>
          
          {showDevOTP && devOTP && (
            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="body2">
                Development OTP: {devOTP}
              </Typography>
            </Alert>
          )}
        </Box>
      </MotionPaper>
      
      {loading && (
        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
          <AnimatedLoader />
        </Box>
      )}
    </MotionContainer>
  );
};

export default VerifyOTP; 