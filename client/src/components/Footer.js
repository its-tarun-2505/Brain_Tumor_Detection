import React from 'react';
import { Box, Container, Typography, Grid, Link, IconButton } from '@mui/material';
import FacebookIcon from '@mui/icons-material/Facebook';
import TwitterIcon from '@mui/icons-material/Twitter';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import GitHubIcon from '@mui/icons-material/GitHub';

const Footer = () => {
  return (
    <Box
      sx={{
        bgcolor: 'primary.main',
        color: 'white',
        py: 6,
        mt: 'auto',
      }}
      component="footer"
    >
      <Container maxWidth="lg">
        <Grid container spacing={4}>
          <Grid item xs={12} sm={4}>
            <Typography variant="h6" gutterBottom>
              Brain Tumor Detection
            </Typography>
            <Typography variant="body2" sx={{ mb: 2 }}>
              A powerful tool to detect brain tumors using advanced deep learning algorithms.
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <IconButton color="inherit" aria-label="Facebook">
                <FacebookIcon />
              </IconButton>
              <IconButton color="inherit" aria-label="Twitter">
                <TwitterIcon />
              </IconButton>
              <IconButton color="inherit" aria-label="LinkedIn">
                <LinkedInIcon />
              </IconButton>
              <IconButton color="inherit" aria-label="GitHub">
                <GitHubIcon />
              </IconButton>
            </Box>
          </Grid>
          
          <Grid item xs={12} sm={4}>
            <Typography variant="h6" gutterBottom>
              Quick Links
            </Typography>
            <Typography variant="body2" component="p" gutterBottom>
              <Link href="/" color="inherit" underline="hover">Home</Link>
            </Typography>
            <Typography variant="body2" component="p" gutterBottom>
              <Link href="/predict" color="inherit" underline="hover">Brain Tumor Prediction</Link>
            </Typography>
            <Typography variant="body2" component="p" gutterBottom>
              <Link href="/dashboard" color="inherit" underline="hover">Dashboard</Link>
            </Typography>
          </Grid>
          
          <Grid item xs={12} sm={4}>
            <Typography variant="h6" gutterBottom>
              Contact Us
            </Typography>
            <Typography variant="body2" component="p" gutterBottom>
              Email: info@braintumordetection.com
            </Typography>
            <Typography variant="body2" component="p" gutterBottom>
              Phone: +91 99999 XXXXX
            </Typography>
            <Typography variant="body2" component="p" gutterBottom>
              Address: 123 Medical Plaza, Healthcare City, India
            </Typography>
          </Grid>
        </Grid>
        
        <Box sx={{ pt: 4, textAlign: 'center' }}>
          <Typography variant="body2">
            © {new Date().getFullYear()} Brain Tumor Detection. All rights reserved.
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer; 