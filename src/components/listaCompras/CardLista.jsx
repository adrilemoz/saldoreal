// src/components/listaCompras/CardLista.jsx

import React from 'react';
import Box        from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button     from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import LinearProgress from '@mui/material/LinearProgress';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import RestoreIcon from '@mui/icons-material/Restore';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { money } from './constants';

/**
 * Card representando uma lista de compras no seletor.
 *
 * @param {object}   lista          - objeto lista do Dexie
 * @param {Function} onClick        - abre a lista (só para abertas)
 * @param {Function} onExcluir      - exclui a lista
 * @param {Function} onReabrir      - reabre lista concluída (remove gastos lançados)
 */
const CardLista = ({ lista, onClick, onExcluir, onReabrir }) => {
  const aberta    = lista.status === 'aberta';
  const concluida = lista.status === 'concluida';
  const dataCriacao = new Date(lista.dataCriacao).toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'short',
  });

  // Percentagem de orçamento utilizado (só faz sentido se tiver orçamento)
  const temOrc  = lista.orcamento > 0;
  const pctOrc  = temOrc
    ? Math.min(100, ((lista.totalEstimado || 0) / lista.orcamento) * 100)
    : 0;
  const estourou = temOrc && (lista.totalEstimado || 0) > lista.orcamento;
  const barColor = estourou ? '#EF233C' : pctOrc > 80 ? '#FFB703' : '#7B2CBF';

  return (
    <Box
      onClick={aberta ? onClick : undefined}
      sx={{
        mb: 1.5,
        p: 2,
        borderRadius: '16px',
        border: '1.5px solid',
        borderColor: aberta ? '#E0E0E0' : '#F0F0F0',
        bgcolor: 'background.paper',
        cursor: aberta ? 'pointer' : 'default',
        opacity: concluida ? 0.78 : 1,
        transition: 'all .18s ease',
        boxShadow: '0 1px 6px rgba(0,0,0,0.04)',
        ...(aberta && {
          '&:hover': { borderColor: '#7B2CBF', boxShadow: '0 4px 16px rgba(123,44,191,0.12)' },
          '&:active': { transform: 'scale(0.985)' },
        }),
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: temOrc ? 1.2 : 0 }}>
        {/* Esquerda: nome + meta */}
        <Box sx={{ flex: 1, minWidth: 0, mr: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.4 }}>
            {concluida && (
              <CheckCircleOutlineIcon sx={{ fontSize: '1rem', color: '#06D6A0', flexShrink: 0 }} />
            )}
            <Typography
              sx={{
                fontWeight: 800,
                fontSize: '0.95rem',
                color: concluida ? 'text.secondary' : 'text.primary',
                textDecoration: concluida ? 'line-through' : 'none',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {lista.nome}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
            <Typography sx={{ fontSize: '0.72rem', color: 'text.secondary', fontWeight: 600 }}>
              {aberta ? `Criada em ${dataCriacao}` : `Concluída em ${lista.dataFechamento ? new Date(lista.dataFechamento).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }) : '—'}`}
            </Typography>
            {lista.totalEstimado > 0 && (
              <Typography sx={{ fontSize: '0.72rem', color: '#7B2CBF', fontWeight: 700 }}>
                Est. {money(lista.totalEstimado)}
              </Typography>
            )}
            {concluida && lista.totalReal > 0 && (
              <Typography sx={{ fontSize: '0.72rem', color: '#06D6A0', fontWeight: 700 }}>
                Gasto {money(lista.totalReal)}
              </Typography>
            )}
            {temOrc && (
              <Typography
                sx={{
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  color: estourou ? '#EF233C' : 'text.secondary',
                  bgcolor: estourou ? '#FFF1F3' : '#F8F8F8',
                  px: 0.8,
                  py: 0.1,
                  borderRadius: '6px',
                }}
              >
                Orç. {money(lista.orcamento)}
              </Typography>
            )}
          </Box>
        </Box>

        {/* Direita: ações */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexShrink: 0 }}>
          {concluida && (
            <Button
              size="small"
              variant="outlined"
              color="warning"
              startIcon={<RestoreIcon />}
              onClick={(e) => { e.stopPropagation(); onReabrir(); }}
              sx={{
                fontWeight: 700,
                fontSize: '0.68rem',
                borderRadius: '10px',
                py: 0.4,
                px: 1,
              }}
            >
              Reabrir
            </Button>
          )}
          <IconButton
            size="small"
            onClick={(e) => { e.stopPropagation(); onExcluir(); }}
            sx={{
              color: '#C4C4C4',
              '&:hover': { color: '#EF233C', bgcolor: '#FFF1F3' },
              transition: 'all .15s',
            }}
          >
            <DeleteOutlineIcon sx={{ fontSize: '1.1rem' }} />
          </IconButton>
          {aberta && (
            <ChevronRightIcon sx={{ fontSize: '1.3rem', color: '#C4B5FD' }} />
          )}
        </Box>
      </Box>

      {/* Barra de orçamento (só para listas abertas com orçamento) */}
      {aberta && temOrc && (
        <Box>
          <LinearProgress
            variant="determinate"
            value={pctOrc}
            sx={{
              height: 5,
              borderRadius: 8,
              bgcolor: '#F0F0F0',
              '& .MuiLinearProgress-bar': {
                bgcolor: barColor,
                borderRadius: 8,
              },
            }}
          />
          <Typography
            sx={{
              fontSize: '0.6rem',
              color: estourou ? '#EF233C' : 'text.secondary',
              fontWeight: 600,
              mt: 0.5,
              textAlign: 'right',
            }}
          >
            {pctOrc.toFixed(0)}% do orçamento utilizado
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default CardLista;
