import { useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  Tabs,
  Tab,
  Button,
  Chip,
  Avatar,
  IconButton,
  Divider,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  LinearProgress,
} from '@mui/material';
import {
  Phone as PhoneIcon,
  Email as EmailIcon,
  Home as HomeIcon,
  Edit as EditIcon,
  MedicalServices as MedicalIcon,
  LocalHospital as HospitalIcon,
  EventNote as EventNoteIcon,
  Coronavirus as CoronavirusIcon,
  Assignment as AssignmentIcon,
  Favorite as FavoriteIcon,
  Medication as MedicationIcon,
  AccessTime as AccessTimeIcon,
  CalendarMonth as CalendarIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';

export default function PatientDetail({ patient }) {
  const [activeTab, setActiveTab] = useState(0);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  if (!patient) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant="h5" color="text.secondary">Patient not found</Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* Patient Header */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          mb: 3,
          borderRadius: 2,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        }}
      >
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Avatar
                sx={{ width: 80, height: 80, mr: 3, bgcolor: 'primary.main' }}
                alt={patient.name}
                src={patient.photo || ''}
              >
                {patient.name.split(' ').map(n => n[0]).join('')}
              </Avatar>
              
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Typography variant="h4" sx={{ fontWeight: 'medium' }}>
                    {patient.name}
                  </Typography>
                  <Chip
                    label={patient.status === 'active' ? 'Active' : 'Inactive'}
                    color={patient.status === 'active' ? 'success' : 'default'}
                    size="small"
                    sx={{ ml: 2 }}
                  />
                </Box>
                
                <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
                  {patient.id} • {patient.gender}, {patient.age} years old • DOB: {format(new Date(patient.dob), 'MMMM d, yyyy')}
                </Typography>
                
                <Box sx={{ display: 'flex', mt: 2, gap: 2 }}>
                  <Chip
                    icon={<PhoneIcon fontSize="small" />}
                    label={patient.phone}
                    variant="outlined"
                    size="small"
                  />
                  <Chip
                    icon={<EmailIcon fontSize="small" />}
                    label={patient.email}
                    variant="outlined"
                    size="small"
                  />
                  <Chip
                    icon={<HomeIcon fontSize="small" />}
                    label={patient.address}
                    variant="outlined"
                    size="small"
                  />
                </Box>
              </Box>
            </Box>
          </Grid>
          
          <Grid item xs={12} md={4} sx={{ display: 'flex', flexDirection: 'column', alignItems: { xs: 'flex-start', md: 'flex-end' } }}>
            <Button
              variant="outlined"
              startIcon={<EditIcon />}
              sx={{ mb: 2 }}
            >
              Edit Patient
            </Button>
            
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button variant="contained" startIcon={<CalendarIcon />}>
                Schedule Appointment
              </Button>
              
              <Button variant="contained" color="secondary" startIcon={<MedicalIcon />}>
                Add Note
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>
      
      {/* Patient Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Card elevation={0} sx={{ borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ bgcolor: 'primary.light', mr: 2 }}>
                  <MedicationIcon />
                </Avatar>
                <Typography variant="h6">Medical Conditions</Typography>
              </Box>
              
              <List disablePadding>
                {patient.medicalConditions.map((condition, index) => (
                  <ListItem key={index} disablePadding sx={{ py: 0.5 }}>
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <FavoriteIcon color="error" fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary={condition} />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Card elevation={0} sx={{ borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ bgcolor: 'secondary.light', mr: 2 }}>
                  <CalendarIcon />
                </Avatar>
                <Typography variant="h6">Appointments</Typography>
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">Last Visit</Typography>
                <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                  {format(new Date(patient.lastVisit), 'MMMM d, yyyy')}
                </Typography>
              </Box>
              
              {patient.upcomingAppointment ? (
                <Box>
                  <Typography variant="body2" color="text.secondary">Upcoming Appointment</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                    {format(new Date(patient.upcomingAppointment), 'MMMM d, yyyy')}
                  </Typography>
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No upcoming appointments
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Card elevation={0} sx={{ borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ bgcolor: '#ff9800', color: 'white', mr: 2 }}>
                  <AssignmentIcon />
                </Avatar>
                <Typography variant="h6">Insurance</Typography>
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">Provider</Typography>
                <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                  {patient.insurance}
                </Typography>
              </Box>
              
              <Box>
                <Typography variant="body2" color="text.secondary">Primary Care</Typography>
                <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                  {patient.primaryCare}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      {/* Patient Tab Contents */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: 2,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          overflow: 'hidden',
        }}
      >
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
          }}
        >
          <Tab label="Overview" />
          <Tab label="Medical Records" />
          <Tab label="Medications" />
          <Tab label="Appointments" />
          <Tab label="Lab Results" />
          <Tab label="Billing & Claims" />
          <Tab label="Notes" />
        </Tabs>
        
        <Box sx={{ p: 3 }}>
          {activeTab === 0 && (
            <Typography variant="body1">
              Patient overview content will display here.
            </Typography>
          )}
          {activeTab === 1 && (
            <Typography variant="body1">
              Medical records content will display here.
            </Typography>
          )}
          {activeTab === 2 && (
            <Typography variant="body1">
              Medications content will display here.
            </Typography>
          )}
          {activeTab === 3 && (
            <Typography variant="body1">
              Appointments content will display here.
            </Typography>
          )}
          {activeTab === 4 && (
            <Typography variant="body1">
              Lab results content will display here.
            </Typography>
          )}
          {activeTab === 5 && (
            <Typography variant="body1">
              Billing & Claims content will display here.
            </Typography>
          )}
          {activeTab === 6 && (
            <Typography variant="body1">
              Notes content will display here.
            </Typography>
          )}
        </Box>
      </Paper>
    </Box>
  );
}
