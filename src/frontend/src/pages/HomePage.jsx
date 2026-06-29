import { Box, Typography } from '@mui/material'

function HomePage() {
  return (
    <Box
      sx={{
        maxWidth: 760,
        mx: 'auto',
        py: { xs: 4, md: 8 },
        px: { xs: 1, sm: 2 },
      }}
    >
      <Typography
        variant="h3"
        component="h1"
        fontWeight={700}
        gutterBottom
      >
        LeihListe
      </Typography>

      <Typography
        variant="h5"
        component="p"
        color="text.secondary"
        sx={{
          mb: 4,
          lineHeight: 1.4,
        }}
      >
        Gemeinsam genutzte Ressourcen einfach verwalten und ausleihen.
      </Typography>

      <Typography
        variant="body1"
        sx={{
          lineHeight: 1.8,
          mb: 2,
        }}
      >
        LeihListe unterstützt Hochschulen, Vereine, Unternehmen und
        private Gruppen dabei, Geräte, Materialien und andere Gegenstände
        zentral zu organisieren. Verfügbarkeiten und Ausleihanfragen werden
        übersichtlich dargestellt, sodass Verleiher und Ausleiher schnell
        erkennen können, welche Gegenstände verfügbar sind und welche
        Anfragen bestehen.
      </Typography>

      <Typography
        variant="body1"
        sx={{
          lineHeight: 1.8,
        }}
      >
        So ersetzt LeihListe unübersichtliche Tabellen und informelle
        Absprachen durch einen klaren und nachvollziehbaren digitalen
        Ausleihprozess.
      </Typography>
    </Box>
  )
}

export default HomePage