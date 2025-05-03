import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Divider
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import GroupIcon from '@mui/icons-material/Group';
import AssessmentIcon from '@mui/icons-material/Assessment';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import { motion } from 'framer-motion';
import axios from 'axios';

// Custom motion components
const MotionBox = motion(Box);
const MotionGrid = motion(Grid);
const MotionCard = motion(Card);

const StatisticsSection = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalVisitors: 0,
    totalPredictions: 0,
    tumorPredictions: 0,
    noTumorPredictions: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Record visitor - once per browser session with additional safeguards
    const recordVisit = async () => {
      try {
        // Generate a unique session ID if not already present
        let sessionId = sessionStorage.getItem('btd_session_id');
        if (!sessionId) {
          sessionId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
          sessionStorage.setItem('btd_session_id', sessionId);
        }

        // Check if user has already been recorded in this browser session
        const hasVisitedThisSession = sessionStorage.getItem('btd_visited_session');
        
        // If not visited in this session, record the visit
        if (!hasVisitedThisSession) {
          console.log('Recording new visit with session ID:', sessionId);
          
          const response = await axios.post('/api/record-visitor', {
            userAgent: navigator.userAgent,
            sessionId: sessionId // Pass the session ID to prevent server-side duplication
          });
          
          // Mark that this session has been counted
          sessionStorage.setItem('btd_visited_session', 'true');
          
          console.log('Visit recorded successfully:', response.data);
        } else {
          console.log('Visit already recorded for this session');
        }
      } catch (err) {
        console.error('Failed to record visit:', err);
      }
    };

    // Fetch statistics
    const fetchStats = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/api/dashboard/public-statistics');
        console.log('Received statistics:', response.data);
        setStats(response.data);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch statistics:', err);
        setError('Failed to load statistics. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    // Execute the visit recording and stats fetching as separate operations
    const initialize = async () => {
      await recordVisit();
      await fetchStats();
    };
    
    initialize();

    // Refresh stats every 5 minutes
    const intervalId = setInterval(fetchStats, 5 * 60 * 1000);
    
    return () => clearInterval(intervalId);
  }, []);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delayChildren: 0.2,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.4,
        ease: "easeOut"
      }
    }
  };

  // Stat cards data
  const statCards = [
    {
      title: "Registered Users",
      value: stats.totalUsers,
      icon: <PersonIcon fontSize="large" color="primary" />,
      description: "Total number of registered users"
    },
    {
      title: "Total Visitors",
      value: stats.totalVisitors,
      icon: <GroupIcon fontSize="large" color="primary" />,
      description: "Number of visitors to our platform"
    },
    {
      title: "Total Predictions",
      value: stats.totalPredictions,
      icon: <AssessmentIcon fontSize="large" color="primary" />,
      description: "MRI scans analyzed by our system"
    },
    {
      title: "Tumor Detected",
      value: stats.tumorPredictions,
      icon: <CancelIcon fontSize="large" color="error" />,
      description: "Cases where tumors were detected"
    },
    {
      title: "No Tumor",
      value: stats.noTumorPredictions,
      icon: <CheckCircleIcon fontSize="large" color="success" />,
      description: "Cases where no tumors were found"
    }
  ];

  if (loading) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <CircularProgress />
        <Typography variant="body1" sx={{ mt: 2 }}>
          Loading statistics...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="body1" color="error">
          {error}
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ py: 8 }}>
      <Typography 
        variant="h3" 
        align="center" 
        gutterBottom
        component={motion.div}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        Platform Statistics
      </Typography>
      
      <Typography 
        variant="h6" 
        color="text.secondary" 
        align="center" 
        sx={{ mb: 6 }}
        component={motion.div}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        Real-time insights into our platform's usage and detection results
      </Typography>
      
      <MotionGrid 
        container 
        spacing={3} 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {statCards.map((card, index) => (
          <Grid item xs={12} sm={6} md={4} lg={2.4} key={index}>
            <MotionCard 
              variants={itemVariants}
              sx={{ 
                height: '100%',
                transition: '0.3s',
                '&:hover': {
                  transform: 'translateY(-5px)',
                  boxShadow: 3
                }
              }}
            >
              <CardContent sx={{ textAlign: 'center' }}>
                <Box sx={{ mb: 2 }}>
                  {card.icon}
                </Box>
                <Typography variant="h4" component="div" gutterBottom>
                  {card.value.toLocaleString()}
                </Typography>
                <Typography variant="h6" gutterBottom>
                  {card.title}
                </Typography>
                <Divider sx={{ my: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  {card.description}
                </Typography>
              </CardContent>
            </MotionCard>
          </Grid>
        ))}
      </MotionGrid>
    </Box>
  );
};

export default StatisticsSection; 