import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import {
  Box,
  Button,
  Typography,
  Container,
  Card,
  CardContent,
  CardActions,
  Chip,
  MenuItem,
  Select,
  FormControl,
  Alert,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';

const consultationPlatforms = [
  {
    name: 'RapidHealth',
    description:
      'Access self-care information, submit medical and admin requests, and register as a new patient in one flow.',
    cta: 'Open RapidHealth',
    href: 'https://rapidhealth.co.uk/',
  },
  {
    name: 'Patchs',
    description:
      'Complete a short request form so the team can review your need and route it to the right clinician or service.',
    cta: 'Go to Patchs',
    href: 'https://patchs.ai/',
  },
  {
    name: 'Accurx',
    description:
      'Send structured online requests and receive secure updates from the practice without waiting on hold.',
    cta: 'Use Accurx',
    href: 'https://accurx.com/',
  },
  {
    name: 'Klinik',
    description:
      'Submit symptoms online and get guided to urgent care, routine care, self-care, or onward referral.',
    cta: 'Open Klinik',
    href: 'https://klinik.co.uk/',
  },
  {
    name: 'SystmConnect',
    description:
      'No need to call or queue. Share your request digitally and get contacted during core working hours.',
    cta: 'Open SystmConnect',
    href: 'https://systmonline.tpp-uk.com/',
  },
  {
    name: 'Engage',
    description:
      'Use Engage for online admin requests, updates, and direct digital communication with your practice.',
    cta: 'Open Engage',
    href: 'https://engage.gp/',
  },
];

const healthInformation = [
  'Managing anxiety and stress support options',
  'How specialist referrals are reviewed',
  'Vitamin D prescribing guidance',
  'Antibiotic resistance and safe usage advice',
  'How to request repeat medication safely',
  'When to contact a pharmacist first',
];

const practiceNews = [
  'Target training date: 14 May 2026 (limited routine appointments during staff training).',
  'Bank holiday opening schedule updated for urgent and non-urgent requests.',
  'Community campaign launched on antibiotic resistance awareness.',
];

const languages = ['English', 'العربية', 'Français', 'Polski', 'Español', 'اردو'];

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('healthlinc-auth-token');
    if (token) {
      router.push('/dashboard');
    }
  }, [router]);

  return (
    <>
      <Head>
        <title>HealthLinc - Online Triage & Booking</title>
        <meta
          name="description"
          content="Use HealthLinc for online triage, 24/7 e-consultation requests, self-care guidance, and appointment booking."
        />
      </Head>

      <Box component="main" className="min-h-screen flex flex-col bg-gradient-to-b from-white to-primary-50">
        <Box className="bg-white shadow-sm">
          <Container maxWidth="lg">
            <Box className="flex justify-between items-center py-4">
              <Typography variant="h5" component="h1" className="font-display font-bold text-primary-600">
                HealthLinc
              </Typography>

              <Box className="flex gap-3">
                <Link href="/appointments" passHref>
                  <Button variant="outlined" color="primary">
                    Appointments
                  </Button>
                </Link>
                <Link href="/login" passHref>
                  <Button variant="contained" color="primary" className="bg-primary-500 hover:bg-primary-600">
                    Sign In
                  </Button>
                </Link>
              </Box>
            </Box>
          </Container>
        </Box>

        <Container maxWidth="lg" className="py-12">
          <Alert severity="info" className="mb-6">
            Need urgent help? Call <strong>NHS 111</strong> for non-emergency urgent guidance, available 24/7.
          </Alert>

          <Box className="grid md:grid-cols-2 gap-8 items-center mb-10">
            <Box>
              <Typography variant="h3" component="h2" className="font-display font-bold text-gray-900 mb-4">
                Online Triage and Appointment Booking
              </Typography>
              <Typography variant="body1" className="text-gray-700 text-lg mb-6">
                Tell us what you need by answering a few quick questions. We triage requests into urgent care,
                routine care, pharmacy support, self-care advice, or follow-up tests.
              </Typography>
              <Box className="flex gap-3 flex-wrap">
                <Link href="/appointments" passHref>
                  <Button variant="contained" size="large" className="bg-primary-500 hover:bg-primary-600">
                    Start e-Consultation
                  </Button>
                </Link>
                <Button variant="outlined" size="large">
                  Learn About Self-Care
                </Button>
              </Box>
            </Box>
            <Box className="bg-white rounded-lg shadow-lg p-6">
              <Typography variant="h6" className="mb-3 font-semibold">
                Triage outcomes you can expect
              </Typography>
              <List dense>
                {['Urgent appointment', 'Routine appointment', 'Pharmacy referral', 'Self-care information', 'Organised tests'].map((item) => (
                  <ListItem key={item} className="px-0">
                    <ListItemText primary={item} />
                  </ListItem>
                ))}
              </List>
              <Chip label="Reviewed during core hours" color="primary" variant="outlined" />
            </Box>
          </Box>

          <Typography variant="h4" className="font-display font-bold mb-6">
            Online Consultation Systems
          </Typography>
          <Box className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {consultationPlatforms.map((platform) => (
              <Card key={platform.name} className="h-full flex flex-col">
                <CardContent className="flex-grow">
                  <Typography variant="h6" className="font-semibold mb-2">
                    {platform.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {platform.description}
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button size="small" href={platform.href} target="_blank" rel="noopener noreferrer">
                    {platform.cta}
                  </Button>
                </CardActions>
              </Card>
            ))}
          </Box>

          <Box className="grid md:grid-cols-2 gap-8 mb-12">
            <Box className="bg-white p-6 rounded-lg shadow-sm">
              <Typography variant="h5" className="mb-3 font-semibold">
                Health Information
              </Typography>
              <Typography variant="body2" color="text.secondary" className="mb-2">
                Explore trusted self-care resources before booking or calling.
              </Typography>
              <List dense>
                {healthInformation.map((topic) => (
                  <ListItem key={topic} className="px-0">
                    <ListItemText primary={topic} />
                  </ListItem>
                ))}
              </List>
            </Box>

            <Box className="bg-white p-6 rounded-lg shadow-sm">
              <Typography variant="h5" className="mb-3 font-semibold">
                Practice News
              </Typography>
              <List dense>
                {practiceNews.map((news) => (
                  <ListItem key={news} className="px-0">
                    <ListItemText primary={news} />
                  </ListItem>
                ))}
              </List>
            </Box>
          </Box>
        </Container>

        <Box className="bg-gray-900 text-white py-8 mt-auto">
          <Container maxWidth="lg">
            <Box className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <Typography variant="body2">&copy; 2026 HealthLinc. All rights reserved.</Typography>

              <Box className="flex flex-wrap gap-4 items-center">
                <Link href="/privacy" passHref>
                  <Typography variant="body2" className="text-gray-300 hover:text-white">
                    Privacy Policy
                  </Typography>
                </Link>
                <Link href="/accessibility" passHref>
                  <Typography variant="body2" className="text-gray-300 hover:text-white">
                    Accessibility
                  </Typography>
                </Link>
                <FormControl size="small" sx={{ minWidth: 150, backgroundColor: 'white', borderRadius: 1 }}>
                  <Select defaultValue="English" aria-label="Language selector">
                    {languages.map((language) => (
                      <MenuItem key={language} value={language}>
                        {language}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
            </Box>
          </Container>
        </Box>
      </Box>
    </>
  );
}
