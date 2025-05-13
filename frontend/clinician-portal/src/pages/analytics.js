import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  CircularProgress,
  Card,
  CardContent,
  CardHeader,
  Divider
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { format, subMonths } from 'date-fns';
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import axios from 'axios';

import ClinicianLayout from '../components/ClinicianLayout';

// Custom colors for charts
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d'];

export default function Analytics() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    startDate: subMonths(new Date(), 6), // Default: 6 months ago
    endDate: new Date(),
  });
  const [grouping, setGrouping] = useState('month'); // day, week, month
  const [demographicData, setDemographicData] = useState({ gender: [], age: [] });
  const [trendsData, setTrendsData] = useState([]);
  const [clinicalData, setClinicalData] = useState({ diagnoses: [] });
  
  // If not authenticated, redirect to login
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);
  
  // Fetch data when component mounts or filters change
  useEffect(() => {
    const fetchData = async () => {
      if (status !== 'authenticated') return;
      
      setLoading(true);
      try {
        // Fetch demographic data
        const demographicsResponse = await axios.post('/api/fhir/analytics/demographics', {}, {
          headers: {
            'Authorization': `Bearer ${session.user.accessToken}`
          }
        });
        
        // Format gender data for pie chart
        const genderData = demographicsResponse.data.data.gender_distribution.map(item => ({
          name: item._id === 'male' ? 'Male' : item._id === 'female' ? 'Female' : item._id,
          value: item.count
        }));
        
        // Format age data for bar chart
        const ageData = demographicsResponse.data.data.age_distribution.map(item => {
          let label;
          if (item._id === '0-18') label = 'Under 18';
          else if (item._id === '18-30') label = '18-30';
          else if (item._id === '30-45') label = '30-45';
          else if (item._id === '45-65') label = '45-65';
          else if (item._id === '65-80') label = '65-80';
          else if (item._id === '80+') label = 'Over 80';
          else label = 'Unknown';
          
          return {
            age: label,
            count: item.count
          };
        });
        
        setDemographicData({
          gender: genderData,
          age: ageData
        });
        
        // Fetch patient trends
        const trendsResponse = await axios.post('/api/fhir/analytics/trends', {
          time_frame: {
            start_date: format(dateRange.startDate, 'yyyy-MM-dd'),
            end_date: format(dateRange.endDate, 'yyyy-MM-dd'),
            grouping
          }
        }, {
          headers: {
            'Authorization': `Bearer ${session.user.accessToken}`
          }
        });
        
        // Format trends data for line chart
        const formattedTrendsData = trendsResponse.data.data.trends.map(item => ({
          date: item._id,
          patients: item.count
        }));
        
        setTrendsData(formattedTrendsData);
        
        // Fetch clinical data
        const clinicalResponse = await axios.post('/api/fhir/analytics/clinical', {
          time_frame: {
            start_date: format(dateRange.startDate, 'yyyy-MM-dd'),
            end_date: format(dateRange.endDate, 'yyyy-MM-dd'),
            grouping
          }
        }, {
          headers: {
            'Authorization': `Bearer ${session.user.accessToken}`
          }
        });
        
        // Format clinical data for charts
        const diagnosesData = clinicalResponse.data.data.top_diagnoses.map(item => ({
          name: item.display || item._id,
          value: item.count
        }));
        
        setClinicalData({
          diagnoses: diagnosesData
        });
        
      } catch (error) {
        console.error('Failed to fetch analytics data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [status, session, dateRange, grouping]);
  
  const handleApplyFilters = () => {
    // The useEffect will handle the fetching when dateRange or grouping change
  };
  
  // Display loading state
  if (status === 'loading' || loading) {
    return (
      <ClinicianLayout>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <CircularProgress />
        </Box>
      </ClinicianLayout>
    );
  }
  
  return (
    <ClinicianLayout>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Clinical Analytics Dashboard
        </Typography>
        
        {/* Filters */}
        <Paper sx={{ p: 3, mb: 4 }}>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={4}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="Start Date"
                  value={dateRange.startDate}
                  onChange={(date) => setDateRange(prev => ({ ...prev, startDate: date }))}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                />
              </LocalizationProvider>
            </Grid>
            <Grid item xs={12} md={4}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="End Date"
                  value={dateRange.endDate}
                  onChange={(date) => setDateRange(prev => ({ ...prev, endDate: date }))}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                />
              </LocalizationProvider>
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Group By</InputLabel>
                <Select
                  value={grouping}
                  label="Group By"
                  onChange={(e) => setGrouping(e.target.value)}
                >
                  <MenuItem value="day">Day</MenuItem>
                  <MenuItem value="week">Week</MenuItem>
                  <MenuItem value="month">Month</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={1}>
              <Button 
                variant="contained" 
                fullWidth 
                onClick={handleApplyFilters}
              >
                Apply
              </Button>
            </Grid>
          </Grid>
        </Paper>
        
        {/* Patient Demographics */}
        <Typography variant="h5" component="h2" gutterBottom sx={{ mt: 4 }}>
          Patient Demographics
        </Typography>
        <Grid container spacing={3}>
          {/* Gender Distribution */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardHeader title="Gender Distribution" />
              <Divider />
              <CardContent>
                <Box sx={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={demographicData.gender}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label
                      >
                        {demographicData.gender.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          {/* Age Distribution */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardHeader title="Age Distribution" />
              <Divider />
              <CardContent>
                <Box sx={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={demographicData.age}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="age" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="count" name="Patients" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
        
        {/* Patient Trends */}
        <Typography variant="h5" component="h2" gutterBottom sx={{ mt: 4 }}>
          Patient Registration Trends
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card>
              <CardHeader title="New Patient Registrations" />
              <Divider />
              <CardContent>
                <Box sx={{ height: 400 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={trendsData}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="patients" 
                        name="New Patients"
                        stroke="#82ca9d" 
                        activeDot={{ r: 8 }} 
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
        
        {/* Clinical Metrics */}
        <Typography variant="h5" component="h2" gutterBottom sx={{ mt: 4 }}>
          Clinical Metrics
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardHeader title="Top Diagnoses" />
              <Divider />
              <CardContent>
                <Box sx={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={clinicalData.diagnoses}
                      layout="vertical"
                      margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis type="category" dataKey="name" width={90} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="value" name="Cases" fill="#0088FE" />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          {/* Placeholder for additional clinical metrics */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardHeader title="Clinical Outcomes" />
              <Divider />
              <CardContent>
                <Box sx={{ height: 300, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  <Typography variant="body1" color="text.secondary">
                    Advanced metrics coming soon
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </ClinicianLayout>
  );
}

// Server-side authentication check
export async function getServerSideProps(context) {
  return {
    props: {}
  };
}
