import { useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import ClinicianLayout from '../components/ClinicianLayout';
import {
  Box,
  Typography,
  Paper,
  TextField,
  InputAdornment,
  IconButton,
  Button,
  Grid,
  Card,
  CardContent,
  Avatar,
  Chip,
  Divider,
  Menu,
  MenuItem,
  ListItemIcon,
  Tab,
  Tabs,
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  MoreVert as MoreVertIcon,
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Message as MessageIcon,
  CalendarMonth as CalendarIcon,
  MedicalServices as MedicalIcon,
  Person as PersonIcon,
  People as PeopleIcon,
  Favorite as FavoriteIcon,
  LocalHospital as HospitalIcon,
  Pets as PetsIcon,
  SvgIcon,
} from '@mui/icons-material';

// Mock patient data
const patients = [
  {
    id: 'PT-12345',
    name: 'John Smith',
    age: 45,
    gender: 'Male',
    dob: '1980-03-15',
    address: '123 Main St, Anytown, USA',
    phone: '(555) 123-4567',
    email: 'john.smith@example.com',
    insurance: 'Blue Cross Blue Shield',
    primaryCare: 'Dr. Jane Smith',
    lastVisit: '2025-04-28',
    medicalConditions: ['Hypertension', 'Type 2 Diabetes'],
    upcomingAppointment: '2025-05-15',
    status: 'active',
    photo: null,
  },
  {
    id: 'PT-12346',
    name: 'Emily Johnson',
    age: 32,
    gender: 'Female',
    dob: '1993-07-22',
    address: '456 Oak Ave, Sometown, USA',
    phone: '(555) 234-5678',
    email: 'emily.johnson@example.com',
    insurance: 'Aetna',
    primaryCare: 'Dr. Jane Smith',
    lastVisit: '2025-05-02',
    medicalConditions: ['Asthma', 'Allergies'],
    upcomingAppointment: '2025-05-18',
    status: 'active',
    photo: null,
  },
  {
    id: 'PT-12347',
    name: 'Robert Davis',
    age: 67,
    gender: 'Male',
    dob: '1958-11-03',
    address: '789 Pine Rd, Othertown, USA',
    phone: '(555) 345-6789',
    email: 'robert.davis@example.com',
    insurance: 'Medicare',
    primaryCare: 'Dr. Jane Smith',
    lastVisit: '2025-04-15',
    medicalConditions: ['Coronary Artery Disease', 'Arthritis', 'COPD'],
    upcomingAppointment: '2025-05-20',
    status: 'active',
    photo: null,
  },
  {
    id: 'PT-12348',
    name: 'Sophia Williams',
    age: 28,
    gender: 'Female',
    dob: '1997-05-18',
    address: '101 Elm St, Newtown, USA',
    phone: '(555) 456-7890',
    email: 'sophia.williams@example.com',
    insurance: 'United Healthcare',
    primaryCare: 'Dr. Jane Smith',
    lastVisit: '2025-03-22',
    medicalConditions: ['Anxiety', 'Migraine'],
    upcomingAppointment: '2025-06-05',
    status: 'active',
    photo: null,
  },
  {
    id: 'PT-12349',
    name: 'Michael Brown',
    age: 54,
    gender: 'Male',
    dob: '1971-09-26',
    address: '202 Cedar Ave, Lasttown, USA',
    phone: '(555) 567-8901',
    email: 'michael.brown@example.com',
    insurance: 'Cigna',
    primaryCare: 'Dr. Michael Lee',
    lastVisit: '2025-04-10',
    medicalConditions: ['Hyperlipidemia', 'Obesity'],
    upcomingAppointment: null,
    status: 'inactive',
    photo: null,
  },
  {
    id: 'PT-12350',
    name: 'Patricia Miller',
    age: 72,
    gender: 'Female',
    dob: '1953-01-12',
    address: '303 Maple Dr, Oldtown, USA',
    phone: '(555) 678-9012',
    email: 'patricia.miller@example.com',
    insurance: 'Medicare',
    primaryCare: 'Dr. Jane Smith',
    lastVisit: '2025-04-20',
    medicalConditions: ['Osteoporosis', 'Hypertension', 'Glaucoma'],
    upcomingAppointment: '2025-05-22',
    status: 'active',
    photo: null,
  },
];

export default function PatientsPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedPatient, setSelectedPatient] = useState(null);
  
  const handleMenuClick = (event, patient) => {
    setAnchorEl(event.currentTarget);
    setSelectedPatient(patient);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleViewPatient = () => {
    router.push(`/patients/${selectedPatient.id}`);
    handleMenuClose();
  };

  const handleEditPatient = () => {
    router.push(`/patients/${selectedPatient.id}/edit`);
    handleMenuClose();
  };

  const handleChangeTab = (event, newValue) => {
    setTabValue(newValue);
  };

  const filteredPatients = patients.filter(
    (patient) => 
      (tabValue === 0 || (tabValue === 1 && patient.status === 'active') || (tabValue === 2 && patient.status === 'inactive')) &&
      (patient.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
       patient.id.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <>
      <Head>
        <title>Patients | HealthLinc Clinician Portal</title>
      </Head>
      
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4">Patients</Typography>
          <Button 
            variant="contained" 
            startIcon={<AddIcon />}
            onClick={() => router.push('/patients/new')}
          >
            Add Patient
          </Button>
        </Box>
        
        <Paper 
          elevation={0}
          sx={{ 
            mb: 3,
            p: 2,
            display: 'flex',
            alignItems: 'center',
            borderRadius: 2,
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}
        >
          <TextField
            fullWidth
            placeholder="Search patients by name or ID"
            variant="outlined"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
            }}
            sx={{ mr: 2 }}
          />
          <Button variant="outlined">Filter</Button>
        </Paper>
        
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={tabValue} onChange={handleChangeTab}>
            <Tab label="All Patients" />
            <Tab label="Active" />
            <Tab label="Inactive" />
          </Tabs>
        </Box>
        
        <Grid container spacing={3}>
          {filteredPatients.map((patient) => (
            <Grid item xs={12} md={6} lg={4} key={patient.id}>
              <Card 
                elevation={0}
                sx={{ 
                  borderRadius: 2, 
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  height: '100%',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 10px 20px rgba(0,0,0,0.15)',
                    cursor: 'pointer'
                  }
                }}
                onClick={() => router.push(`/patients/${patient.id}`)}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Avatar
                        sx={{ bgcolor: 'primary.main', width: 50, height: 50, mr: 2 }}
                        alt={patient.name}
                        src={patient.photo}
                      >
                        {patient.name.split(' ').map(n => n[0]).join('')}
                      </Avatar>
                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: 'medium' }}>
                          {patient.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {patient.id} • {patient.gender}, {patient.age}
                        </Typography>
                      </Box>
                    </Box>
                    <Box>
                      <IconButton 
                        aria-label="patient actions" 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMenuClick(e, patient);
                        }}
                      >
                        <MoreVertIcon />
                      </IconButton>
                    </Box>
                  </Box>
                  
                  <Divider sx={{ my: 2 }} />
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <FavoriteIcon color="error" sx={{ fontSize: 18, mr: 1 }} />
                    <Typography variant="body2">
                      {patient.medicalConditions.join(', ')}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <CalendarIcon color="primary" sx={{ fontSize: 18, mr: 1 }} />
                    <Typography variant="body2">
                      Last Visit: {new Date(patient.lastVisit).toLocaleDateString()}
                    </Typography>
                  </Box>
                  
                  {patient.upcomingAppointment && (
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <CalendarIcon color="secondary" sx={{ fontSize: 18, mr: 1 }} />
                      <Typography variant="body2">
                        Next Appointment: {new Date(patient.upcomingAppointment).toLocaleDateString()}
                      </Typography>
                    </Box>
                  )}
                  
                  <Box sx={{ mt: 2 }}>
                    <Chip 
                      size="small"
                      label={patient.status === 'active' ? 'Active' : 'Inactive'} 
                      color={patient.status === 'active' ? 'success' : 'default'}
                      sx={{ mr: 1 }}
                    />
                    <Chip 
                      size="small"
                      label={patient.insurance} 
                      variant="outlined"
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
      
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <MenuItem onClick={handleViewPatient}>
          <ListItemIcon>
            <VisibilityIcon fontSize="small" />
          </ListItemIcon>
          View Details
        </MenuItem>
        <MenuItem onClick={handleEditPatient}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          Edit Patient
        </MenuItem>
        <MenuItem>
          <ListItemIcon>
            <MessageIcon fontSize="small" />
          </ListItemIcon>
          Send Message
        </MenuItem>
        <MenuItem>
          <ListItemIcon>
            <CalendarIcon fontSize="small" />
          </ListItemIcon>
          Schedule Appointment
        </MenuItem>
      </Menu>
    </>
  );
}

PatientsPage.getLayout = (page) => <ClinicianLayout>{page}</ClinicianLayout>;
