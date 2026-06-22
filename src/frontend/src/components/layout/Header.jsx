import {
  AppBar,
  Avatar,
  Box,
  TextField,
  Toolbar,
  Typography,
} from '@mui/material'

function Header() {
  return (
    <AppBar position="static">
      <Toolbar
        sx={{
          gap: {
            xs: 1,
            sm: 2,
          },
        }}
      >
        <Typography
          variant="h6"
          sx={{
            width: {
              xs: 'auto',
              md: 180,
            },
            flexShrink: 0,
          }}
        >
          LeihListe
        </Typography>

        <Box
          sx={{
            width: {
              xs: 64,
              sm: 220,
              md: 320,
            },
            maxWidth: 320,
            transition: 'width 180ms ease',
            '&:focus-within': {
              width: {
                xs: 200,
                sm: 320,
              },
            },
          }}
        >
          <TextField
            fullWidth
            size="small"
            placeholder="Suche"
            sx={{
              '& .MuiOutlinedInput-root': {
                backgroundColor: 'background.paper',
              },
            }}
          />
        </Box>

        <Box
          sx={{
            flexGrow: 1,
          }}
        />

        <Avatar
          sx={{
            width: 36,
            height: 36,
            flexShrink: 0,
          }}
        >
          T
        </Avatar>
      </Toolbar>
    </AppBar>
  )
}

export default Header