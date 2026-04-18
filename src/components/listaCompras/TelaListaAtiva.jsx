// src/components/listaCompras/TelaListaAtiva.jsx
//
// Ecrã principal da lista ativa:
// - mostra itens pendentes e coletados
// - botão "Adicionar Item" abre ModalAdicionarItem (full-screen)
// - botão "Pagar / Concluir Lista" lança gastos no Dexie

import React, { useState, useMemo, useCallback } from 'react';
import Box             from '@mui/material/Box';
import Typography      from '@mui/material/Typography';
import Button          from '@mui/material/Button';
import LinearProgress  from '@mui/material/LinearProgress';
import Dialog          from '@mui/material/Dialog';
import DialogTitle     from '@mui/material/DialogTitle';
import DialogContent   from '@mui/material/DialogContent';
import DialogActions   from '@mui/material/DialogActions';
import TextField       from '@mui/material/TextField';
import Snackbar        from '@mui/material/Snackbar';
import Alert           from '@mui/material/Alert';
import Fab             from '@mui/material/Fab';
import AddIcon         from '@mui/icons-material/Add';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import PaymentIcon     from '@mui/icons-material/Payment';
import InputAdornment  from '@mui/material/InputAdornment';

import ItemRow           from './ItemRow';
import CardOrcamento     from './CardOrcamento';
import ModalAdicionarItem from './ModalAdicionarItem';
import { money }         from './constants';

/**
 * @param {object}   lista           - objeto lista do Dexie
 * @param {object[]} itens           - itens já filtrados (sem 'removido')
 * @param {Function} onVoltar        - navega de volta ao seletor
 * @param {Function} onToggle        - (itemId) => Promise<void>
 * @param {Function} onRemove        - (itemId) => Promise<void>
 * @param {Function} onAdicionar     - (dados) => Promise<void>
 * @param {Function} onConcluir      - (listaId) => Promise<number>  → retorna total
 * @param {Function} onEditarLista   - (listaId, {nome?, orcamento?}) => Promise<void>
 * @param {Function} onLimpar        - () => Promise<void>
 */
const TelaListaAtiva = ({
  lista,
  itens,
  onVoltar,
  onToggle,
  onRemove,
  onAdicionar,
  onConcluir,
  onEditarLista,
  onLimpar,
}) => {
  const [modalAddItem,   setModalAddItem]   = useState(false);
  const [modalOrcamento, setModalOrcamento] = useState(false);
  const [modalConcluir,  setModalConcluir]  = useState(false);
  const [modalLimpar,    setModalLimpar]    = useState(false);
  const [orcInput,       setOrcInput]       = useState('');
  const [concluindo,     setConcluindo]     = useState(false);
  const [toast,          setToast]          = useState({ open: false, msg: '', sev: 'success' });

  // ── Cálculos de totais ─────────────────────────────────────────────────────
  const { totalEstimado, totalComprado, pendentes, coletados, progresso } = useMemo(() => {
    const pendentes  = itens.filter(i => i.status !== 'comprado');
    const coletados  = itens.filter(i => i.status === 'comprado');
    const totalEstimado = itens.reduce((s, i) => s + (i.valorTotal || 0), 0);
    const totalComprado = coletados.reduce((s, i) => s + (i.valorTotalReal ?? i.valorTotal ?? 0), 0);
    const progresso     = itens.length > 0
      ? Math.round((coletados.length / itens.length) * 100)
      : 0;
    return { totalEstimado, totalComprado, pendentes, coletados, progresso };
  }, [itens]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleSalvarOrcamento = async () => {
    const num = parseFloat(orcInput.replace(',', '.')) || 0;
    await onEditarLista(lista.id, { orcamento: num });
    setModalOrcamento(false);
    setOrcInput('');
  };

  const handleConcluir = async () => {
    setConcluindo(true);
    try {
      const total = await onConcluir(lista.id);
      setModalConcluir(false);
      setToast({ open: true, msg: `✅ ${money(total)} lançados nos Gastos!`, sev: 'success' });
      // Volta para o seletor após breve delay para o toast ser visível
      setTimeout(onVoltar, 1500);
    } catch {
      setToast({ open: true, msg: 'Erro ao concluir lista.', sev: 'error' });
    } finally {
      setConcluindo(false);
    }
  };

  const handleLimpar = async () => {
    await onLimpar();
    setModalLimpar(false);
  };

  return (
    <Box
      sx={{
        pb: 12,
        maxWidth: 600,
        margin: 'auto',
        px: 2,
        pt: 1.5,
        bgcolor: 'background.default',
        minHeight: '100vh',
        position: 'relative',
      }}
    >
      {/* ── Toast ──────────────────────────────────────────────────────────── */}
      <Snackbar
        open={toast.open}
        autoHideDuration={4000}
        onClose={() => setToast(t => ({ ...t, open: false }))}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          severity={toast.sev}
          variant="filled"
          sx={{ borderRadius: '12px', fontWeight: 700 }}
        >
          {toast.msg}
        </Alert>
      </Snackbar>

      {/* ── Cabeçalho ──────────────────────────────────────────────────────── */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          mb: 2,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
          <Button
            onClick={onVoltar}
            sx={{ color: 'text.secondary', minWidth: 0, p: 0.5, mt: 0.2, fontWeight: 700 }}
          >
            ←
          </Button>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
              <Typography
                sx={{
                  fontWeight: 900,
                  fontSize: '1.15rem',
                  color: 'text.primary',
                  letterSpacing: '-0.3px',
                  lineHeight: 1.2,
                }}
              >
                📋 {lista.nome}
              </Typography>
              <EditOutlinedIcon
                onClick={() => {
                  setOrcInput(lista.orcamento > 0 ? String(lista.orcamento) : '');
                  setModalOrcamento(true);
                }}
                sx={{
                  fontSize: '1rem',
                  color: '#C4B5FD',
                  cursor: 'pointer',
                  '&:hover': { color: '#7B2CBF' },
                }}
              />
            </Box>
            <Typography
              sx={{ fontSize: '0.73rem', color: 'text.secondary', mt: 0.2, fontWeight: 600 }}
            >
              {itens.length === 0
                ? 'Lista vazia — adicione itens'
                : `${coletados.length} de ${itens.length} coletados · ${progresso}%`}
            </Typography>
          </Box>
        </Box>

        {/* Limpar */}
        {itens.length > 0 && (
          <Button
            size="small"
            variant="outlined"
            onClick={() => setModalLimpar(true)}
            sx={{
              borderRadius: '10px',
              fontSize: '0.7rem',
              borderColor: '#FFCDD2',
              color: '#EF233C',
              '&:hover': { bgcolor: '#FFF1F3', borderColor: '#EF233C' },
            }}
          >
            🗑 Limpar
          </Button>
        )}
      </Box>

      {/* ── Barra de progresso geral ────────────────────────────────────────── */}
      {itens.length > 0 && (
        <Box sx={{ mb: 2 }}>
          <LinearProgress
            variant="determinate"
            value={progresso}
            sx={{
              height: 6,
              borderRadius: 8,
              bgcolor: '#E8E8E8',
              '& .MuiLinearProgress-bar': {
                background: 'linear-gradient(90deg, #7B2CBF 0%, #F72585 100%)',
                borderRadius: 8,
              },
            }}
          />
        </Box>
      )}

      {/* ── Card de orçamento ───────────────────────────────────────────────── */}
      <CardOrcamento
        totalEstimado={totalEstimado}
        totalComprado={totalComprado}
        orcamento={lista.orcamento || 0}
        onEditarOrc={() => {
          setOrcInput(lista.orcamento > 0 ? String(lista.orcamento) : '');
          setModalOrcamento(true);
        }}
        qtdTotal={itens.length}
        qtdComprados={coletados.length}
      />

      {/* ── Estado vazio ────────────────────────────────────────────────────── */}
      {itens.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 6 }}>
          <Box
            sx={{
              width: 80,
              height: 80,
              borderRadius: '24px',
              margin: '0 auto 16px',
              background: 'linear-gradient(135deg, #F5F0FF 0%, #EFF9FF 100%)',
              border: '2px dashed #C4B5FD',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '2.2rem',
            }}
          >
            🛒
          </Box>
          <Typography sx={{ fontWeight: 800, fontSize: '1.05rem', color: 'text.primary', mb: 0.5 }}>
            Lista vazia
          </Typography>
          <Typography sx={{ fontSize: '0.82rem', color: 'text.secondary', lineHeight: 1.6 }}>
            Toque no botão ✚ para adicionar o primeiro item.
          </Typography>
        </Box>
      )}

      {/* ── Itens Pendentes ─────────────────────────────────────────────────── */}
      {pendentes.length > 0 && (
        <Box sx={{ mb: 2.5 }}>
          <SectionHeader label="Pendentes" count={pendentes.length} color="#7B2CBF" bgColor="#F5F0FF" />
          {pendentes.map(item => (
            <ItemRow key={item.id} item={item} onToggle={onToggle} onRemove={onRemove} />
          ))}
        </Box>
      )}

      {/* ── Itens Coletados ─────────────────────────────────────────────────── */}
      {coletados.length > 0 && (
        <Box sx={{ mb: 2.5 }}>
          <SectionHeader label="Coletados" count={coletados.length} color="#06D6A0" bgColor="#F0FDF8" />
          {coletados.map(item => (
            <ItemRow key={item.id} item={item} onToggle={onToggle} onRemove={onRemove} />
          ))}
        </Box>
      )}

      {/* ── Botão Pagar / Concluir Lista ────────────────────────────────────── */}
      {coletados.length > 0 && (
        <Box
          sx={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            p: 2,
            bgcolor: 'background.default',
            borderTop: '1px solid',
            borderColor: 'divider',
            zIndex: 10,
            maxWidth: 600,
            mx: 'auto',
          }}
        >
          <Button
            fullWidth
            variant="contained"
            color="success"
            size="large"
            startIcon={<PaymentIcon />}
            onClick={() => setModalConcluir(true)}
            sx={{
              py: 1.6,
              fontWeight: 900,
              borderRadius: '16px',
              fontSize: '0.95rem',
              boxShadow: '0 4px 20px rgba(6,214,160,0.35)',
            }}
          >
            💳 Pagar / Concluir Lista · {money(totalComprado)}
          </Button>
        </Box>
      )}

      {/* ── FAB: Adicionar Item ──────────────────────────────────────────────── */}
      <Fab
        color="primary"
        onClick={() => setModalAddItem(true)}
        sx={{
          position: 'fixed',
          bottom: coletados.length > 0 ? 90 : 24,
          right: 20,
          zIndex: 11,
          boxShadow: '0 4px 20px rgba(123,44,191,0.4)',
          transition: 'bottom .3s ease',
        }}
      >
        <AddIcon />
      </Fab>

      {/* ════════════════════ MODAIS ════════════════════ */}

      {/* Modal: Adicionar Item (full-screen) */}
      <ModalAdicionarItem
        open={modalAddItem}
        onClose={() => setModalAddItem(false)}
        onAdicionar={onAdicionar}
      />

      {/* Modal: Editar Orçamento */}
      <Dialog
        open={modalOrcamento}
        onClose={() => setModalOrcamento(false)}
        fullWidth
        maxWidth="xs"
        PaperProps={{ sx: { borderRadius: '20px' } }}
      >
        <DialogTitle sx={{ fontWeight: 800 }}>💰 Orçamento da Lista</DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize: '0.82rem', color: 'text.secondary', mb: 2 }}>
            Define um limite de gastos para esta lista. Irás ver um aviso ao se aproximares do limite.
          </Typography>
          <TextField
            fullWidth
            autoFocus
            label="Orçamento máximo (R$)"
            placeholder="Ex: 350.00"
            value={orcInput}
            onChange={e => setOrcInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSalvarOrcamento()}
            type="number"
            inputProps={{ min: 0, step: '0.01', inputMode: 'decimal' }}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Typography sx={{ fontWeight: 700, color: 'text.secondary' }}>R$</Typography>
                </InputAdornment>
              ),
            }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 2.5, pb: 2.5, gap: 1 }}>
          <Button onClick={() => setModalOrcamento(false)} color="inherit" sx={{ fontWeight: 700 }}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleSalvarOrcamento}
            sx={{ fontWeight: 800, borderRadius: '10px', px: 2.5 }}
          >
            Guardar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal: Confirmar Conclusão */}
      <Dialog
        open={modalConcluir}
        onClose={() => setModalConcluir(false)}
        fullWidth
        maxWidth="xs"
        PaperProps={{ sx: { borderRadius: '20px' } }}
      >
        <DialogTitle sx={{ fontWeight: 800 }}>✅ Concluir e Registar Gastos?</DialogTitle>
        <DialogContent>
          <Typography sx={{ color: 'text.secondary', fontSize: '0.88rem', lineHeight: 1.6 }}>
            Os <strong>{coletados.length} itens coletados</strong> ({money(totalComprado)}) serão lançados
            como <strong>despesas</strong> no seu dashboard financeiro.
          </Typography>
          {pendentes.length > 0 && (
            <Typography sx={{ color: '#FFB703', fontSize: '0.82rem', mt: 1.5, fontWeight: 600 }}>
              ⚠️ {pendentes.length} item(ns) pendente(s) não serão lançados.
            </Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 2.5, pb: 2.5, gap: 1 }}>
          <Button onClick={() => setModalConcluir(false)} color="inherit" sx={{ fontWeight: 700 }}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            color="success"
            onClick={handleConcluir}
            disabled={concluindo}
            sx={{ fontWeight: 900, borderRadius: '10px', px: 2.5 }}
          >
            {concluindo ? 'Registando…' : '💳 Confirmar Pagamento'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal: Limpar Lista */}
      <Dialog
        open={modalLimpar}
        onClose={() => setModalLimpar(false)}
        fullWidth
        maxWidth="xs"
        PaperProps={{ sx: { borderRadius: '20px' } }}
      >
        <DialogTitle sx={{ fontWeight: 800, color: '#EF233C' }}>🗑️ Limpar lista?</DialogTitle>
        <DialogContent>
          <Typography sx={{ color: 'text.secondary', fontSize: '0.88rem' }}>
            Isto remove todos os <strong>{itens.length} itens</strong> da lista.
            A lista em si fica guardada e podes adicionar novos itens depois.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 2.5, pb: 2.5, gap: 1 }}>
          <Button onClick={() => setModalLimpar(false)} color="inherit" sx={{ fontWeight: 700 }}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleLimpar}
            sx={{ fontWeight: 800, borderRadius: '10px', px: 2.5 }}
          >
            Limpar Tudo
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

// ── Pequeno helper de cabeçalho de secção ──────────────────────────────────
const SectionHeader = ({ label, count, color, bgColor }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.2 }}>
    <Typography
      sx={{
        fontWeight: 800,
        fontSize: '0.68rem',
        color,
        letterSpacing: '0.7px',
        textTransform: 'uppercase',
      }}
    >
      {label}
    </Typography>
    <Box
      sx={{
        bgcolor: bgColor,
        borderRadius: '20px',
        px: 1,
        py: 0.15,
      }}
    >
      <Typography sx={{ fontSize: '0.62rem', fontWeight: 800, color }}>
        {count}
      </Typography>
    </Box>
  </Box>
);

export default TelaListaAtiva;
