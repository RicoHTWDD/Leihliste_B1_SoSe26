import {
  Box,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
} from '@mui/material'

import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined'
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined'
import CategoryOutlinedIcon from '@mui/icons-material/CategoryOutlined'
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined'
import InboxOutlinedIcon from '@mui/icons-material/InboxOutlined'
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined'

const navigationItems = [
  {
    label: 'Home',
    page: 'home',
    icon: <HomeOutlinedIcon />,
  },
  {
    label: 'Gegenstände',
    page: 'items',
    icon: <Inventory2OutlinedIcon />,
  },
  {
    label: 'Kategorien',
    page: 'categories',
    icon: <CategoryOutlinedIcon />,
  },
  {
    label: 'Anfragen',
    page: 'loan-request',
    icon: <AssignmentOutlinedIcon />,
  },
  {
    label: 'Eingegangene Anfragen',
    page: 'eingang',
    icon: <InboxOutlinedIcon />,
  },
]

function Sidebar({ currentPage, onNavigate, eingangSichtbar }) {
  const sichtbareEintraege = navigationItems.filter(item => item.page !== 'eingang' || eingangSichtbar)
  return (
    <Box
      component="aside"
      sx={{
        width: {
          xs: 64,
          sm: 180,
          md: 220,
        },
        minWidth: {
          xs: 64,
          sm: 180,
          md: 220,
        },
        minHeight: 'calc(100vh - 64px)',
        backgroundColor: 'primary.main',
        color: 'primary.contrastText',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        overflow: 'hidden',
      }}
    >
      <List>
        {sichtbareEintraege.map((item) => (
          <ListItemButton
            key={item.label}
            title={item.label}
            aria-label={item.label}
            aria-current={currentPage === item.page ? 'page' : undefined}
            selected={currentPage === item.page}
            onClick={() => onNavigate(item.page)}
            sx={{
              justifyContent: {
                xs: 'center',
                sm: 'flex-start',
              },
              px: {
                xs: 1,
                sm: 2,
              },
              '&.Mui-selected': {
                backgroundColor: 'rgba(0, 0, 0, 0.18)',
              },
              '&.Mui-selected:hover': {
                backgroundColor: 'rgba(0, 0, 0, 0.24)',
              },
            }}
          >
            <ListItemIcon
              sx={{
                minWidth: {
                  xs: 0,
                  sm: 40,
                },
                justifyContent: 'center',
                color: 'inherit',
              }}
            >
              {item.icon}
            </ListItemIcon>

            <ListItemText
              primary={item.label}
              sx={{
                display: {
                  xs: 'none',
                  sm: 'block',
                },
              }}
            />
          </ListItemButton>
        ))}
      </List>

      <List
        sx={{
          marginTop: 'auto',
        }}
      >
        <ListItemButton
          title="Abmelden"
          sx={{
            justifyContent: {
              xs: 'center',
              sm: 'flex-start',
            },
            px: {
              xs: 1,
              sm: 2,
            },
          }}
        >
          <ListItemIcon
            sx={{
              minWidth: {
                xs: 0,
                sm: 40,
              },
              justifyContent: 'center',
              color: 'inherit',
            }}
          >
            <LogoutOutlinedIcon />
          </ListItemIcon>

          <ListItemText
            primary="Abmelden"
            sx={{
              display: {
                xs: 'none',
                sm: 'block',
              },
            }}
          />
        </ListItemButton>
      </List>
    </Box>
  )
}

export default Sidebar
