import { getSession } from 'next-auth/react';
import axios from 'axios';

// Environment variables
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';

/**
 * API route for patient trend analytics
 */
export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // Get session for auth token
  const session = await getSession({ req });
  if (!session) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    // Validate request body
    if (!req.body.time_frame || !req.body.time_frame.start_date || !req.body.time_frame.end_date) {
      return res.status(400).json({ message: 'Missing required time frame parameters' });
    }

    // Forward request to RecordLinc agent
    const response = await axios.post(`${API_BASE_URL}/api/analytics/patient-trends`, req.body, {
      headers: {
        'Authorization': `Bearer ${session.accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    // Return response data
    return res.status(200).json(response.data);
  } catch (error) {
    console.error('Error fetching trends data:', error);
    
    // Handle different error scenarios
    if (error.response) {
      // Server responded with error
      return res.status(error.response.status).json({
        message: error.response.data.message || 'Error fetching trends data',
        error: error.response.data
      });
    } else if (error.request) {
      // No response received
      return res.status(503).json({
        message: 'Service unavailable. Please try again later.'
      });
    } else {
      // Error setting up request
      return res.status(500).json({
        message: 'Failed to process request',
        error: error.message
      });
    }
  }
}
