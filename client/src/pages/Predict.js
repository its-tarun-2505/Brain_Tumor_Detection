import React, { useState, useRef } from 'react';
import {
  Box,
  Button,
  Container,
  Typography,
  Paper,
  Grid,
  CircularProgress,
  Alert,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Divider,
  Card,
  CardMedia,
  Chip
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import { toast } from 'react-toastify';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import AnimatedLoader from '../components/AnimatedLoader';

// Motion components
const MotionContainer = motion(Container);
const MotionPaper = motion(Paper);
const MotionBox = motion(Box);

const Predict = () => {
  const fileInputRef = useRef(null);
  const { isAuthenticated } = useAuth();
  
  // States
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [showResult, setShowResult] = useState(false);
  
  // Handle file selection
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    
    // Reset states
    setError('');
    setResult(null);
    
    // Validate file
    if (!file) {
      return;
    }
    
    // Check file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      setError('Please upload a valid image file (JPG or PNG)');
      return;
    }
    
    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('File size should be less than 5MB');
      return;
    }
    
    // Set selected file
    setSelectedFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };
  
  // Handle file drop
  const handleDrop = (e) => {
    e.preventDefault();
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      // Simulate file input change event
      const dummyEvent = { target: { files: [file] } };
      handleFileChange(dummyEvent);
    }
  };
  
  // Handle drag events
  const handleDragOver = (e) => {
    e.preventDefault();
  };
  
  // Handle predict
  const handlePredict = async () => {
    if (!selectedFile) {
      setError('Please select an image to predict');
      return;
    }
    
    try {
      setLoading(true);
      
      // Create form data
      const formData = new FormData();
      formData.append('image', selectedFile);
      
      // Determine endpoint based on authentication status
      const endpoint = isAuthenticated 
        ? '/api/predict/authenticated' 
        : '/api/predict';
      
      // Send request
      const response = await axios.post(endpoint, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      // Set result
      setResult(response.data);
      setShowResult(true);
      
      // Show toast
      toast.success('Prediction completed successfully!');
      
    } catch (err) {
      console.error('Prediction error:', err);
      setError(err.response?.data?.error || 'Failed to process image. Please try again.');
      toast.error('Prediction failed!');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle result dialog close
  const handleCloseResult = () => {
    setShowResult(false);
  };
  
  // Reset all states
  const handleReset = () => {
    setSelectedFile(null);
    setPreview('');
    setError('');
    setResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        when: "beforeChildren",
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
        duration: 0.4
      }
    }
  };
  
  const dropzoneVariants = {
    hover: { 
      scale: 1.02, 
      boxShadow: "0px 8px 15px rgba(0, 0, 0, 0.1)", 
      borderColor: '#3f51b5' 
    }
  };

  return (
    <MotionContainer 
      maxWidth="md" 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      sx={{ my: 8 }}
    >
      <MotionBox variants={itemVariants}>
        <Typography variant="h3" component="h1" align="center" gutterBottom>
          Brain Tumor Detection
        </Typography>
        <Typography variant="h6" align="center" color="text.secondary" paragraph>
          Upload an MRI scan image to detect the presence of a brain tumor
        </Typography>
        
        {!isAuthenticated && (
          <Alert severity="info" sx={{ mt: 2, mb: 2 }}>
            You're using the system as a guest. 
            {/* Your prediction will be counted in our statistics, but to save your results and build a history, please <Button color="primary" size="small" onClick={() => window.location.href = '/signup'}>sign up</Button> or <Button color="primary" size="small" onClick={() => window.location.href = '/login'}>log in</Button>. */}
          </Alert>
        )}
      </MotionBox>
      
      <MotionPaper
        variants={itemVariants}
        elevation={3}
        sx={{
          p: 4,
          mt: 4,
          borderRadius: 2
        }}
      >
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        <Grid container spacing={4}>
          {/* Upload area */}
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>
              Upload MRI Image
            </Typography>
            
            <MotionBox
              component={motion.div}
              variants={dropzoneVariants}
              whileHover="hover"
              sx={{
                border: '2px dashed #ccc',
                borderRadius: 2,
                p: 3,
                textAlign: 'center',
                cursor: 'pointer',
                height: 250,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                transition: 'all 0.3s ease'
              }}
              onClick={() => fileInputRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                style={{ display: 'none' }}
                accept="image/jpeg, image/jpg, image/png"
              />
              
              <CloudUploadIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
              
              <Typography variant="body1" gutterBottom>
                Drag & drop an MRI image here, or click to select
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Supported formats: JPG, PNG
              </Typography>
            </MotionBox>
            
            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center', gap: 2 }}>
              <Button
                variant="contained"
                color="primary"
                onClick={handlePredict}
                disabled={!selectedFile || loading}
                sx={{ minWidth: 120 }}
              >
                {loading ? <CircularProgress size={24} /> : 'Predict'}
              </Button>
              
              <Button
                variant="outlined"
                onClick={handleReset}
                disabled={!selectedFile || loading}
              >
                Reset
              </Button>
            </Box>
          </Grid>
          
          {/* Preview area */}
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>
              Image Preview
            </Typography>
            
            <Box
              sx={{
                border: '1px solid #e0e0e0',
                borderRadius: 2,
                height: 250,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                overflow: 'hidden',
                bgcolor: '#f5f5f5'
              }}
            >
              {preview ? (
                <img
                  src={preview}
                  alt="MRI Preview"
                  style={{
                    maxWidth: '100%',
                    maxHeight: '100%',
                    objectFit: 'contain'
                  }}
                />
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No image selected
                </Typography>
              )}
            </Box>
            
            {selectedFile && (
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                File: {selectedFile.name} ({Math.round(selectedFile.size / 1024)} KB)
              </Typography>
            )}
          </Grid>
        </Grid>
      </MotionPaper>
      
      {/* Information about authentication */}
      {!isAuthenticated && (
        <MotionBox variants={itemVariants} sx={{ mt: 4 }}>
          <Alert severity="info">
            <Typography variant="body1">
              <strong>Sign in to save your prediction results!</strong> Create an account to keep track of your prediction history.
            </Typography>
          </Alert>
        </MotionBox>
      )}
      
      {/* Result Dialog */}
      <Dialog 
        open={showResult} 
        onClose={handleCloseResult}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ m: 0, p: 2 }}>
          Prediction Result
          <IconButton
            aria-label="close"
            onClick={handleCloseResult}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: (theme) => theme.palette.grey[500],
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        
        <Divider />
        
        <DialogContent>
          {result && (
            <AnimatePresence>
              <MotionBox
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
              >
                <Grid container spacing={3} alignItems="center">
                  <Grid item xs={12} sm={6}>
                    <Card elevation={0}>
                      <CardMedia
                        component="img"
                        image={preview}
                        alt="MRI Scan"
                        sx={{ 
                          height: 200, 
                          objectFit: 'contain',
                          border: '1px solid #e0e0e0',
                          borderRadius: 1
                        }}
                      />
                    </Card>
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h6" gutterBottom>
                        Diagnosis:
                      </Typography>
                      
                      <Chip
                        icon={result.result === 'Tumor' ? <CancelIcon /> : <CheckCircleIcon />}
                        label={result.result}
                        color={result.result === 'Tumor' ? 'error' : 'success'}
                        sx={{ 
                          fontSize: '1.2rem', 
                          py: 3, 
                          px: 2,
                          borderRadius: 2
                        }}
                      />
                    </Box>
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Alert 
                      severity={result.result === 'Tumor' ? 'warning' : 'success'}
                      sx={{ mt: 2 }}
                    >
                      {result.result === 'Tumor' 
                        ? 'A potential tumor has been detected. Please consult with a healthcare professional for a proper diagnosis.' 
                        : 'No tumor detected. However, please always follow up with a healthcare professional for a comprehensive evaluation.'
                      }
                    </Alert>
                  </Grid>
                  
                  <Grid item xs={12} sx={{ textAlign: 'center', mt: 2 }}>
                    <Typography variant="caption" color="text.secondary">
                      This prediction is for informational purposes only and should not be considered as medical advice.
                    </Typography>
                  </Grid>
                </Grid>
              </MotionBox>
            </AnimatePresence>
          )}
        </DialogContent>
      </Dialog>
      
      {loading && <AnimatedLoader text="Analyzing MRI scan..." />}
    </MotionContainer>
  );
};

export default Predict; 