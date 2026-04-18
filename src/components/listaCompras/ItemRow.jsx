// src/components/listaCompras/ItemRow.jsx

import React from 'react';
import Box        from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Checkbox   from '@mui/material/Checkbox';
import CheckCircleRoundedIcon   from '@mui/icons-material/CheckCircleRounded';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import DeleteOutlineIcon        from '@mui/icons-material/DeleteOutline';
import { CAT_MAP, money }       from './constants';

/**
 * Linha de um item na lista de compras.
 *
 * @param {{ id, nome, categoria, quantidade, unidade, precoPorMedida, valorTotal, status }} item
 * @param {Function} onToggle  - (id) => void
 * @param {Function} onRemove  - (id) => void
 */
const ItemRow = ({ item, onToggle, onRemove }) => {
  const cat       = CAT_MAP[item.categoria] || CAT_MAP['Outros'];
  const comprado  = item.status === 'comprado' || item.marcado;
  const valorDisp = item.valorTotal ?? (item.valorEstimado * item.quantidade);

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        px: 1.5,
        py: 1.2,
        mb: 0.8,
        borderRadius: '14px',
        border: '1.5px solid',
        borderColor: comprado ? '#D1FAE5' : '#F0F0F0',
        bgcolor: comprado ? '#F0FDF8' : 'background.paper',
        transition: 'all .2s ease',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Barra lateral colorida por categoria */}
      <Box
        sx={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: 4,
          bgcolor: comprado ? '#06D6A0' : cat.cor,
          borderRadius: '4px 0 0 4px',
          transition: 'background-color .2s',
        }}
      />

      {/* Checkbox */}
      <Checkbox
        checked={comprado}
        onChange={() => onToggle(item.id)}
        icon={<RadioButtonUncheckedIcon sx={{ fontSize: '1.5rem', color: '#C4B5FD' }} />}
        checkedIcon={<CheckCircleRoundedIcon sx={{ fontSize: '1.5rem', color: '#06D6A0' }} />}
        sx={{ p: 0, ml: 0.5 }}
      />

      {/* Conteúdo central */}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography
          sx={{
            fontWeight: 700,
            fontSize: '0.88rem',
            color: comprado ? 'text.secondary' : 'text.primary',
            textDecoration: comprado ? 'line-through' : 'none',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            transition: 'all .2s',
          }}
        >
          {item.nome}
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mt: 0.3, flexWrap: 'wrap' }}>
          {/* Badge categoria */}
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 0.3,
              px: 0.8,
              py: 0.15,
              borderRadius: '8px',
              bgcolor: `${cat.cor}14`,
            }}
          >
            <Typography sx={{ fontSize: '0.65rem' }}>{cat.emoji}</Typography>
            <Typography sx={{ fontSize: '0.62rem', fontWeight: 700, color: cat.cor }}>
              {cat.label}
            </Typography>
          </Box>

          {/* Quantidade + unidade */}
          <Typography sx={{ fontSize: '0.72rem', color: 'text.secondary', fontWeight: 600 }}>
            {item.quantidade}{item.unidade || 'un'}
            {item.precoPorMedida > 0 && (
              <> · {money(item.precoPorMedida)}/{item.unidade || 'un'}</>
            )}
          </Typography>
        </Box>
      </Box>

      {/* Valor total */}
      <Box sx={{ textAlign: 'right', flexShrink: 0, mr: 0.5 }}>
        <Typography
          sx={{
            fontWeight: 800,
            fontSize: '0.88rem',
            color: comprado ? '#06D6A0' : 'text.primary',
          }}
        >
          {money(valorDisp)}
        </Typography>
      </Box>

      {/* Botão remover */}
      <IconButton
        size="small"
        onClick={() => onRemove(item.id)}
        sx={{
          color: '#E0E0E0',
          p: 0.5,
          '&:hover': { color: '#EF233C', bgcolor: '#FFF1F3' },
          transition: 'all .15s',
        }}
      >
        <DeleteOutlineIcon sx={{ fontSize: '1.1rem' }} />
      </IconButton>
    </Box>
  );
};

export default ItemRow;
