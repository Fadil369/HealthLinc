import { useState } from 'react';
import { useSession, getSession } from 'next-auth/react';
import Head from 'next/head';
import { Box, Typography, Grid, Card, CardContent, Paper, Button } from '@mui/material';
import { usePatient, usePatientClaims } from '@/hooks/usePatient';
import DashboardLayout from '@/components/DashboardLayout';

export default function Dashboard() {
  const { data: session, status } = useSession();
  const patientId = session?.user?.id;
  
  // Fetch patient data and claims
  const { data: patientData, isLoading: isLoadingPatient } = usePatient(patientId);
  const { data: claimsData, isLoading: isLoadingClaims } = usePatientClaims(patientId);
  
  // Placeholder for recent activity 
  const [recentActivity, setRecentActivity] = useState([
    { 
      id: 1, 
      type: 'appointment', 
      title: 'Annual Checkup', 
      date: '2025-05-20', 
      status: 'scheduled' 
    },
    { 
      id: 2, 
      type: 'claim', 
      title: 'Lab Tests', 
      date: '2025-05-01', 
      status: 'pending' 
    },
    { 
      id: 3, 
      type: 'message', 
      title: 'Message from Dr. Johnson', 
      date: '2025-05-05', 
      status: 'unread' 
    }
  ]);
  
  if (status === 'loading' || isLoadingPatient) {
    return <div>Loading...</div>;
  }
  
  const patientName = patientData?.name?.[0]?.given?.join(' ') + ' ' + patientData?.name?.[0]?.family || 'Patient';
  
  return (
    <DashboardLayout>
      <Head>
        <title>Dashboard - HealthLinc Patient Portal</title>
      </Head>
      
      <Box className="p-6">
        <Typography variant="h4" component="h1" className="mb-6 font-display">
          Welcome, {patientName}
        </Typography>
        
        <Grid container spacing={4}>
          {/* Quick Actions */}
          <Grid item xs={12} lg={4}>
            <Paper className="p-6 h-full shadow-sm">
              <Typography variant="h6" className="font-semibold mb-4">
                Quick Actions
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Button 
                    variant="outlined" 
                    fullWidth
                    className="py-3 text-primary-500 border-primary-500"
                  >
                    Schedule Visit
                  </Button>
                </Grid>
                <Grid item xs={6}>
                  <Button 
                    variant="outlined" 
                    fullWidth
                    className="py-3 text-primary-500 border-primary-500"
                  >
                    Message Provider
                  </Button>
                </Grid>
                <Grid item xs={6}>
                  <Button 
                    variant="outlined"
                    fullWidth
                    className="py-3 text-primary-500 border-primary-500"
                  >
                    View Records
                  </Button>
                </Grid>
                <Grid item xs={6}>
                  <Button 
                    variant="outlined"
                    fullWidth
                    className="py-3 text-primary-500 border-primary-500"
                  >
                    Check Claims
                  </Button>
                </Grid>
              </Grid>
            </Paper>
          </Grid>
          
          {/* Recent Activity */}
          <Grid item xs={12} lg={8}>
            <Paper className="p-6 shadow-sm">
              <Typography variant="h6" className="font-semibold mb-4">
                Recent Activity
              </Typography>
              
              {recentActivity.length === 0 ? (
                <Typography className="text-gray-500 py-4">
                  No recent activity to display
                </Typography>
              ) : (
                <div className="space-y-3">
                  {recentActivity.map(activity => (
                    <Card key={activity.id} variant="outlined" className="border-gray-200">
                      <CardContent className="py-3 px-4">
                        <Grid container alignItems="center">
                          <Grid item xs={7}>
                            <Typography variant="subtitle1" className="font-medium">
                              {activity.title}
                            </Typography>
                            <Typography variant="body2" className="text-gray-600">
                              {new Date(activity.date).toLocaleDateString()}
                            </Typography>
                          </Grid>
                          <Grid item xs={3}>
                            <Typography variant="body2" className={`
                              ${activity.status === 'scheduled' && 'text-blue-600'}
                              ${activity.status === 'pending' && 'text-yellow-600'}
                              ${activity.status === 'unread' && 'text-red-600'}
                              ${activity.status === 'completed' && 'text-green-600'}
                              capitalize
                            `}>
                              {activity.status}
                            </Typography>
                          </Grid>
                          <Grid item xs={2} className="text-right">
                            <Button size="small" className="text-primary-500">
                              View
                            </Button>
                          </Grid>
                        </Grid>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </Paper>
          </Grid>
          
          {/* Upcoming Appointments */}
          <Grid item xs={12} md={6}>
            <Paper className="p-6 shadow-sm">
              <Typography variant="h6" className="font-semibold mb-4">
                Upcoming Appointments
              </Typography>
              
              <Typography className="text-gray-500 py-4">
                No upcoming appointments scheduled
              </Typography>
              
              <Button variant="text" className="text-primary-500 mt-2">
                Schedule New Appointment
              </Button>
            </Paper>
          </Grid>
          
          {/* Claims Summary */}
          <Grid item xs={12} md={6}>
            <Paper className="p-6 shadow-sm h-full">
              <Typography variant="h6" className="font-semibold mb-4">
                Claims Summary
              </Typography>
              
              {isLoadingClaims ? (
                <Typography>Loading claims data...</Typography>
              ) : (
                <>
                  <Grid container spacing={2} className="mb-4">
                    <Grid item xs={4}>
                      <Paper className="p-3 text-center bg-blue-50">
                        <Typography variant="h5" className="font-semibold text-blue-700">
                          {claimsData?.entry?.length || 0}
                        </Typography>
                        <Typography variant="body2" className="text-gray-600">
                          Total Claims
                        </Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={4}>
                      <Paper className="p-3 text-center bg-yellow-50">
                        <Typography variant="h5" className="font-semibold text-yellow-700">
                          {claimsData?.entry?.filter(e => e.resource.status === 'active')?.length || 0}
                        </Typography>
                        <Typography variant="body2" className="text-gray-600">
                          Pending
                        </Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={4}>
                      <Paper className="p-3 text-center bg-green-50">
                        <Typography variant="h5" className="font-semibold text-green-700">
                          {claimsData?.entry?.filter(e => e.resource.status === 'complete')?.length || 0}
                        </Typography>
                        <Typography variant="body2" className="text-gray-600">
                          Completed
                        </Typography>
                      </Paper>
                    </Grid>
                  </Grid>
                  
                  <Button variant="text" className="text-primary-500">
                    View All Claims
                  </Button>
                </>
              )}
            </Paper>
          </Grid>
        </Grid>
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
