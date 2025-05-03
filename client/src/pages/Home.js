import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  Grid,
  Typography,
  Card,
  CardContent,
  CardMedia,
  Stack
} from '@mui/material';
import { motion } from 'framer-motion';
import UploadIcon from '@mui/icons-material/Upload';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import HowToRegIcon from '@mui/icons-material/HowToReg';
import { useAuth } from '../contexts/AuthContext';
import StatisticsSection from '../components/StatisticsSection';

// Custom motion components
const MotionContainer = motion(Container);
const MotionTypography = motion(Typography);
const MotionBox = motion(Box);
const MotionGrid = motion(Grid);
const MotionCard = motion(Card);

const Home = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delayChildren: 0.3,
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5,
        ease: "easeOut"
      }
    }
  };

  // Neural animation background
  const neuralBackgroundStyle = {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.05,
    backgroundImage: 'url(https://www.transparenttextures.com/patterns/cubes.png)',
    backgroundSize: 'cover',
    zIndex: -1,
  };

  // Feature cards
  const features = [
    {
      title: 'Deep Learning Powered',
      description: 'Our application uses state-of-the-art deep learning models to detect brain tumors with high accuracy.',
      image: 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60'
    },
    {
      title: 'Secure & Private',
      description: 'Your MRI scans and medical data are kept secure with our advanced encryption and privacy measures.',
      image: 'https://images.unsplash.com/photo-1576444356170-66073046b1bc?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60'
    },
    {
      title: 'Quick Results',
      description: 'Get instant predictions on your MRI scans, helping you to seek appropriate medical attention quickly.',
      image: 'https://images.unsplash.com/photo-1551076805-e1869033e561?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60'
    }
  ];

  return (
    <Box sx={{ position: 'relative', overflow: 'hidden', py: 8 }}>
      {/* Neural network background animation */}
      <Box sx={neuralBackgroundStyle} />
      
      {/* Hero section */}
      <MotionContainer
        maxWidth="lg"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <MotionGrid container spacing={6} alignItems="center" sx={{ mb: 12 }}>
          <Grid item xs={12} md={6}>
            <MotionTypography
              variant="h2"
              component="h1"
              gutterBottom
              variants={itemVariants}
              sx={{ fontWeight: 700 }}
            >
              Brain Tumor Detection Using AI
            </MotionTypography>
            
            <MotionTypography
              variant="h5"
              color="text.secondary"
              paragraph
              variants={itemVariants}
            >
              Upload your MRI scan and get instant predictions powered by deep learning technology.
              Early detection can save lives.
            </MotionTypography>
            
            <MotionBox variants={itemVariants} sx={{ mt: 4 }}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <Button 
                  variant="contained" 
                  color="primary" 
                  size="large"
                  onClick={() => navigate('/predict')}
                  startIcon={<UploadIcon />}
                >
                  Try Prediction
                </Button>
                
                {!isAuthenticated && (
                  <Button 
                    variant="outlined" 
                    color="primary"
                    size="large"
                    onClick={() => navigate('/signup')}
                    startIcon={<HowToRegIcon />}
                  >
                    Sign Up
                  </Button>
                )}
                
                {!isAuthenticated && (
                  <Button 
                    variant="text" 
                    color="primary"
                    size="large"
                    onClick={() => navigate('/login')}
                    startIcon={<AccountCircleIcon />}
                  >
                    Login
                  </Button>
                )}
              </Stack>
            </MotionBox>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <MotionBox
              component="img"
              sx={{
                width: '100%',
                borderRadius: 4,
                boxShadow: 6,
              }}
              src="https://images.unsplash.com/photo-1559757175-5700dde675bc?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80"
              alt="Brain MRI Scan"
              variants={itemVariants}
            />
          </Grid>
        </MotionGrid>

        {/* Features section */}
        <MotionTypography
          variant="h3"
          align="center"
          sx={{ mb: 6 }}
          variants={itemVariants}
        >
          Key Features
        </MotionTypography>
        
        <MotionGrid container spacing={4} variants={containerVariants}>
          {features.map((feature, index) => (
            <Grid item xs={12} md={4} key={index}>
              <MotionCard
                variants={itemVariants}
                sx={{ 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column',
                  transition: '0.3s',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: 6
                  }
                }}
              >
                <CardMedia
                  component="img"
                  height="200"
                  image={feature.image}
                  alt={feature.title}
                />
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography gutterBottom variant="h5" component="h2">
                    {feature.title}
                  </Typography>
                  <Typography>
                    {feature.description}
                  </Typography>
                </CardContent>
              </MotionCard>
            </Grid>
          ))}
        </MotionGrid>

        {/* Statistics Section */}
        <Box sx={{ mt: 12 }}>
          <StatisticsSection />
        </Box>

        {/* Call to action */}
        <MotionBox
          sx={{
            bgcolor: 'primary.main',
            color: 'white',
            py: 8,
            px: 4,
            mt: 12,
            borderRadius: 4,
            textAlign: 'center'
          }}
          variants={itemVariants}
        >
          <Typography variant="h4" component="h2" gutterBottom>
            Ready to get started?
          </Typography>
          <Typography variant="body1" paragraph sx={{ mb: 4 }}>
            Upload your MRI scan now and receive instant predictions.
          </Typography>
          <Button
            variant="contained"
            color="secondary"
            size="large"
            onClick={() => navigate('/predict')}
            sx={{ px: 4, py: 1 }}
          >
            Start Prediction
          </Button>
        </MotionBox>
      </MotionContainer>
    </Box>
  );
};

export default Home; 