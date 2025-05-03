import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, Link as RouterLink, useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Container,
  Grid,
  Typography,
  Paper,
  Tabs,
  Tab,
  Card,
  CardContent,
  CardMedia,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  Button,
  CircularProgress,
  Alert
} from '@mui/material';
import { motion } from 'framer-motion';
import {
  Dashboard as DashboardIcon,
  History as HistoryIcon,
  Person as PersonIcon,
  Timeline as TimelineIcon,
  ChevronRight as ChevronRightIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import AnimatedLoader from '../components/AnimatedLoader';

// Motion components
const MotionContainer = motion(Container);
const MotionPaper = motion(Paper);
const MotionCard = motion(Card);

// Prediction Detail component
const PredictionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Fetch prediction details
  useEffect(() => {
    const fetchPrediction = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`/api/dashboard/predictions/${id}`);
        setPrediction(response.data);
      } catch (err) {
        console.error('Error fetching prediction details:', err);
        setError('Failed to load prediction details');
        toast.error('Failed to load prediction details');
      } finally {
        setLoading(false);
      }
    };
    
    if (id) {
      fetchPrediction();
    }
  }, [id]);
  
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
  
  if (loading) {
    return <AnimatedLoader text="Loading prediction details..." />;
  }
  
  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
        <Button 
          startIcon={<ArrowBackIcon />} 
          variant="outlined" 
          onClick={() => navigate('/dashboard/history')}
        >
          Back to History
        </Button>
      </Box>
    );
  }
  
  if (!prediction) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="info" sx={{ mb: 2 }}>Prediction not found</Alert>
        <Button 
          startIcon={<ArrowBackIcon />} 
          variant="outlined" 
          onClick={() => navigate('/dashboard/history')}
        >
          Back to History
        </Button>
      </Box>
    );
  }
  
  return (
    <Box component={motion.div} variants={containerVariants} initial="hidden" animate="visible">
      <MotionPaper variants={itemVariants} elevation={2} sx={{ p: 3, mb: 4, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5">
            Prediction Details
          </Typography>
          
          <Button 
            startIcon={<ArrowBackIcon />} 
            variant="outlined" 
            onClick={() => navigate('/dashboard/history')}
          >
            Back to History
          </Button>
        </Box>
        
        <Divider sx={{ mb: 3 }} />
        
        <Grid container spacing={4}>
          <Grid item xs={12} md={6}>
            <Card elevation={2}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  MRI Scan Image
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                <Box sx={{ 
                  height: 300, 
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  bgcolor: '#f5f5f5',
                  borderRadius: 1
                }}>
                  <img 
                    src={`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/uploads/${prediction.imageName}`} 
                    alt="MRI Scan" 
                    style={{ 
                      maxWidth: '100%', 
                      maxHeight: '100%',
                      objectFit: 'contain',
                      padding: '8px' 
                    }}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = 'data:image/svg+xml;charset=UTF-8,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"%3E%3Crect width="200" height="200" fill="%23f5f5f5"/%3E%3Cpath d="M75,65 L125,135 M125,65 L75,135" stroke="%23aaa" stroke-width="4"/%3E%3Ccircle cx="100" cy="100" r="50" stroke="%23aaa" stroke-width="3" fill="none"/%3E%3Ctext x="100" y="160" font-family="Arial" font-size="12" text-anchor="middle" fill="%23666"%3EImage not available%3C/text%3E%3C/svg%3E';
                    }}
                  />
                </Box>
                
                <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                  File: {prediction.imageName}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Card elevation={2}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Diagnosis Information
                </Typography>
                <Divider sx={{ mb: 3 }} />
                
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Result
                  </Typography>
                  <Chip
                    label={prediction.result}
                    color={prediction.result === 'Tumor' ? 'error' : 'success'}
                    sx={{ 
                      fontSize: '1rem',
                      py: 2,
                      px: 1
                    }}
                  />
                </Box>
                
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Date & Time
                  </Typography>
                  <Typography variant="body1">
                    {new Date(prediction.timestamp).toLocaleString()}
                  </Typography>
                </Box>
                
                <Alert 
                  severity={prediction.result === 'Tumor' ? 'warning' : 'success'}
                  sx={{ mt: 2 }}
                >
                  {prediction.result === 'Tumor' 
                    ? 'A potential tumor has been detected. Please consult with a healthcare professional for a proper diagnosis.' 
                    : 'No tumor detected. However, please always follow up with a healthcare professional for a comprehensive evaluation.'
                  }
                </Alert>
                
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 3, textAlign: 'center' }}>
                  This prediction is for informational purposes only and should not be considered as medical advice.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </MotionPaper>
    </Box>
  );
};

// Dashboard overview component
const DashboardOverview = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [statistics, setStatistics] = useState(null);
  const [statisticsLoading, setStatisticsLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Fetch statistics
  const fetchStatistics = useCallback(async () => {
    try {
      setStatisticsLoading(true);
      // Add a small delay to ensure token is set properly
      await new Promise(resolve => setTimeout(resolve, 100));
      const response = await axios.get('/api/dashboard/statistics');
      setStatistics(response.data);
    } catch (error) {
      console.error('Error fetching statistics:', error);
      toast.error('Failed to load statistics');
    } finally {
      setStatisticsLoading(false);
    }
  }, []);
  
  useEffect(() => {
    fetchStatistics();
  }, [fetchStatistics]);
  
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
  
  if (statisticsLoading) {
    return <AnimatedLoader text="Loading dashboard..." />;
  }
  
  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }
  
  return (
    <Box component={motion.div} variants={containerVariants} initial="hidden" animate="visible">
      {/* Welcome section */}
      <MotionPaper
        variants={itemVariants}
        elevation={2}
        sx={{ p: 3, mb: 4, borderRadius: 2 }}
      >
        <Typography variant="h5" gutterBottom>
          Welcome back, {currentUser?.firstName || 'User'}!
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Your brain tumor detection dashboard gives you insights into your MRI scan history and results.
        </Typography>
      </MotionPaper>
      
      {/* Statistics cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <MotionCard variants={itemVariants} sx={{ height: '100%' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Total Scans
              </Typography>
              <Typography variant="h3" color="primary">
                {statistics?.totalPredictions || 0}
              </Typography>
            </CardContent>
          </MotionCard>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <MotionCard variants={itemVariants} sx={{ height: '100%' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Tumor Detected
              </Typography>
              <Typography variant="h3" color="error">
                {statistics?.tumorPredictions || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {statistics?.tumorPercentage?.toFixed(1) || 0}% of total
              </Typography>
            </CardContent>
          </MotionCard>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <MotionCard variants={itemVariants} sx={{ height: '100%' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No Tumor
              </Typography>
              <Typography variant="h3" color="success.main">
                {statistics?.noTumorPredictions || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {statistics?.noTumorPercentage?.toFixed(1) || 0}% of total
              </Typography>
            </CardContent>
          </MotionCard>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <MotionCard 
            variants={itemVariants} 
            sx={{ 
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}
          >
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Quick Actions
              </Typography>
              <Button
                variant="contained"
                color="primary"
                fullWidth
                onClick={() => navigate('/predict')}
                sx={{ mb: 1 }}
              >
                New Scan
              </Button>
              <Button
                variant="outlined"
                fullWidth
                onClick={() => navigate('/dashboard/history')}
              >
                View History
              </Button>
            </CardContent>
          </MotionCard>
        </Grid>
      </Grid>
      
      {/* Recent activity */}
      {statistics?.mostRecent && (
        <MotionPaper variants={itemVariants} elevation={2} sx={{ p: 3, mb: 4, borderRadius: 2 }}>
          <Typography variant="h6" gutterBottom>
            Most Recent Scan
          </Typography>
          <Divider sx={{ mb: 2 }} />
          
          <Grid container spacing={3}>
            <Grid item xs={12} sm={4}>
              <Box sx={{ p: 1, border: '1px solid #e0e0e0', borderRadius: 1 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Image:
                </Typography>
                <Typography variant="body1">
                  {statistics.mostRecent.imageName}
                </Typography>
              </Box>
            </Grid>
            
            <Grid item xs={12} sm={4}>
              <Box sx={{ p: 1, border: '1px solid #e0e0e0', borderRadius: 1 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Result:
                </Typography>
                <Chip
                  label={statistics.mostRecent.result}
                  color={statistics.mostRecent.result === 'Tumor' ? 'error' : 'success'}
                  size="small"
                />
              </Box>
            </Grid>
            
            <Grid item xs={12} sm={4}>
              <Box sx={{ p: 1, border: '1px solid #e0e0e0', borderRadius: 1 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Date:
                </Typography>
                <Typography variant="body1">
                  {new Date(statistics.mostRecent.timestamp).toLocaleString()}
                </Typography>
              </Box>
            </Grid>
          </Grid>
          
          <Box sx={{ mt: 2, textAlign: 'right' }}>
            <Button
              endIcon={<ChevronRightIcon />}
              component={RouterLink}
              to={`/dashboard/history/${statistics.mostRecent.id}`}
            >
              View Details
            </Button>
          </Box>
        </MotionPaper>
      )}
    </Box>
  );
};

// Prediction history component - Update to remove confidence column
const PredictionHistory = () => {
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  
  // Fetch prediction history
  useEffect(() => {
    const fetchPredictions = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`/api/dashboard/predictions?page=${page + 1}&limit=${rowsPerPage}`);
        setPredictions(response.data.predictions);
        setTotalCount(response.data.total);
      } catch (err) {
        console.error('Error fetching predictions:', err);
        setError('Failed to load prediction history');
        toast.error('Failed to load prediction history');
      } finally {
        setLoading(false);
      }
    };
    
    fetchPredictions();
  }, [page, rowsPerPage]);
  
  // Handle page change
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };
  
  // Handle rows per page change
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
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
  
  if (loading && predictions.length === 0) {
    return <AnimatedLoader text="Loading prediction history..." />;
  }
  
  return (
    <Box component={motion.div} variants={containerVariants} initial="hidden" animate="visible">
      <MotionPaper variants={itemVariants} elevation={2} sx={{ p: 3, mb: 4, borderRadius: 2 }}>
        <Typography variant="h5" gutterBottom>
          Prediction History
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          View all your previously analyzed MRI scans and their results.
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        {predictions.length === 0 ? (
          <Alert severity="info">
            You haven't performed any predictions yet. Go to the Predict page to analyze an MRI scan.
          </Alert>
        ) : (
          <>
            <TableContainer component={Paper} elevation={0}>
              <Table aria-label="prediction history table">
                <TableHead>
                  <TableRow>
                    <TableCell>Image Name</TableCell>
                    <TableCell align="center">Result</TableCell>
                    <TableCell align="right">Date</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {predictions.map((prediction) => (
                    <TableRow key={prediction.id}>
                      <TableCell component="th" scope="row">
                        {prediction.imageName}
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={prediction.result}
                          color={prediction.result === 'Tumor' ? 'error' : 'success'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="right">
                        {new Date(prediction.timestamp).toLocaleString()}
                      </TableCell>
                      <TableCell align="right">
                        <Button
                          size="small"
                          component={RouterLink}
                          to={`/dashboard/history/${prediction.id}`}
                        >
                          View Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            
            <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={totalCount}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </>
        )}
      </MotionPaper>
    </Box>
  );
};

// Profile component
const Profile = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  
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
  
  // Handle logout
  const handleLogout = () => {
    logout();
    navigate('/');
    toast.success('Logged out successfully');
  };
  
  return (
    <Box component={motion.div} variants={containerVariants} initial="hidden" animate="visible">
      <MotionPaper variants={itemVariants} elevation={2} sx={{ p: 3, mb: 4, borderRadius: 2 }}>
        <Typography variant="h5" gutterBottom>
          My Profile
        </Typography>
        <Divider sx={{ mb: 3 }} />
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                First Name
              </Typography>
              <Typography variant="h6">
                {currentUser?.firstName || 'N/A'}
              </Typography>
            </Box>
            
            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Last Name
              </Typography>
              <Typography variant="h6">
                {currentUser?.lastName || 'N/A'}
              </Typography>
            </Box>
            
            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Email Address
              </Typography>
              <Typography variant="h6">
                {currentUser?.email || 'N/A'}
              </Typography>
            </Box>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Button
                variant="contained"
                color="primary"
                onClick={() => navigate('/predict')}
                fullWidth
              >
                New Prediction
              </Button>
              
              <Button
                variant="outlined"
                color="primary"
                onClick={() => navigate('/dashboard/history')}
                fullWidth
              >
                View History
              </Button>
              
              <Divider sx={{ my: 1 }} />
              
              <Button
                variant="outlined"
                color="error"
                onClick={handleLogout}
                fullWidth
              >
                Logout
              </Button>
            </Box>
          </Grid>
        </Grid>
      </MotionPaper>
    </Box>
  );
};

// Main Dashboard component
const Dashboard = () => {
  const [activeTab, setActiveTab] = useState(0);
  
  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };
  
  // Determine tab from URL
  useEffect(() => {
    const path = window.location.pathname;
    if (path.includes('/dashboard/history')) {
      setActiveTab(1);
    } else if (path.includes('/dashboard/profile')) {
      setActiveTab(2);
    } else {
      setActiveTab(0);
    }
  }, []);
  
  return (
    <Container maxWidth="lg" sx={{ py: 8 }}>
      <Paper elevation={1} sx={{ mb: 4, borderRadius: 2 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="fullWidth"
          indicatorColor="primary"
          textColor="primary"
        >
          <Tab
            icon={<DashboardIcon />}
            label="Overview"
            component={RouterLink}
            to="/dashboard"
          />
          <Tab
            icon={<HistoryIcon />}
            label="History"
            component={RouterLink}
            to="/dashboard/history"
          />
          <Tab
            icon={<PersonIcon />}
            label="Profile"
            component={RouterLink}
            to="/dashboard/profile"
          />
        </Tabs>
      </Paper>
      
      <Routes>
        <Route path="/" element={<DashboardOverview />} />
        <Route path="/history" element={<PredictionHistory />} />
        <Route path="/history/:id" element={<PredictionDetail />} />
        <Route path="/profile" element={<Profile />} />
      </Routes>
    </Container>
  );
};

export default Dashboard; 