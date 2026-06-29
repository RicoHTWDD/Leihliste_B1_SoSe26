import { Box, Typography, Paper } from '@mui/material'
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined'
import EventAvailableOutlinedIcon from '@mui/icons-material/EventAvailableOutlined'
import AssignmentTurnedInOutlinedIcon from '@mui/icons-material/AssignmentTurnedInOutlined'

// Kurze Nutzenversprechen statt zweier dichter Absätze — besser scanbar.
const features = [
  {
    icon: <Inventory2OutlinedIcon fontSize="large" color="primary" />,
    title: 'Zentral organisieren',
    text: 'Geräte, Materialien und Gegenstände an einem Ort verwalten – für Hochschulen, Vereine, Unternehmen und private Gruppen.',
  },
  {
    icon: <EventAvailableOutlinedIcon fontSize="large" color="primary" />,
    title: 'Verfügbarkeit auf einen Blick',
    text: 'Sofort erkennen, welche Gegenstände frei sind und welche Ausleihanfragen gerade bestehen.',
  },
  {
    icon: <AssignmentTurnedInOutlinedIcon fontSize="large" color="primary" />,
    title: 'Klarer Ausleihprozess',
    text: 'Unübersichtliche Tabellen und informelle Absprachen ersetzt durch einen nachvollziehbaren digitalen Ablauf.',
  },
]

function HomePage() {
  return (
    <Box sx={{ maxWidth: 1000, mx: 'auto', py: { xs: 4, md: 6 }, px: { xs: 1, sm: 2 } }}>
      {/* Hero */}
      <Box sx={{ textAlign: 'center', mb: { xs: 5, md: 7 } }}>
        <Typography variant="h3" component="h1" fontWeight={700} gutterBottom>
          LeihListe
        </Typography>
        <Typography
          variant="h5"
          component="p"
          color="text.secondary"
          sx={{ maxWidth: 620, mx: 'auto', lineHeight: 1.4 }}
        >
          Gemeinsam genutzte Ressourcen einfach verwalten und ausleihen
        </Typography>
      </Box>

      {/* Nutzenversprechen als Karten */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
          gap: 3,
        }}
      >
        {features.map((feature) => (
          <Paper
            key={feature.title}
            variant="outlined"
            sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column', gap: 1 }}
          >
            {feature.icon}
            <Typography variant="h6" component="h2" fontWeight={600}>
              {feature.title}
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.6 }}>
              {feature.text}
            </Typography>
          </Paper>
        ))}
      </Box>
    </Box>
  )
}

export default HomePage