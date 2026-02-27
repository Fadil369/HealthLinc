import Head from 'next/head';
import Link from 'next/link';
import { Box, Container, Typography, Card, CardContent, List, ListItem, ListItemText, Button } from '@mui/material';

const outcomes = [
  'Urgent same-day appointment where clinically needed',
  'Routine appointment booking with the right clinician',
  'Referral to pharmacy or another suitable service',
  'Self-care guidance and educational resources',
  'Tests and investigations arranged when appropriate',
];

export default function AppointmentsPage() {
  return (
    <>
      <Head>
        <title>HealthLinc - Appointments & e-Consultations</title>
        <meta
          name="description"
          content="Online e-consultations are available 24/7 and reviewed during core hours with clear triage outcomes."
        />
      </Head>

      <Box className="min-h-screen bg-gray-50 py-12">
        <Container maxWidth="md">
          <Typography variant="h3" className="font-display font-bold mb-4">
            Appointments and 24/7 e-Consultations
          </Typography>
          <Typography variant="body1" className="text-gray-700 mb-6">
            You can submit an e-consultation request any time, day or night. Requests are clinically reviewed during
            core opening hours, and you will be contacted with the most appropriate next step.
          </Typography>

          <Card className="mb-6">
            <CardContent>
              <Typography variant="h6" className="font-semibold mb-2">
                Possible outcomes
              </Typography>
              <List dense>
                {outcomes.map((item) => (
                  <ListItem key={item} className="px-0">
                    <ListItemText primary={item} />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="h6" className="font-semibold mb-2">
                Important safety guidance
              </Typography>
              <Typography variant="body2" color="text.secondary" className="mb-4">
                If your issue is urgent, call the practice or NHS 111 instead of waiting for an online response.
                For life-threatening emergencies, call 999 immediately.
              </Typography>
              <Box className="flex gap-3 flex-wrap">
                <Link href="/" passHref>
                  <Button variant="outlined">Back to Home</Button>
                </Link>
                <Button variant="contained" className="bg-primary-500 hover:bg-primary-600">
                  Start Online Consultation
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Container>
      </Box>
    </>
  );
}
