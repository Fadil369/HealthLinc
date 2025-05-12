import { useState } from 'react';
import { signOut, useSession } from 'next-auth/react';
import Link from 'next/link';
import { 
  Box, 
  Drawer, 
  AppBar, 
  Toolbar, 
  Typography, 
  Divider, 
  List, 
  ListItem, 
  ListItemButton, 
  ListItemIcon, 
  ListItemText, 
  IconButton, 
  Avatar, 
  Menu, 
  MenuItem, 
  Tooltip 
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  ReceiptLong as ClaimsIcon,
  MedicalInformation as RecordsIcon,
  Event as AppointmentsIcon,
  Message as MessagesIcon,
  Medication as MedicationsIcon,
  AccountCircle as AccountIcon,
  Menu as MenuIcon,
  ArrowBack as ArrowBackIcon,
  Notifications as NotificationsIcon,
  Logout as LogoutIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';
import { useRouter } from 'next/router';

const drawerWidth = 240;

const menuItems = [
  { text: 'Dashboard', icon: <DashboardIcon />, href: '/dashboard' },
  { text: 'Claims', icon: <ClaimsIcon />, href: '/claims' },
  { text: 'Records', icon: <RecordsIcon />, href: '/records' },
  { text: 'Appointments', icon: <AppointmentsIcon />, href: '/appointments' },
  { text: 'Messages', icon: <MessagesIcon />, href: '/messages' },
  { text: 'Medications', icon: <MedicationsIcon />, href: '/medications' },
];

export default function DashboardLayout({ children }) {
  const { data: session } = useSession();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuAnchor, setUserMenuAnchor] = useState(null);
  const [notificationAnchor, setNotificationAnchor] = useState(null);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleUserMenuOpen = (event) => {
    setUserMenuAnchor(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setUserMenuAnchor(null);
  };

  const handleNotificationOpen = (event) => {
    setNotificationAnchor(event.currentTarget);
  };

  const handleNotificationClose = () => {
    setNotificationAnchor(null);
  };

  const handleLogout = async () => {
    handleUserMenuClose();
    await signOut({ redirect: false });
    router.push('/login');
  };

  const drawer = (
    <Box>
      <Box className="p-4 flex items-center justify-center">
        <Typography variant="h6" className="font-display font-bold text-primary-600">
          HealthLinc
        </Typography>
      </Box>
      <Divider />
      <List>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <Link href={item.href} passHref style={{ width: '100%', textDecoration: 'none', color: 'inherit' }}>
              <ListItemButton
                selected={router.pathname === item.href || router.pathname.startsWith(`${item.href}/`)}
                className={router.pathname === item.href || router.pathname.startsWith(`${item.href}/`) ? 'bg-primary-50' : ''}
              >
                <ListItemIcon className={router.pathname === item.href || router.pathname.startsWith(`${item.href}/`) ? 'text-primary-500' : ''}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText 
                  primary={item.text}
                  primaryTypographyProps={{ 
                    className: router.pathname === item.href || router.pathname.startsWith(`${item.href}/`) ? 'font-medium text-primary-700' : ''
                  }} 
                />
              </ListItemButton>
            </Link>
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <Box className="flex h-screen">
      {/* App Bar */}
      <AppBar 
        position="fixed" 
        className="bg-white text-gray-800 shadow-sm"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>

          {router.pathname !== '/dashboard' && (
            <Tooltip title="Back">
              <IconButton onClick={() => router.back()} sx={{ mr: 1 }}>
                <ArrowBackIcon />
              </IconButton>
            </Tooltip>
          )}
          
          <Typography variant="h6" noWrap component="div" className="flex-grow">
            {menuItems.find(item => router.pathname === item.href)?.text || 
             menuItems.find(item => router.pathname.startsWith(`${item.href}/`))?.text || 
             'HealthLinc'}
          </Typography>
          
          {/* Notifications */}
          <Tooltip title="Notifications">
            <IconButton onClick={handleNotificationOpen}>
              <NotificationsIcon />
            </IconButton>
          </Tooltip>
          <Menu
            anchorEl={notificationAnchor}
            open={Boolean(notificationAnchor)}
            onClose={handleNotificationClose}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          >
            <Box className="p-2 w-72">
              <Typography variant="subtitle2" className="mb-2">
                Notifications
              </Typography>
              <Typography variant="body2" color="text.secondary" className="text-center py-4">
                No new notifications
              </Typography>
            </Box>
          </Menu>
          
          {/* User Menu */}
          <IconButton
            onClick={handleUserMenuOpen}
            size="small"
            edge="end"
            aria-label="account of current user"
            aria-haspopup="true"
            color="inherit"
          >
            <Avatar className="bg-primary-500">{session?.user?.name?.[0] || 'U'}</Avatar>
          </IconButton>
          <Menu
            anchorEl={userMenuAnchor}
            open={Boolean(userMenuAnchor)}
            onClose={handleUserMenuClose}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          >
            <Box className="px-4 py-2">
              <Typography variant="subtitle1">{session?.user?.name || 'User'}</Typography>
              <Typography variant="body2" color="text.secondary">
                {session?.user?.email || 'user@example.com'}
              </Typography>
            </Box>
            <Divider />
            <MenuItem onClick={() => {
              handleUserMenuClose();
              router.push('/profile');
            }}>
              <ListItemIcon>
                <AccountIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>My Profile</ListItemText>
            </MenuItem>
            <MenuItem onClick={() => {
              handleUserMenuClose();
              router.push('/settings');
            }}>
              <ListItemIcon>
                <SettingsIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Settings</ListItemText>
            </MenuItem>
            <MenuItem onClick={handleLogout}>
              <ListItemIcon>
                <LogoutIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Sign Out</ListItemText>
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      {/* Drawer */}
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        {/* Mobile drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
        
        {/* Desktop drawer */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      {/* Main content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          height: '100%',
          overflow: 'auto',
        }}
      >
        <Toolbar /> {/* Spacer to push content below app bar */}
        {children}
      </Box>
    </Box>
  );
}
