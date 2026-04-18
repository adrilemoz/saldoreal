// src/components/listaCompras/CardOrcamento.jsx

import React from 'react';
import Box            from '@mui/material/Box';
import Typography     from '@mui/material/Typography';
import LinearProgress from '@mui/material/LinearProgress';
import Chip           from '@mui/material/Chip';
import { money }      from './constants';

/**
 * Card de resumo do orçamento e progresso de gastos.
 *
 * @param {number}   totalEstimado  - soma dos valores estimados (todos os itens)
 * @param {number}   totalComprado  - soma dos itens marcados como comprado
 * @param {number}   orcamento      - limite definido pelo utilizador (0 = sem limite)
 * @param {Function} onEditarOrc    - abre edição do orçamento
 * @param {number}   qtdTotal       - total de itens na lista
 * @param {number}   qtdComprados   - itens marcados
 */
const CardOrcamento = ({
  totalEstimado,
  totalComprado,
  orcamento,
  onEditarOrc,
  qtdTotal,
  qtdComprados,
}) => {
  const temOrc   = orcamento > 0;
  const referencia = temOrc ? orcamento : totalEstimado;
  const pctUsado = referencia > 0
    ? Math.min(100, (totalEstimado / referencia) * 100)
    : 0;
  const falta      = orcamento - totalEstimado;
  const estourou   = temOrc && totalEstimado > orcamento;
  const barColor   = estourou ? '#EF233C' : pctUsado > 80 ? '#FFB703' : '#06D6A0';
  const progresso  = qtdTotal > 0 ? Math.round((qtdComprados / qtdTotal) * 100) : 0;

  return (
    <Box
      sx={{
        mb: 2,
        p: 0,
        overflow: 'hidden',
        borderRadius: '16px',
        border: estourou ? '2px solid #FFCDD2' : '1.5px solid #F0F0F0',
        bgcolor: 'background.paper',
        boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
      }}
    >
      {/* Cabeçalho */}
      <Box
        sx={{
          px: 2,
          py: 1.2,
          background: 'linear-gradient(135deg, #7B2CBF08 0%, #F7258508 100%)',
          borderBottom: '1px solid #F5F5F5',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Typography
          sx={{
            fontWeight: 800,
            fontSize: '0.68rem',
            color: '#7B2CBF',
            letterSpacing: '0.7px',
            textTransform: 'uppercase',
          }}
        >
          🛒 Resumo da Compra
        </Typography>
        {estourou && (
          <Chip
            label="Orçamento excedido"
            size="small"
            sx={{
              bgcolor: '#FFF1F3',
              color: '#EF233C',
              fontWeight: 700,
              fontSize: '0.6rem',
              height: 20,
            }}
          />
        )}
        {!estourou && qtdComprados > 0 && (
          <Chip
            label={`${progresso}% concluído`}
            size="small"
            sx={{
              bgcolor: '#F0FDF8',
              color: '#06D6A0',
              fontWeight: 700,
              fontSize: '0.6rem',
              height: 20,
            }}
          />
        )}
      </Box>

      <Box sx={{ p: 2 }}>
        {/* Linha de orçamento clicável */}
        <Box
          onClick={onEditarOrc}
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            mb: 1.5,
            cursor: 'pointer',
            p: 1.5,
            borderRadius: '12px',
            bgcolor: '#FAFAFA',
            border: '1.5px dashed #E0E0E0',
            '&:hover': { bgcolor: '#F5F0FF', borderColor: '#C4B5FD' },
            transition: 'all .15s',
          }}
        >
          <Box>
            <Typography
              sx={{
                fontSize: '0.62rem',
                fontWeight: 700,
                color: 'text.secondary',
                textTransform: 'uppercase',
                letterSpacing: 0.5,
                mb: 0.3,
              }}
            >
              {temOrc ? 'Orçamento definido' : '+ Definir Orçamento'}
            </Typography>
            <Typography
              sx={{
                fontWeight: 800,
                fontSize: '1.1rem',
                color: temOrc ? 'text.primary' : '#C4B5FD',
              }}
            >
              {temOrc ? money(orcamento) : 'Toque para definir'}
            </Typography>
          </Box>
          {temOrc && (
            <Box sx={{ textAlign: 'right' }}>
              <Typography
                sx={{
                  fontSize: '0.62rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                  color: estourou ? '#EF233C' : '#06D6A0',
                  mb: 0.3,
                }}
              >
                {estourou ? 'Acima do limite' : 'Ainda disponível'}
              </Typography>
              <Typography
                sx={{
                  fontWeight: 800,
                  fontSize: '1.1rem',
                  color: estourou ? '#EF233C' : '#06D6A0',
                }}
              >
                {money(Math.abs(falta))}
              </Typography>
            </Box>
          )}
        </Box>

        {/* Barra de progresso de orçamento */}
        {temOrc && (
          <Box sx={{ mb: 1.5 }}>
            <LinearProgress
              variant="determinate"
              value={pctUsado}
              sx={{
                height: 8,
                borderRadius: 8,
                bgcolor: '#F0F0F0',
                '& .MuiLinearProgress-bar': {
                  bgcolor: barColor,
                  borderRadius: 8,
                  transition: 'width .4s ease',
                },
              }}
            />
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                mt: 0.5,
              }}
            >
              <Typography
                sx={{ fontSize: '0.62rem', color: 'text.secondary', fontWeight: 600 }}
              >
                {money(totalEstimado)} estimado
              </Typography>
              <Typography
                sx={{ fontSize: '0.62rem', color: barColor, fontWeight: 800 }}
              >
                {pctUsado.toFixed(0)}%
              </Typography>
            </Box>
          </Box>
        )}

        {/* Blocos de totais */}
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Box
            sx={{
              flex: 1,
              p: 1.5,
              bgcolor: '#F5F0FF',
              borderRadius: '12px',
              textAlign: 'center',
            }}
          >
            <Typography
              sx={{
                fontSize: '0.58rem',
                fontWeight: 700,
                color: '#7B2CBF',
                mb: 0.3,
                textTransform: 'uppercase',
                letterSpacing: 0.4,
              }}
            >
              No Carrinho
            </Typography>
            <Typography
              sx={{ fontWeight: 900, fontSize: '0.95rem', color: '#7B2CBF' }}
            >
              {money(totalEstimado)}
            </Typography>
          </Box>

          {totalComprado > 0 && (
            <Box
              sx={{
                flex: 1,
                p: 1.5,
                bgcolor: '#F0FDF8',
                borderRadius: '12px',
                textAlign: 'center',
              }}
            >
              <Typography
                sx={{
                  fontSize: '0.58rem',
                  fontWeight: 700,
                  color: '#06D6A0',
                  mb: 0.3,
                  textTransform: 'uppercase',
                  letterSpacing: 0.4,
                }}
              >
                Já Coletado
              </Typography>
              <Typography
                sx={{ fontWeight: 900, fontSize: '0.95rem', color: '#06D6A0' }}
              >
                {money(totalComprado)}
              </Typography>
            </Box>
          )}

          {qtdTotal > 0 && (
            <Box
              sx={{
                px: 1.5,
                py: 1.5,
                bgcolor: '#F8F8F8',
                borderRadius: '12px',
                textAlign: 'center',
                minWidth: 56,
              }}
            >
              <Typography
                sx={{
                  fontSize: '0.58rem',
                  fontWeight: 700,
                  color: 'text.secondary',
                  mb: 0.3,
                  textTransform: 'uppercase',
                  letterSpacing: 0.4,
                }}
              >
                Itens
              </Typography>
              <Typography
                sx={{ fontWeight: 900, fontSize: '0.95rem', color: 'text.primary' }}
              >
                {qtdComprados}/{qtdTotal}
              </Typography>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default CardOrcamento;
