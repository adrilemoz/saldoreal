import React from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';

import { money } from './constants';

const Stat = ({ label, value, sub, valueColor = 'text.primary' }) => (
  <Box sx={{ flex: 1, p: 2 }}>
    <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, color: 'text.secondary', letterSpacing: '0.5px', textTransform: 'uppercase', mb: 0.5 }}>
      {label}
    </Typography>
    <Typography sx={{ fontWeight: 800, fontSize: '1.1rem', color: valueColor, lineHeight: 1.1 }}>
      {value}
    </Typography>
    {sub && (
      <Typography sx={{ fontSize: '0.68rem', color: 'text.disabled', mt: 0.3 }}>{sub}</Typography>
    )}
  </Box>
);

const CardResumoRapido = ({ gastoHoje, maiorCategoria, projecao, debitoPendente }) => {
  const temDebito = debitoPendente > 0;

  return (
    <Card sx={{ mb: 2, borderRadius: '16px', overflow: 'hidden' }}>
      {/* linha 1 — gasto hoje + maior categoria */}
      <Box sx={{ display: 'flex', borderBottom: '1px solid', borderColor: 'divider' }}>
        <Stat
          label="Gasto hoje"
          value={gastoHoje > 0 ? money(gastoHoje) : '—'}
          sub={gastoHoje === 0 ? 'Dia tranquilo 🎉' : undefined}
          valueColor={gastoHoje > 0 ? '#EF233C' : 'text.disabled'}
        />
        <Divider orientation="vertical" flexItem />
        <Stat
          label="Maior categoria"
          value={maiorCategoria ? maiorCategoria.categoria : '—'}
          sub={maiorCategoria ? money(maiorCategoria.total) : undefined}
          valueColor={maiorCategoria ? '#7B2CBF' : 'text.disabled'}
        />
      </Box>

      {/* linha 2 — débito pendente (destaque) */}
      <Box sx={{
        p: 2,
        background: temDebito
          ? 'linear-gradient(135deg, #FFF1F3 0%, #FFF5F7 100%)'
          : 'linear-gradient(135deg, #F0FDF8 0%, #F5FFFC 100%)',
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ flex: 1 }}>
            <Typography sx={{
              fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.5px',
              textTransform: 'uppercase', mb: 0.5,
              color: temDebito ? '#9F1239' : '#065F46',
            }}>
              {temDebito ? '🔴 Débito pendente' : '✅ Débito pendente'}
            </Typography>

            <Typography sx={{
              fontWeight: 900, fontSize: '1.7rem', lineHeight: 1,
              color: temDebito ? '#EF233C' : '#06D6A0',
            }}>
              {temDebito ? money(debitoPendente) : 'Tudo pago!'}
            </Typography>

            {projecao !== null && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mt: 0.8 }}>
                <Typography sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>Projeção:</Typography>
                <Typography sx={{ fontSize: '0.78rem', fontWeight: 800, color: 'text.primary' }}>
                  {money(projecao)}
                </Typography>
                <Chip
                  label="estimado" size="small"
                  sx={{ height: 16, fontSize: '0.58rem', bgcolor: '#EFF9FF', color: '#0077B6', fontWeight: 700 }}
                />
              </Box>
            )}
          </Box>

          {/* ícone decorativo */}
          <Box sx={{
            width: 52, height: 52, borderRadius: '16px', flexShrink: 0,
            bgcolor: temDebito ? 'rgba(239,35,60,0.08)' : 'rgba(6,214,160,0.10)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.6rem',
          }}>
            {temDebito ? '💸' : '🎯'}
          </Box>
        </Box>
      </Box>
    </Card>
  );
};

export default CardResumoRapido;
