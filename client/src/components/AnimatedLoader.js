import React from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import { motion } from 'framer-motion';

const AnimatedLoader = ({ text = 'Loading...' }) => {
  // Animation variants
  const containerVariants = {
    initial: { opacity: 0 },
    animate: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.3
      }
    }
  };
  
  const itemVariants = {
    initial: { y: 20, opacity: 0 },
    animate: { 
      y: 0, 
      opacity: 1,
      transition: { 
        duration: 0.8, 
        ease: "easeOut" 
      }
    }
  };
  
  const pulseVariants = {
    initial: { scale: 0.8, opacity: 0.5 },
    animate: { 
      scale: 1.1, 
      opacity: 1,
      transition: { 
        duration: 1, 
        repeat: Infinity, 
        repeatType: "reverse" 
      }
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '200px',
        p: 4,
      }}
      component={motion.div}
      variants={containerVariants}
      initial="initial"
      animate="animate"
    >
      <motion.div variants={pulseVariants}>
        <CircularProgress size={80} thickness={4} color="primary" />
      </motion.div>
      
      <motion.div variants={itemVariants}>
        <Typography 
          variant="h6" 
          sx={{ mt: 3, mb: 1, fontWeight: 500 }}
          component={motion.h6}
        >
          {text}
        </Typography>
      </motion.div>
      
      <motion.div variants={itemVariants}>
        <Typography 
          variant="body2" 
          color="text.secondary" 
          align="center"
          component={motion.p}
        >
          Please wait while we process your request
        </Typography>
      </motion.div>
    </Box>
  );
};

export default AnimatedLoader; 