import { useRouter } from 'next/router';
import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { Card, CardContent, TextField, Button, Typography, Box, Alert } from '@mui/material';
import { Lock as LockIcon } from '@mui/icons-material';
import Image from 'next/image';
import Head from 'next/head';

export default function Login() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      const result = await signIn('credentials', {
        redirect: false,
        username,
        password,
      });
      
      if (result.error) {
        setError('Invalid username or password');
        setIsLoading(false);
        return;
      }
      
      // Success - redirect to dashboard
      router.push('/dashboard');
    } catch (error) {
      console.error('Login error:', error);
      setError('An error occurred during login');
      setIsLoading(false);
    }
  };
  
  return (
    <>
      <Head>
        <title>Login - HealthLinc Patient Portal</title>
      </Head>
      
      <Box className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <Card className="max-w-md w-full shadow-card">
          <CardContent className="p-8">
            <Box className="flex flex-col items-center mb-8">
              <Box className="w-32 h-32 relative mb-4">
                {/* Replace with actual logo */}
                <div className="w-full h-full rounded-full bg-primary-500 flex items-center justify-center">
                  <LockIcon fontSize="large" className="text-white" />
                </div>
              </Box>
              
              <Typography variant="h4" component="h1" className="text-center font-display font-bold text-gray-900">
                HealthLinc
              </Typography>
              <Typography variant="body1" className="text-center text-gray-600 mt-2">
                Patient Portal Access
              </Typography>
            </Box>
            
            {error && (
              <Alert severity="error" className="mb-4">
                {error}
              </Alert>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <TextField
                label="Username"
                variant="outlined"
                fullWidth
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
              
              <TextField
                label="Password"
                type="password"
                variant="outlined" 
                fullWidth
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              
              <Button
                type="submit"
                variant="contained"
                color="primary"
                fullWidth
                size="large"
                disabled={isLoading}
                className="bg-primary-500 hover:bg-primary-600"
              >
                {isLoading ? 'Signing in...' : 'Sign in'}
              </Button>
            </form>
            
            <Box className="mt-6 text-center">
              <Typography variant="body2" className="text-gray-600">
                Need help? Contact your healthcare provider
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </>
  );
}
