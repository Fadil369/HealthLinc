import { useState } from 'react';
import Head from 'next/head';
import ClinicianLayout from '../components/ClinicianLayout';
import {
  Box,
  Typography,
  Paper,
  Button,
  IconButton,
  Grid,
  Tabs,
  Tab,
  TextField,
  InputAdornment,
  Menu,
  MenuItem,
  ListItemIcon,
  Chip,
  Divider,
  Card,
  CardContent,
  Avatar,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import {
  Add as AddIcon,
  Search as SearchIcon,
  CalendarMonth as CalendarIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  MoreVert as MoreVertIcon,
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  AccessTime as TimeIcon,
  LocationOn as LocationIcon,
  Person as PersonIcon,
  Notes as NotesIcon,
  Check as CheckIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { useRouter } from 'next/router';
import { format, addDays, eachDayOfInterval, startOfWeek, isSameDay } from 'date-fns';

// Mock appointment data
const appointments = [
  {
    id: 'APT-123456',
    patientId: 'PT-12345',
    patientName: 'John Smith',
    patientAge: 45,
    date: new Date('2025-05-12T09:00:00'),
    duration: 30,
    reason: 'Annual Checkup',
    status: 'confirmed',
    location: 'Main Clinic - Room 3A',
    provider: 'Dr. Jane Smith',
    notes: 'Follow up on blood pressure medication and recent lab results.',
    type: 'in-person',
  },
  {
    id: 'APT-123457',
    patientId: 'PT-12346',
    patientName: 'Emily Johnson',
    patientAge: 32,
    date: new Date('2025-05-12T09:30:00'),
    duration: 30,
    reason: 'Follow-up',
    status: 'confirmed',
    location: 'Main Clinic - Room 3A',
    provider: 'Dr. Jane Smith',
    notes: 'Review asthma management plan and refill prescriptions.',
    type: 'in-person',
  },
  {
    id: 'APT-123458',
    patientId: 'PT-12347',
    patientName: 'Robert Davis',
    patientAge: 67,
    date: new Date('2025-05-12T10:00:00'),
    duration: 45,
    reason: 'Medication Review',
    status: 'confirmed',
    location: 'Main Clinic - Room 3A',
    provider: 'Dr. Jane Smith',
    notes: 'Comprehensive medication review due to recent hospital discharge.',
    type: 'in-person',
  },
  {
    id: 'APT-123459',
    patientId: 'PT-12348',
    patientName: 'Sophia Williams',
    patientAge: 28,
    date: new Date('2025-05-12T10:45:00'),
    duration: 30,
    reason: 'Consultation',
    status: 'confirmed',
    location: 'Main Clinic - Room 3A',
    provider: 'Dr. Jane Smith',
    notes: 'Initial consultation regarding recurring migraines.',
    type: 'in-person',
  },
  {
    id: 'APT-123460',
    patientId: 'PT-12349',
    patientName: 'Michael Brown',
    patientAge: 54,
    date: new Date('2025-05-12T11:15:00'),
    duration: 30,
    reason: 'Lab Results',
    status: 'confirmed',
    location: 'Main Clinic - Room 3A',
    provider: 'Dr. Jane Smith',
    notes: 'Review lipid panel and adjust medication if necessary.',
    type: 'video',
  },
  {
    id: 'APT-123461',
    patientId: 'PT-12350',
    patientName: 'Patricia Miller',
    patientAge: 72,
    date: new Date('2025-05-12T13:00:00'),
    duration: 45,
    reason: 'Follow-up',
    status: 'confirmed',
    location: 'Main Clinic - Room 3A',
    provider: 'Dr. Jane Smith',
    notes: 'Post-surgery follow-up and pain management evaluation.',
    type: 'in-person',
  },
  {
    id: 'APT-123462',
    patientId: 'PT-12351',
    patientName: 'James Wilson',
    patientAge: 38,
    date: new Date('2025-05-13T09:00:00'),
    duration: 30,
    reason: 'Checkup',
    status: 'confirmed',
    location: 'Main Clinic - Room 3A',
    provider: 'Dr. Jane Smith',
    notes: 'Routine checkup for monitoring hypertension.',
    type: 'in-person',
  },
  {
    id: 'APT-123463',
    patientId: 'PT-12352',
    patientName: 'Barbara Jones',
    patientAge: 61,
    date: new Date('2025-05-13T09:30:00'),
    duration: 30,
    reason: 'Follow-up',
    status: 'rescheduled',
    location: 'Main Clinic - Room 3A',
    provider: 'Dr. Jane Smith',
    notes: 'Follow-up on diabetes management.',
    type: 'video',
  },
  {
    id: 'APT-123464',
    patientId: 'PT-12353',
    patientName: 'Charles Taylor',
    patientAge: 52,
    date: new Date('2025-05-14T10:00:00'),
    duration: 45,
    reason: 'New Patient',
    status: 'pending',
    location: 'Main Clinic - Room 3A',
    provider: 'Dr. Jane Smith',
    notes: 'Initial appointment for new patient with chronic back pain.',
    type: 'in-person',
  },
];

// Status colors and labels
const statusColors = {
  'confirmed': { bg: '#e8f5e9', text: '#2e7d32', label: 'Confirmed' },
  'pending': { bg: '#fff8e1', text: '#ff8f00', label: 'Pending' },
  'checked-in': { bg: '#e3f2fd', text: '#0d47a1', label: 'Checked In' },
  'in-progress': { bg: '#e8f5e9', text: '#2e7d32', label: 'In Progress' },
  'completed': { bg: '#f5f5f5', text: '#424242', label: 'Completed' },
  'cancelled': { bg: '#ffebee', text: '#c62828', label: 'Cancelled' },
  'rescheduled': { bg: '#e0f7fa', text: '#006064', label: 'Rescheduled' },
  'no-show': { bg: '#ffebee', text: '#c62828', label: 'No Show' },
};

export default function AppointmentsPage() {
  const router = useRouter();
  const [tabValue, setTabValue] = useState(0);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [searchTerm, setSearchTerm] = useState('');
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };
  
  const handleMenuOpen = (event, appointment) => {
    setAnchorEl(event.currentTarget);
    setSelectedAppointment(appointment);
  };
  
  const handleMenuClose = () => {
    setAnchorEl(null);
  };
  
  const handleViewDetails = () => {
    router.push(`/appointments/${selectedAppointment.id}`);
    handleMenuClose();
  };
  
  const handleEditAppointment = () => {
    router.push(`/appointments/${selectedAppointment.id}/edit`);
    handleMenuClose();
  };
  
  const handleCancelAppointment = () => {
    setOpenDialog(true);
    handleMenuClose();
  };
  
  const handleCloseDialog = () => {
    setOpenDialog(false);
  };
  
  const handleConfirmCancel = () => {
    // Logic to cancel appointment would go here
    setOpenDialog(false);
  };

  // Filter appointments based on the selected tab and date
  const filteredAppointments = appointments.filter((appointment) => {
    const isMatchingDate = isSameDay(appointment.date, selectedDate);
    
    if (!isMatchingDate) return false;
    
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        appointment.patientName.toLowerCase().includes(searchLower) ||
        appointment.patientId.toLowerCase().includes(searchLower) ||
        appointment.reason.toLowerCase().includes(searchLower) ||
        appointment.id.toLowerCase().includes(searchLower)
      );
    }
    
    // Filter based on tab selection
    switch (tabValue) {
      case 0: // All
        return true;
      case 1: // Upcoming
        return ['confirmed', 'pending', 'rescheduled'].includes(appointment.status);
      case 2: // Checked-in
        return ['checked-in', 'in-progress'].includes(appointment.status);
      case 3: // Completed
        return appointment.status === 'completed';
      case 4: // Cancelled
        return ['cancelled', 'no-show'].includes(appointment.status);
      default:
        return true;
    }
  });
  
  // Sort appointments by time
  const sortedAppointments = [...filteredAppointments].sort((a, b) => a.date - b.date);

  // Generate week days for the calendar
  const startDate = startOfWeek(selectedDate, { weekStartsOn: 0 });
  const weekDays = eachDayOfInterval({ start: startDate, end: addDays(startDate, 6) });

  return (
    <>
      <Head>
        <title>Appointments | HealthLinc Clinician Portal</title>
      </Head>
      
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4">Appointments</Typography>
          <Button 
            variant="contained" 
            startIcon={<AddIcon />}
            onClick={() => router.push('/appointments/new')}
          >
            Schedule Appointment
          </Button>
        </Box>

        {/* Date Selector */}
        <Paper 
          elevation={0}
          sx={{ 
            mb: 3,
            p: 2,
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            alignItems: { xs: 'stretch', md: 'center' },
            gap: 2,
            justifyContent: 'space-between',
            borderRadius: 2,
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="Select Date"
                value={selectedDate}
                onChange={(newValue) => setSelectedDate(newValue)}
                renderInput={(params) => <TextField {...params} variant="outlined" />}
              />
            </LocalizationProvider>
            
            <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
              <Typography variant="h6" sx={{ fontWeight: 'medium' }}>
                {format(selectedDate, 'MMMM d, yyyy')}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {format(selectedDate, 'EEEE')}
              </Typography>
            </Box>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField
              placeholder="Search appointments"
              size="small"
              variant="outlined"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
              }}
              sx={{ width: { xs: '100%', sm: 200 } }}
            />
            
            <Button variant="outlined">Filter</Button>
          </Box>
        </Paper>

        {/* Week Calendar */}
        <Paper 
          elevation={0}
          sx={{ 
            p: 2,
            mb: 3,
            borderRadius: 2,
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            overflowX: 'auto',
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Calendar</Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <IconButton size="small">
                <ChevronLeftIcon />
              </IconButton>
              <IconButton size="small">
                <ChevronRightIcon />
              </IconButton>
            </Box>
          </Box>
          
          <Grid container spacing={1} sx={{ minWidth: 640 }}>
            {weekDays.map((day) => {
              const isSelected = isSameDay(day, selectedDate);
              // Count appointments on this day
              const dayAppointments = appointments.filter(apt => isSameDay(apt.date, day));
              
              return (
                <Grid item xs={12/7} key={day.toString()}>
                  <Paper
                    elevation={0}
                    onClick={() => setSelectedDate(day)}
                    sx={{
                      p: 2,
                      textAlign: 'center',
                      cursor: 'pointer',
                      backgroundColor: isSelected ? 'primary.light' : 'background.paper',
                      color: isSelected ? 'white' : 'text.primary',
                      border: '1px solid',
                      borderColor: isSelected ? 'primary.main' : 'divider',
                      borderRadius: 2,
                      '&:hover': {
                        backgroundColor: isSelected ? 'primary.main' : 'action.hover',
                      },
                    }}
                  >
                    <Typography variant="body2" color={isSelected ? 'inherit' : 'text.secondary'}>
                      {format(day, 'EEE')}
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 'medium', my: 1 }}>
                      {format(day, 'd')}
                    </Typography>
                    {dayAppointments.length > 0 && (
                      <Chip
                        size="small"
                        label={`${dayAppointments.length} appts`}
                        sx={{
                          bgcolor: isSelected ? 'rgba(255,255,255,0.2)' : 'primary.50',
                          color: isSelected ? 'white' : 'primary.main',
                          fontWeight: 500,
                        }}
                      />
                    )}
                  </Paper>
                </Grid>
              );
            })}
          </Grid>
        </Paper>

        {/* Tabs Filter */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab label="All" />
            <Tab label="Upcoming" />
            <Tab label="Checked In" />
            <Tab label="Completed" />
            <Tab label="Cancelled" />
          </Tabs>
        </Box>

        {/* Appointments List */}
        <Stack spacing={2}>
          {sortedAppointments.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="h6" color="text.secondary">No appointments found</Typography>
              <Typography variant="body2" color="text.secondary">
                Try selecting a different date or changing your search criteria
              </Typography>
            </Box>
          ) : (
            sortedAppointments.map((appointment) => (
              <Card 
                key={appointment.id}
                elevation={0}
                sx={{ 
                  borderRadius: 2,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                }}
              >
                <CardContent>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={8}>
                      <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                        <Avatar
                          sx={{ bgcolor: 'primary.main', mr: 2 }}
                        >
                          {appointment.patientName.split(' ').map(n => n[0]).join('')}
                        </Avatar>
                        <Box>
                          <Typography variant="h6" sx={{ fontWeight: 'medium' }}>
                            {appointment.patientName}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {appointment.patientId} • {appointment.patientAge} years old
                          </Typography>
                        </Box>
                      </Box>
                      
                      <Divider sx={{ my: 2 }} />
                      
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <TimeIcon color="action" sx={{ fontSize: 18, mr: 1 }} />
                            <Typography variant="body2">
                              {format(appointment.date, 'h:mm a')} ({appointment.duration} min)
                            </Typography>
                          </Box>
                          
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <LocationIcon color="action" sx={{ fontSize: 18, mr: 1 }} />
                            <Typography variant="body2">
                              {appointment.location}
                            </Typography>
                          </Box>
                          
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <PersonIcon color="action" sx={{ fontSize: 18, mr: 1 }} />
                            <Typography variant="body2">
                              {appointment.provider}
                            </Typography>
                          </Box>
                        </Grid>
                        
                        <Grid item xs={12} sm={6}>
                          <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 1 }}>
                            <NotesIcon color="action" sx={{ fontSize: 18, mr: 1, mt: 0.3 }} />
                            <Typography variant="body2">
                              {appointment.reason}: {appointment.notes}
                            </Typography>
                          </Box>
                        </Grid>
                      </Grid>
                    </Grid>
                    
                    <Grid item xs={12} md={4} sx={{ display: 'flex', flexDirection: 'column', alignItems: { xs: 'flex-start', md: 'flex-end' } }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', mb: 2 }}>
                        <Chip
                          label={statusColors[appointment.status].label}
                          size="small"
                          sx={{ 
                            bgcolor: statusColors[appointment.status].bg,
                            color: statusColors[appointment.status].text,
                            fontWeight: 500,
                          }}
                        />
                        
                        <Chip
                          label={appointment.type === 'video' ? 'Video Visit' : 'In-Person'}
                          size="small"
                          variant="outlined"
                          color={appointment.type === 'video' ? 'info' : 'default'}
                        />
                        
                        <IconButton 
                          size="small" 
                          onClick={(e) => handleMenuOpen(e, appointment)}
                        >
                          <MoreVertIcon />
                        </IconButton>
                      </Box>
                      
                      <Box sx={{ mt: 'auto', display: 'flex', gap: 1 }}>
                        {['confirmed', 'pending', 'rescheduled'].includes(appointment.status) && (
                          <Button 
                            size="small" 
                            variant="outlined" 
                            color="primary"
                            onClick={() => router.push(`/appointments/${appointment.id}/check-in`)}
                          >
                            Check In
                          </Button>
                        )}
                        <Button 
                          size="small" 
                          variant="contained" 
                          color="primary"
                          onClick={() => router.push(`/appointments/${appointment.id}`)}
                        >
                          Details
                        </Button>
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            ))
          )}
        </Stack>
      </Box>
      
      {/* Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleViewDetails}>
          <ListItemIcon>
            <VisibilityIcon fontSize="small" />
          </ListItemIcon>
          View Details
        </MenuItem>
        <MenuItem onClick={handleEditAppointment}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          Edit Appointment
        </MenuItem>
        <MenuItem onClick={handleCancelAppointment}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" />
          </ListItemIcon>
          Cancel Appointment
        </MenuItem>
      </Menu>
      
      {/* Cancel Confirmation Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>Cancel Appointment</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to cancel this appointment with {selectedAppointment?.patientName} on {selectedAppointment && format(selectedAppointment.date, 'MMMM d, yyyy')} at {selectedAppointment && format(selectedAppointment.date, 'h:mm a')}?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="primary">
            No, Keep It
          </Button>
          <Button onClick={handleConfirmCancel} color="error" variant="contained">
            Yes, Cancel Appointment
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

AppointmentsPage.getLayout = (page) => <ClinicianLayout>{page}</ClinicianLayout>;
