// src/components/home/QuickMenu.jsx — REDESIGN
// Grid de atalhos com cards escuros, ícone grande, gradiente sutil por categoria.

import React from 'react';
import Box        from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Grid       from '@mui/material/Grid';

const MENU_ROW1 = [
  { route: 'acordos',   icon: '🤝', label: 'Acordos',   accent: '#A855F7', delay: 0   },
  { route: 'gastos',    icon: '📅', label: 'Gastos',    accent: '#EC4899', delay: 50  },
  { route: 'lista',     icon: '🛒', label: 'Compras',   accent: '#06B6D4', delay: 100 },
  { route: 'relatorio', icon: '📊', label: 'Relatório', accent: '#A855F7', delay: 150 },
];

const MENU_ROW2 = [
  { route: 'novaConta', icon: '➕', label: 'Lançamento', accent: '#EC4899', delay: 200 },
  { route: 'backup',    icon: '🛡️', label: 'Backup',    accent: '#06B6D4', delay: 250 },
  { route: 'sobre',     icon: '📖', label: 'Sobre',      accent: '#A855F7', delay: 300 },
];

const MenuItem = ({ item, setRoute }) => (
  <Box
    onClick={() => setRoute(item.route)}
    sx={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      py: 1.4,
      px: 0.5,
      borderRadius: '16px',
      bgcolor: 'background.paper',
      border: '1px solid',
      borderColor: 'rgba(0,0,0,0.05)',
      boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
      cursor: 'pointer',
      userSelect: 'none',
      WebkitTapHighlightColor: 'transparent',
      position: 'relative',
      overflow: 'hidden',
      animation: `cardIn 0.4s ease ${item.delay}ms both`,
      '@keyframes cardIn': {
        '0%': { opacity: 0, transform: 'scale(0.88) translateY(6px)' },
        '100%': { opacity: 1, transform: 'scale(1) translateY(0)' },
      },
      transition: 'transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease',
      '&:hover': {
        transform: 'translateY(-3px)',
        boxShadow: `0 8px 24px ${item.accent}22`,
        borderColor: `${item.accent}35`,
        '& .menu-icon-bg': {
          background: `linear-gradient(135deg, ${item.accent}25, ${item.accent}10)`,
        },
      },
      '&:active': { transform: 'scale(0.93)' },
      // Linha topo colorida ao hover
      '&::after': {
        content: '""',
        position: 'absolute', top: 0, left: '20%', right: '20%', height: '2px',
        background: `linear-gradient(90deg, transparent, ${item.accent}, transparent)`,
        opacity: 0,
        transition: 'opacity 0.2s',
        borderRadius: '0 0 4px 4px',
      },
      '&:hover::after': { opacity: 1 },
    }}
  >
    <Box
      className="menu-icon-bg"
      sx={{
        width: 40, height: 40,
        borderRadius: '13px',
        background: `${item.accent}14`,
        border: `1px solid ${item.accent}20`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '1.25rem',
        mb: 0.6,
        transition: 'background 0.2s',
      }}
    >
      {item.icon}
    </Box>
    <Typography sx={{
      fontWeight: 800, fontSize: '0.7rem',
      color: 'text.primary', lineHeight: 1.2, textAlign: 'center',
    }}>
      {item.label}
    </Typography>
  </Box>
);

const QuickMenu = ({ setRoute }) => (
  <Box>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
      <Typography sx={{
        fontSize: '0.62rem', fontWeight: 800, color: 'text.secondary',
        letterSpacing: '1px', textTransform: 'uppercase',
      }}>
        Acesso Rápido
      </Typography>
      <Box sx={{ flex: 1, height: '1px', bgcolor: 'divider' }} />
    </Box>

    {/* Linha 1 — 4 itens */}
    <Grid container spacing={1.2} sx={{ mb: 1.2 }}>
      {MENU_ROW1.map(item => (
        <Grid item xs={3} key={item.route}>
          <MenuItem item={item} setRoute={setRoute} />
        </Grid>
      ))}
    </Grid>

    {/* Linha 2 — 3 itens */}
    <Grid container spacing={1.2}>
      {MENU_ROW2.map(item => (
        <Grid item xs={4} key={item.route}>
          <MenuItem item={item} setRoute={setRoute} />
        </Grid>
      ))}
    </Grid>
  </Box>
);

export default QuickMenu;
