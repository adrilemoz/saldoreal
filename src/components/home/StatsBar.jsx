// src/components/home/StatsBar.jsx — REDESIGN
// Cards individuais com ícone, valor destaque e label — design glassmorphism escuro.

import React from 'react';
import Box       from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { money } from './constants';

const STATS_CONFIG = [
  { key: 'hoje',      accent: '#FF6B9D', icon: '🗓', label: 'Hoje' },
  { key: 'cat',       accent: '#C084FC', icon: '🏆', label: 'Top Categoria' },
  { key: 'projecao',  accent: '#38BDF8', icon: '📈', label: 'Projeção' },
];

const StatCard = ({ icon, label, value, sub, accent, delay = 0 }) => (
  <Box sx={{
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    py: 1.3,
    px: 0.5,
    borderRadius: '16px',
    bgcolor: 'background.paper',
    border: '1px solid',
    borderColor: `${accent}22`,
    boxShadow: `0 4px 20px rgba(0,0,0,0.07), 0 0 0 0 ${accent}`,
    position: 'relative',
    overflow: 'hidden',
    transition: 'all 0.22s ease',
    cursor: 'default',
    animation: `fadeSlideUp 0.4s ease ${delay}ms both`,
    '@keyframes fadeSlideUp': {
      '0%': { opacity: 0, transform: 'translateY(8px)' },
      '100%': { opacity: 1, transform: 'translateY(0)' },
    },
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: `0 8px 24px ${accent}22, 0 2px 8px rgba(0,0,0,0.08)`,
      borderColor: `${accent}44`,
    },
    '&::before': {
      content: '""',
      position: 'absolute', top: 0, left: 0, right: 0, height: '2px',
      background: `linear-gradient(90deg, transparent, ${accent}, transparent)`,
      opacity: 0.7,
    },
  }}>
    {/* Ícone com halo */}
    <Box sx={{
      width: 36, height: 36, borderRadius: '12px',
      bgcolor: `${accent}14`,
      border: `1px solid ${accent}28`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: '1rem', mb: 0.7,
    }}>
      {icon}
    </Box>
    <Typography sx={{
      fontWeight: 900, fontSize: '0.85rem',
      color: value !== '—' ? accent : 'text.disabled',
      lineHeight: 1.1, overflow: 'hidden',
      textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      maxWidth: '100%', px: 0.5,
    }}>
      {value}
    </Typography>
    {sub && (
      <Typography sx={{ fontSize: '0.57rem', color: 'text.disabled', mt: 0.2, lineHeight: 1 }}>
        {sub}
      </Typography>
    )}
    <Typography sx={{
      fontSize: '0.56rem', color: 'text.secondary', fontWeight: 700,
      letterSpacing: '0.5px', textTransform: 'uppercase', mt: 0.3, lineHeight: 1,
    }}>
      {label}
    </Typography>
  </Box>
);

const StatsBar = ({ gastoHoje, maiorCategoria, projecao }) => (
  <Box sx={{ display: 'flex', gap: 1, mb: 1.5 }}>
    <StatCard
      icon="🗓" label="Hoje" delay={0}
      accent="#FF6B9D"
      value={gastoHoje > 0 ? money(gastoHoje) : '—'}
      sub={gastoHoje === 0 ? 'Dia livre 🎉' : undefined}
    />
    <StatCard
      icon="🏆" label="Top Categoria" delay={60}
      accent="#C084FC"
      value={maiorCategoria ? maiorCategoria.categoria : '—'}
      sub={maiorCategoria ? money(maiorCategoria.total) : undefined}
    />
    <StatCard
      icon="📈" label="Projeção" delay={120}
      accent="#38BDF8"
      value={projecao ? money(projecao) : '—'}
      sub={projecao ? 'estimado' : undefined}
    />
  </Box>
);

export default StatsBar;
