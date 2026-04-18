// src/components/listaCompras/TelaSeletorListas.jsx
//
// Ecrã de seleção de listas: criar nova ou abrir existente.
// Mostra listas abertas e concluídas separadamente.

import React, { useState } from 'react';
import Box           from '@mui/material/Box';
import Typography    from '@mui/material/Typography';
import Button        from '@mui/material/Button';
import TextField     from '@mui/material/TextField';
import Dialog        from '@mui/material/Dialog';
import DialogTitle   from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import CircularProgress from '@mui/material/CircularProgress';
import InputAdornment from '@mui/material/InputAdornment';
import AddIcon       from '@mui/icons-material/Add';
import PlaylistAddIcon from '@mui/icons-material/PlaylistAdd';

import CardLista from './CardLista';
import { money } from './constants';

/**
 * @param {object[]} listas       - array do hook useListas
 * @param {boolean}  loading      - estado de carregamento
 * @param {Function} onVoltar     - navega para TelaEscolha
 * @param {Function} onAbrirLista - (lista) => void
 * @param {Function} onCriarLista - (nome, orcamento) => Promise<void>
 * @param {Function} onExcluir    - (listaId) => Promise<void>
 * @param {Function} onReabrir    - (listaId) => Promise<void>
 */
const TelaSeletorListas = ({
  listas,
  loading,
  onVoltar,
  onAbrirLista,
  onCriarLista,
  onExcluir,
  onReabrir,
}) => {
  const [modalNova,    setModalNova]    = useState(false);
  const [nomeLista,    setNomeLista]    = useState('');
  const [orcamento,    setOrcamento]    = useState('');
  const [salvando,     setSalvando]     = useState(false);
  const [confirmExcId, setConfirmExcId] = useState(null);

  const listasAbertas    = listas.filter(l => l.status === 'aberta');
  const listasConcluidas = listas.filter(l => l.status === 'concluida');

  const handleCriar = async () => {
    if (!nomeLista.trim()) return;
    setSalvando(true);
    try {
      const orc = parseFloat(orcamento.replace(',', '.')) || 0;
      await onCriarLista(nomeLista.trim(), orc);
      setModalNova(false);
      setNomeLista('');
      setOrcamento('');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 500, margin: 'auto', px: 2, pt: 2, pb: 10, minHeight: '100vh' }}>

      {/* Cabeçalho */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <Button
          onClick={onVoltar}
          sx={{ color: 'text.secondary', minWidth: 0, p: 0.5, fontWeight: 700 }}
        >
          ←
        </Button>
        <Typography sx={{ fontWeight: 900, fontSize: '1.2rem', color: 'text.primary' }}>
          📋 Minhas Listas
        </Typography>
        {!loading && listas.length > 0 && (
          <Typography sx={{ fontSize: '0.78rem', color: 'text.secondary', ml: 'auto', fontWeight: 600 }}>
            {listasAbertas.length} aberta{listasAbertas.length !== 1 ? 's' : ''}
          </Typography>
        )}
      </Box>

      {/* Botão criar nova lista */}
      <Button
        fullWidth
        variant="contained"
        startIcon={<PlaylistAddIcon />}
        onClick={() => setModalNova(true)}
        sx={{
          mb: 3,
          py: 1.5,
          borderRadius: '16px',
          fontWeight: 800,
          fontSize: '0.95rem',
        }}
      >
        + Criar Nova Lista
      </Button>

      {/* Estado de carregamento */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress color="primary" />
        </Box>
      )}

      {/* Estado vazio */}
      {!loading && listas.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 8, opacity: 0.7 }}>
          <Typography sx={{ fontSize: '3rem', mb: 1.5 }}>📭</Typography>
          <Typography sx={{ fontWeight: 800, fontSize: '1.05rem', color: 'text.primary', mb: 0.5 }}>
            Nenhuma lista ainda
          </Typography>
          <Typography sx={{ fontSize: '0.82rem', color: 'text.secondary', lineHeight: 1.6 }}>
            Crie a sua primeira lista para começar a planear as suas compras.
          </Typography>
        </Box>
      )}

      {/* Listas abertas */}
      {!loading && listasAbertas.length > 0 && (
        <>
          <Typography sx={sectionTitle}>
            Abertas ({listasAbertas.length})
          </Typography>
          {listasAbertas.map(lista => (
            <CardLista
              key={lista.id}
              lista={lista}
              onClick={() => onAbrirLista(lista)}
              onExcluir={() => setConfirmExcId(lista.id)}
              onReabrir={() => onReabrir(lista.id)}
            />
          ))}
        </>
      )}

      {/* Listas concluídas */}
      {!loading && listasConcluidas.length > 0 && (
        <>
          <Typography sx={{ ...sectionTitle, mt: 3 }}>
            Concluídas ({listasConcluidas.length})
          </Typography>
          {listasConcluidas.map(lista => (
            <CardLista
              key={lista.id}
              lista={lista}
              onClick={undefined}
              onExcluir={() => setConfirmExcId(lista.id)}
              onReabrir={() => onReabrir(lista.id)}
            />
          ))}
        </>
      )}

      {/* ── Modal: Nova Lista ─────────────────────────────────────────── */}
      <Dialog
        open={modalNova}
        onClose={() => setModalNova(false)}
        fullWidth
        maxWidth="xs"
        PaperProps={{ sx: { borderRadius: '20px' } }}
      >
        <DialogTitle sx={{ fontWeight: 800, pb: 0.5 }}>
          📋 Nova Lista de Compras
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize: '0.82rem', color: 'text.secondary', mb: 2 }}>
            Dê um nome à sua lista e, opcionalmente, defina um orçamento máximo.
          </Typography>
          <TextField
            fullWidth
            autoFocus
            label="Nome da lista"
            placeholder="Ex: Supermercado de Abril, Churrasco…"
            value={nomeLista}
            onChange={e => setNomeLista(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleCriar()}
            sx={{ mb: 2, '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
          />
          <TextField
            fullWidth
            label="Orçamento (opcional)"
            placeholder="Ex: 250.00"
            value={orcamento}
            onChange={e => setOrcamento(e.target.value)}
            type="number"
            inputProps={{ min: 0, step: '0.01', inputMode: 'decimal' }}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Typography sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.88rem' }}>
                    R$
                  </Typography>
                </InputAdornment>
              ),
            }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 2.5, pb: 2.5, gap: 1 }}>
          <Button
            onClick={() => setModalNova(false)}
            color="inherit"
            sx={{ fontWeight: 700, borderRadius: '10px' }}
          >
            Cancelar
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCriar}
            disabled={!nomeLista.trim() || salvando}
            sx={{ fontWeight: 800, borderRadius: '10px', px: 2.5 }}
          >
            {salvando ? 'Criando…' : 'Criar Lista'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Modal: Confirmar Exclusão ─────────────────────────────────── */}
      <Dialog
        open={!!confirmExcId}
        onClose={() => setConfirmExcId(null)}
        fullWidth
        maxWidth="xs"
        PaperProps={{ sx: { borderRadius: '20px' } }}
      >
        <DialogTitle sx={{ fontWeight: 800, color: '#EF233C' }}>
          🗑️ Eliminar lista?
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ color: 'text.secondary', fontSize: '0.88rem' }}>
            Isto remove permanentemente a lista e todos os seus itens.
            Se a lista já foi concluída, os gastos lançados também serão removidos.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 2.5, pb: 2.5, gap: 1 }}>
          <Button
            onClick={() => setConfirmExcId(null)}
            color="inherit"
            sx={{ fontWeight: 700, borderRadius: '10px' }}
          >
            Cancelar
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={async () => {
              await onExcluir(confirmExcId);
              setConfirmExcId(null);
            }}
            sx={{ fontWeight: 800, borderRadius: '10px', px: 2.5 }}
          >
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

const sectionTitle = {
  fontSize: '0.68rem',
  fontWeight: 800,
  color: 'text.secondary',
  textTransform: 'uppercase',
  letterSpacing: '0.7px',
  mb: 1.5,
};

export default TelaSeletorListas;
