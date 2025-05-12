import { useState } from 'react';
import { useSession, getSession } from 'next-auth/react';
import Head from 'next/head';
import { Box, Typography, Paper, Grid, Button, Tabs, Tab, Divider, Chip } from '@mui/material';
import { usePatient, usePatientClaims } from '@/hooks/usePatient';
import DashboardLayout from '@/components/DashboardLayout';
import Link from 'next/link';

function TabPanel(props) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`claims-tabpanel-${index}`}
      aria-labelledby={`claims-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

export default function Claims() {
  const { data: session, status } = useSession();
  const patientId = session?.user?.id;
  const [tabValue, setTabValue] = useState(0);
  
  // Fetch patient data and claims
  const { data: patientData, isLoading: isLoadingPatient } = usePatient(patientId);
  const { data: claimsData, isLoading: isLoadingClaims } = usePatientClaims(patientId);
  
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };
  
  // Mock data for demonstration - replace with actual data from API
  const claims = [
    {
      id: 'HL-12345ABC',
      date: '2025-04-15',
      provider: 'Dr. Sarah Johnson',
      totalAmount: 350.00,
      status: 'pending',
      description: 'Annual physical examination'
    },
    {
      id: 'HL-98765XYZ',
      date: '2025-03-22',
      provider: 'City Medical Lab',
      totalAmount: 175.50,
      status: 'paid',
      description: 'Blood work - Complete panel',
      paidAmount: 150.00,
      paidDate: '2025-04-05'
    },
    {
      id: 'HL-45678DEF',
      date: '2025-02-10',
      provider: 'Downtown Imaging',
      totalAmount: 525.00,
      status: 'denied',
      description: 'MRI - Left knee',
      denialReason: 'Prior authorization required'
    }
  ];
  
  // Filter claims by status for tabs
  const pendingClaims = claims.filter(claim => claim.status === 'pending');
  const paidClaims = claims.filter(claim => claim.status === 'paid');
  const deniedClaims = claims.filter(claim => claim.status === 'denied');
  
  if (status === 'loading' || isLoadingPatient) {
    return <div>Loading...</div>;
  }
  
  return (
    <DashboardLayout>
      <Head>
        <title>Claims - HealthLinc Patient Portal</title>
      </Head>
      
      <Box className="p-6">
        <Box className="mb-6 flex justify-between items-center">
          <Typography variant="h4" component="h1" className="font-display">
            My Claims
          </Typography>
          
          <Link href="/claims/eligibility" passHref>
            <Button 
              variant="contained" 
              color="primary"
              className="bg-primary-500 hover:bg-primary-600"
            >
              Check Eligibility
            </Button>
          </Link>
        </Box>
        
        <Paper className="shadow-sm">
          <Box className="px-4 border-b border-gray-200">
            <Tabs 
              value={tabValue} 
              onChange={handleTabChange}
              variant="fullWidth"
              textColor="primary"
              indicatorColor="primary"
            >
              <Tab label="All Claims" />
              <Tab label={`Pending (${pendingClaims.length})`} />
              <Tab label={`Paid (${paidClaims.length})`} />
              <Tab label={`Denied (${deniedClaims.length})`} />
            </Tabs>
          </Box>
          
          <TabPanel value={tabValue} index={0}>
            {claims.length === 0 ? (
              <Typography className="text-center py-8 text-gray-500">
                No claims found
              </Typography>
            ) : (
              <div className="space-y-4 px-4">
                {claims.map(claim => (
                  <Paper 
                    key={claim.id}
                    variant="outlined"
                    className="p-4 border-gray-200 hover:bg-gray-50 transition-colors"
                  >
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={8}>
                        <Typography variant="subtitle1" className="font-medium">
                          {claim.description}
                        </Typography>
                        <Typography variant="body2" className="text-gray-600 mt-1">
                          {claim.provider} • {new Date(claim.date).toLocaleDateString()}
                        </Typography>
                        <Typography variant="body2" className="text-gray-600 mt-1">
                          Claim ID: {claim.id}
                        </Typography>
                      </Grid>
                      
                      <Grid item xs={12} md={4} className="flex flex-col items-end justify-between">
                        <Box>
                          <Chip 
                            label={claim.status.toUpperCase()}
                            size="small"
                            className={`
                              ${claim.status === 'pending' && 'bg-yellow-100 text-yellow-800'}
                              ${claim.status === 'paid' && 'bg-green-100 text-green-800'}
                              ${claim.status === 'denied' && 'bg-red-100 text-red-800'}
                            `}
                          />
                          
                          <Typography variant="h6" className="mt-2 text-right">
                            ${claim.totalAmount.toFixed(2)}
                          </Typography>
                          
                          {claim.status === 'paid' && (
                            <Typography variant="body2" className="text-green-600 text-right">
                              Paid: ${claim.paidAmount.toFixed(2)}
                            </Typography>
                          )}
                        </Box>
                        
                        <Link href={`/claims/${claim.id}`} passHref>
                          <Button 
                            variant="text" 
                            className="text-primary-500 mt-2"
                            size="small"
                          >
                            View Details
                          </Button>
                        </Link>
                      </Grid>
                      
                      {claim.status === 'denied' && (
                        <Grid item xs={12}>
                          <Typography className="text-red-600 text-sm mt-2">
                            Denial Reason: {claim.denialReason}
                          </Typography>
                        </Grid>
                      )}
                    </Grid>
                  </Paper>
                ))}
              </div>
            )}
          </TabPanel>
          
          <TabPanel value={tabValue} index={1}>
            {pendingClaims.length === 0 ? (
              <Typography className="text-center py-8 text-gray-500">
                No pending claims
              </Typography>
            ) : (
              <div className="space-y-4 px-4">
                {pendingClaims.map(claim => (
                  <Paper 
                    key={claim.id}
                    variant="outlined"
                    className="p-4 border-gray-200 hover:bg-gray-50 transition-colors"
                  >
                    {/* Same structure as above, but only for pending claims */}
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={8}>
                        <Typography variant="subtitle1" className="font-medium">
                          {claim.description}
                        </Typography>
                        <Typography variant="body2" className="text-gray-600 mt-1">
                          {claim.provider} • {new Date(claim.date).toLocaleDateString()}
                        </Typography>
                        <Typography variant="body2" className="text-gray-600 mt-1">
                          Claim ID: {claim.id}
                        </Typography>
                      </Grid>
                      
                      <Grid item xs={12} md={4} className="flex flex-col items-end justify-between">
                        <Box>
                          <Chip 
                            label="PENDING"
                            size="small"
                            className="bg-yellow-100 text-yellow-800"
                          />
                          
                          <Typography variant="h6" className="mt-2 text-right">
                            ${claim.totalAmount.toFixed(2)}
                          </Typography>
                        </Box>
                        
                        <Link href={`/claims/${claim.id}`} passHref>
                          <Button 
                            variant="text" 
                            className="text-primary-500 mt-2"
                            size="small"
                          >
                            View Details
                          </Button>
                        </Link>
                      </Grid>
                    </Grid>
                  </Paper>
                ))}
              </div>
            )}
          </TabPanel>
          
          <TabPanel value={tabValue} index={2}>
            {paidClaims.length === 0 ? (
              <Typography className="text-center py-8 text-gray-500">
                No paid claims
              </Typography>
            ) : (
              <div className="space-y-4 px-4">
                {paidClaims.map(claim => (
                  <Paper 
                    key={claim.id}
                    variant="outlined"
                    className="p-4 border-gray-200 hover:bg-gray-50 transition-colors"
                  >
                    {/* Same structure as above, but only for paid claims */}
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={8}>
                        <Typography variant="subtitle1" className="font-medium">
                          {claim.description}
                        </Typography>
                        <Typography variant="body2" className="text-gray-600 mt-1">
                          {claim.provider} • {new Date(claim.date).toLocaleDateString()}
                        </Typography>
                        <Typography variant="body2" className="text-gray-600 mt-1">
                          Claim ID: {claim.id}
                        </Typography>
                      </Grid>
                      
                      <Grid item xs={12} md={4} className="flex flex-col items-end justify-between">
                        <Box>
                          <Chip 
                            label="PAID"
                            size="small"
                            className="bg-green-100 text-green-800"
                          />
                          
                          <Typography variant="h6" className="mt-2 text-right">
                            ${claim.totalAmount.toFixed(2)}
                          </Typography>
                          
                          <Typography variant="body2" className="text-green-600 text-right">
                            Paid: ${claim.paidAmount.toFixed(2)}
                          </Typography>
                        </Box>
                        
                        <Link href={`/claims/${claim.id}`} passHref>
                          <Button 
                            variant="text" 
                            className="text-primary-500 mt-2"
                            size="small"
                          >
                            View Details
                          </Button>
                        </Link>
                      </Grid>
                    </Grid>
                  </Paper>
                ))}
              </div>
            )}
          </TabPanel>
          
          <TabPanel value={tabValue} index={3}>
            {deniedClaims.length === 0 ? (
              <Typography className="text-center py-8 text-gray-500">
                No denied claims
              </Typography>
            ) : (
              <div className="space-y-4 px-4">
                {deniedClaims.map(claim => (
                  <Paper 
                    key={claim.id}
                    variant="outlined"
                    className="p-4 border-gray-200 hover:bg-gray-50 transition-colors"
                  >
                    {/* Same structure as above, but only for denied claims */}
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={8}>
                        <Typography variant="subtitle1" className="font-medium">
                          {claim.description}
                        </Typography>
                        <Typography variant="body2" className="text-gray-600 mt-1">
                          {claim.provider} • {new Date(claim.date).toLocaleDateString()}
                        </Typography>
                        <Typography variant="body2" className="text-gray-600 mt-1">
                          Claim ID: {claim.id}
                        </Typography>
                      </Grid>
                      
                      <Grid item xs={12} md={4} className="flex flex-col items-end justify-between">
                        <Box>
                          <Chip 
                            label="DENIED"
                            size="small"
                            className="bg-red-100 text-red-800"
                          />
                          
                          <Typography variant="h6" className="mt-2 text-right">
                            ${claim.totalAmount.toFixed(2)}
                          </Typography>
                        </Box>
                        
                        <Box className="flex">
                          <Link href={`/claims/dispute/${claim.id}`} passHref>
                            <Button 
                              variant="outlined"
                              size="small"
                              className="text-red-600 border-red-600 mr-2"
                            >
                              Dispute
                            </Button>
                          </Link>
                          
                          <Link href={`/claims/${claim.id}`} passHref>
                            <Button 
                              variant="text" 
                              className="text-primary-500"
                              size="small"
                            >
                              View Details
                            </Button>
                          </Link>
                        </Box>
                      </Grid>
                      
                      <Grid item xs={12}>
                        <Typography className="text-red-600 text-sm mt-2">
                          Denial Reason: {claim.denialReason}
                        </Typography>
                      </Grid>
                    </Grid>
                  </Paper>
                ))}
              </div>
            )}
          </TabPanel>
        </Paper>
      </Box>
    </DashboardLayout>
  );
}

export async function getServerSideProps(context) {
  const session = await getSession(context);
  
  if (!session) {
    return {
      redirect: {
        destination: '/login',
        permanent: false,
      },
    };
  }
  
  return {
    props: { session },
  };
}
