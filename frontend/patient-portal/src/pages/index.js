import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { Box, Button, Typography, Container } from '@mui/material';

export default function Home() {
  const router = useRouter();
  
  useEffect(() => {
    // Redirect to dashboard if already logged in
    const token = localStorage.getItem('healthlinc-auth-token');
    if (token) {
      router.push('/dashboard');
    }
  }, [router]);
  
  return (
    <>
      <Head>
        <title>HealthLinc - Patient Portal</title>
        <meta name="description" content="Access your healthcare records, claims, and more with the HealthLinc patient portal." />
      </Head>
      
      <Box 
        component="main" 
        className="min-h-screen flex flex-col bg-gradient-to-b from-white to-primary-50"
      >
        {/* Header */}
        <Box className="bg-white shadow-sm">
          <Container maxWidth="lg">
            <Box className="flex justify-between items-center py-4">
              <Typography variant="h5" component="h1" className="font-display font-bold text-primary-600">
                HealthLinc
              </Typography>
              
              <Link href="/login" passHref>
                <Button 
                  variant="contained" 
                  color="primary" 
                  className="bg-primary-500 hover:bg-primary-600"
                >
                  Sign In
                </Button>
              </Link>
            </Box>
          </Container>
        </Box>
        
        {/* Hero section */}
        <Container maxWidth="lg" className="flex-grow flex items-center">
          <Box className="grid md:grid-cols-2 gap-12 py-12">
            <Box className="flex flex-col justify-center">
              <Typography 
                variant="h2" 
                component="h2" 
                className="font-display font-bold text-gray-900 mb-6"
                sx={{ 
                  fontSize: { xs: '2.5rem', md: '3.5rem' },
                  lineHeight: 1.2
                }}
              >
                Your Health Records & Claims in One Place
              </Typography>
              
              <Typography variant="body1" className="text-gray-700 text-lg mb-8">
                Access your medical records, track insurance claims, and communicate with your healthcare providers securely through our patient portal.
              </Typography>
              
              <Box className="flex flex-col sm:flex-row gap-4">
                <Link href="/login" passHref>
                  <Button 
                    variant="contained" 
                    color="primary" 
                    size="large"
                    className="bg-primary-500 hover:bg-primary-600 py-3 px-8"
                  >
                    Sign In
                  </Button>
                </Link>
                
                <Button 
                  variant="outlined" 
                  size="large"
                  className="border-primary-500 text-primary-500 hover:bg-primary-50 py-3 px-8"
                >
                  Learn More
                </Button>
              </Box>
            </Box>
            
            <Box className="flex items-center justify-center">
              {/* Replace with actual image */}
              <Box className="w-full h-96 bg-white rounded-lg shadow-lg overflow-hidden">
                <div className="w-full h-full bg-gradient-to-br from-primary-100 to-secondary-100 flex items-center justify-center">
                  <Typography variant="h3" className="text-primary-700 font-display font-medium">
                    Portal Image
                  </Typography>
                </div>
              </Box>
            </Box>
          </Box>
        </Container>
        
        {/* Features section */}
        <Box className="bg-white py-16">
          <Container maxWidth="lg">
            <Typography variant="h3" component="h3" className="text-center font-display font-bold mb-12">
              Key Features
            </Typography>
            
            <Box className="grid md:grid-cols-3 gap-8">
              <Box className="p-6 bg-primary-50 rounded-lg">
                <Typography variant="h5" className="font-medium mb-3">
                  Claims Management
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Track your insurance claims in real time. View status, payments, and resolve issues quickly.
                </Typography>
              </Box>
              
              <Box className="p-6 bg-primary-50 rounded-lg">
                <Typography variant="h5" className="font-medium mb-3">
                  Medical Records
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Access your complete medical history, test results, and treatment plans securely.
                </Typography>
              </Box>
              
              <Box className="p-6 bg-primary-50 rounded-lg">
                <Typography variant="h5" className="font-medium mb-3">
                  Provider Communication
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Message your healthcare team, request appointments, and get answers to your questions.
                </Typography>
              </Box>
            </Box>
          </Container>
        </Box>
        
        {/* Footer */}
        <Box className="bg-gray-900 text-white py-8">
          <Container maxWidth="lg">
            <Box className="flex flex-col md:flex-row justify-between items-center">
              <Typography variant="body2" className="mb-4 md:mb-0">
                &copy; 2025 HealthLinc. All rights reserved.
              </Typography>
              
              <Box className="flex gap-6">
                <Link href="/privacy" passHref>
                  <Typography variant="body2" className="text-gray-300 hover:text-white">
                    Privacy Policy
                  </Typography>
                </Link>
                <Link href="/terms" passHref>
                  <Typography variant="body2" className="text-gray-300 hover:text-white">
                    Terms of Service
                  </Typography>
                </Link>
                <Link href="/contact" passHref>
                  <Typography variant="body2" className="text-gray-300 hover:text-white">
                    Contact Us
                  </Typography>
                </Link>
              </Box>
            </Box>
          </Container>
        </Box>
      </Box>
    </>
  );
}
