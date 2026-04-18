import React from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';

import { insightColors } from './constants';

const CardInsight = ({ insight }) => {
  if (!insight) return null;
  const c = insightColors[insight.tipo] || insightColors.info;

  return (
    <Card sx={{
      p: 0, mb: 2,
      bgcolor: c.bg,
      border: `1.5px solid ${c.border}`,
      borderRadius: '14px',
      boxShadow: 'none',
      overflow: 'hidden',
    }}>
      <Box sx={{ display: 'flex', alignItems: 'stretch' }}>
        {/* barra lateral colorida */}
        <Box sx={{ width: 4, bgcolor: c.border, flexShrink: 0 }} />
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 2, py: 1.5, flex: 1 }}>
          <Box sx={{
            width: 38, height: 38, borderRadius: '12px',
            bgcolor: `${c.border}80`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.25rem', flexShrink: 0,
          }}>
            {insight.emoji}
          </Box>
          <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: c.text, lineHeight: 1.4, flex: 1 }}>
            {insight.texto}
          </Typography>
        </Box>
      </Box>
    </Card>
  );
};

export default CardInsight;
