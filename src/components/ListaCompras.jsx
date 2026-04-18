// ─────────────────────────────────────────────────────────────────────────────
// src/components/ListaCompras.jsx
// ERRO CRÍTICO CORRIGIDO — Removido 100% de localStorage.
// Integrado com Dexie (tabelas listas + itensLista) via hook useListas.
// Fluxo condicional em ecrã inteiro:
//   Opção A — Compra Avulsa (itens soltos, sem lista formal)
//   Opção B — Lista Completa (nova ou reutilizar lista guardada)
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Box            from '@mui/material/Box';
import Typography     from '@mui/material/Typography';
import Card           from '@mui/material/Card';
import Button         from '@mui/material/Button';
import IconButton     from '@mui/material/IconButton';
import TextField      from '@mui/material/TextField';
import Collapse       from '@mui/material/Collapse';
import LinearProgress from '@mui/material/LinearProgress';
import Chip           from '@mui/material/Chip';
import Dialog         from '@mui/material/Dialog';
import DialogTitle    from '@mui/material/DialogTitle';
import DialogContent  from '@mui/material/DialogContent';
import DialogActions  from '@mui/material/DialogActions';
import Snackbar       from '@mui/material/Snackbar';
import CircularProgress from '@mui/material/CircularProgress';

import { useListas } from '../hooks/useListas';

// ── constantes ────────────────────────────────────────────────────────────────
const money = (v) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);

const CATEGORIAS = [
  { id: 'Carnes',     emoji: '🥩', label: 'Carnes',     cor: '#EF233C' },
  { id: 'Hortifruti', emoji: '🥦', label: 'Hortifruti', cor: '#06D6A0' },
  { id: 'Laticinios', emoji: '🥛', label: 'Laticínios', cor: '#00B4D8' },
  { id: 'Padaria',    emoji: '🍞', label: 'Padaria',    cor: '#FFB703' },
  { id: 'Bebidas',    emoji: '🥤', label: 'Bebidas',    cor: '#7B2CBF' },
  { id: 'Higiene',    emoji: '🧴', label: 'Higiene',    cor: '#F72585' },
  { id: 'Limpeza',    emoji: '🧹', label: 'Limpeza',    cor: '#06D6A0' },
  { id: 'Outros',     emoji: '📦', label: 'Outros',     cor: '#6B7280' },
];

const FORM_VAZIO = { nome: '', qty: 1, preco: 0, categoria: 'Outros' };

// ── Telas / fluxos ────────────────────────────────────────────────────────────
// 'escolha'        — tela inicial: Avulsa ou Lista?
// 'avulsa'         — fluxo rápido sem lista formal
// 'lista_seletor'  — criar nova lista ou escolher existente
// 'lista_ativa'    — lista aberta com itens

// ════════════════════════════════════════════════════════════════════════════

// ── Subcomponente: Stepper de quantidade ─────────────────────────────────────
const Stepper = ({ value, onChange, min = 1 }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', bgcolor: '#F5F0FF', borderRadius: '12px', overflow: 'hidden', height: 40, width: 110 }}>
    <Button onClick={() => onChange(Math.max(min, value - 1))}
      sx={{ minWidth: 36, height: '100%', p: 0, fontSize: '1.2rem', fontWeight: 900, color: '#7B2CBF', '&:active': { transform: 'scale(0.8)' }, borderRadius: 0 }}>
      −
    </Button>
    <Typography sx={{ flex: 1, fontWeight: 800, fontSize: '0.95rem', textAlign: 'center', color: '#1A1A2E' }}>
      {value}
    </Typography>
    <Button onClick={() => onChange(value + 1)}
      sx={{ minWidth: 36, height: '100%', p: 0, fontSize: '1.2rem', fontWeight: 900, color: '#7B2CBF', '&:active': { transform: 'scale(0.8)' }, borderRadius: 0 }}>
      +
    </Button>
  </Box>
);

// ── Subcomponente: Seletor de categoria ──────────────────────────────────────
const SeletorCategoria = ({ value, onChange }) => (
  <Box sx={{ display: 'flex', gap: 0.8, overflowX: 'auto', pb: 0.5, '&::-webkit-scrollbar': { display: 'none' } }}>
    {CATEGORIAS.map(cat => {
      const ativo = value === cat.id;
      return (
        <Box key={cat.id} onClick={() => onChange(cat.id)} sx={{
          flexShrink: 0, px: 1.2, py: 0.6, borderRadius: '20px', cursor: 'pointer',
          border: '2px solid', borderColor: ativo ? cat.cor : '#E8E8E8',
          bgcolor: ativo ? `${cat.cor}14` : '#FAFAFA',
          display: 'flex', alignItems: 'center', gap: 0.5, transition: 'all .15s',
          '&:active': { transform: 'scale(0.92)' },
        }}>
          <Typography sx={{ fontSize: '0.85rem', lineHeight: 1 }}>{cat.emoji}</Typography>
          <Typography sx={{ fontSize: '0.7rem', fontWeight: 800, whiteSpace: 'nowrap',
            color: ativo ? cat.cor : '#6B7280' }}>
            {cat.label}
          </Typography>
        </Box>
      );
    })}
  </Box>
);

// ── Subcomponente: Card de item ───────────────────────────────────────────────
const ItemCard = ({ item, onToggle, onRemove }) => {
  const cat = CATEGORIAS.find(c => c.id === item.categoria) || CATEGORIAS[7];
  return (
    <Card sx={{
      mb: 1, p: 0, overflow: 'hidden', border: '1.5px solid',
      borderColor: item.marcado || item.status === 'comprado' ? '#A7F3D0' : '#F0F0F0',
      bgcolor:     item.marcado || item.status === 'comprado' ? '#F0FDF8' : '#FFFFFF',
      transition: 'all .2s ease',
      opacity:    (item.marcado || item.status === 'comprado') ? 0.75 : 1,
      '&:active': { transform: 'scale(0.98)' },
    }}>
      <Box sx={{ display: 'flex', alignItems: 'center', p: 0 }}>
        <Box sx={{ width: 4, alignSelf: 'stretch', bgcolor: (item.marcado || item.status === 'comprado') ? '#A7F3D0' : cat.cor, flexShrink: 0 }} />
        <Box onClick={() => onToggle(item.id)} sx={{
          mx: 1.5, width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: '2.5px solid', transition: 'all .18s',
          borderColor: (item.marcado || item.status === 'comprado') ? '#06D6A0' : '#E0E0E0',
          bgcolor:     (item.marcado || item.status === 'comprado') ? '#06D6A0' : 'transparent',
          '&:active': { transform: 'scale(0.85)' },
        }}>
          {(item.marcado || item.status === 'comprado') && (
            <Typography sx={{ fontSize: '0.7rem', color: '#fff', fontWeight: 900, lineHeight: 1 }}>✓</Typography>
          )}
        </Box>
        <Typography sx={{ fontSize: '1.2rem', flexShrink: 0, mr: 1 }}>{cat.emoji}</Typography>
        <Box sx={{ flex: 1, py: 1.5, minWidth: 0 }}>
          <Typography sx={{
            fontWeight: 700, fontSize: '0.9rem', lineHeight: 1.2, whiteSpace: 'nowrap',
            overflow: 'hidden', textOverflow: 'ellipsis',
            textDecoration: (item.marcado || item.status === 'comprado') ? 'line-through' : 'none',
            color: (item.marcado || item.status === 'comprado') ? 'text.disabled' : 'text.primary',
          }}>
            {item.nome}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mt: 0.3, flexWrap: 'wrap' }}>
            <Typography sx={{ fontSize: '0.68rem', color: 'text.secondary', fontWeight: 600 }}>
              {(item.qty || item.quantidade || 1)}×{money(item.preco || item.valorEstimado || 0)}
            </Typography>
            <Chip label={cat.label} size="small" sx={{
              height: 16, fontSize: '0.58rem', fontWeight: 700,
              bgcolor: `${cat.cor}14`, color: cat.cor, border: 'none',
            }} />
          </Box>
        </Box>
        <Typography sx={{ fontWeight: 800, fontSize: '0.9rem', flexShrink: 0, px: 1,
          color: (item.marcado || item.status === 'comprado') ? '#06D6A0' : '#1A1A2E' }}>
          {money((item.qty || item.quantidade || 1) * (item.preco || item.valorEstimado || 0))}
        </Typography>
        <IconButton size="small" onClick={() => onRemove(item.id)} sx={{
          mr: 1, color: '#EF233C', bgcolor: '#FFF1F3', borderRadius: '8px', p: 0.6, flexShrink: 0,
          '&:hover': { bgcolor: '#FFCDD2' }, '&:active': { transform: 'scale(0.88)' },
        }}>
          <Typography sx={{ fontSize: '0.68rem', lineHeight: 1, fontWeight: 800 }}>✕</Typography>
        </IconButton>
      </Box>
    </Card>
  );
};

// ── Subcomponente: Formulário de novo item ────────────────────────────────────
const FormNovoItem = ({ onAdicionar, onCancelar }) => {
  const [form, setForm] = useState(FORM_VAZIO);

  const handlePrecoChange = (e) => {
    const num = parseFloat(e.target.value.replace(/\D/g, '')) / 100;
    setForm(prev => ({ ...prev, preco: isNaN(num) ? 0 : num }));
  };

  const handleAdicionar = () => {
    if (!form.nome.trim()) return;
    onAdicionar(form);
    setForm(FORM_VAZIO);
  };

  return (
    <Card sx={{ mb: 2.5, p: 2, border: '2px solid #7B2CBF', borderRadius: '16px' }}>
      <Typography sx={{ fontWeight: 800, fontSize: '0.75rem', color: '#7B2CBF', mb: 2, textTransform: 'uppercase', letterSpacing: 0.8 }}>
        ✏️ Novo Item
      </Typography>
      <TextField fullWidth size="small" label="Nome do item" autoFocus
        value={form.nome}
        onChange={e => setForm(p => ({ ...p, nome: e.target.value }))}
        onKeyDown={e => e.key === 'Enter' && handleAdicionar()}
        sx={{ mb: 2 }}
      />
      <Box sx={{ display: 'flex', gap: 1.5, mb: 2, alignItems: 'flex-end' }}>
        <Box>
          <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, color: 'text.secondary', mb: 0.8, textTransform: 'uppercase', letterSpacing: 0.4 }}>
            Quantidade
          </Typography>
          <Stepper value={form.qty} onChange={qty => setForm(p => ({ ...p, qty }))} />
        </Box>
        <Box sx={{ flex: 1 }}>
          <TextField fullWidth size="small" label="Preço unitário" placeholder="R$ 0,00"
            value={form.preco === 0 ? '' : money(form.preco)}
            onChange={handlePrecoChange}
            inputProps={{ inputMode: 'numeric' }}
          />
        </Box>
      </Box>
      <Collapse in={form.preco > 0}>
        <Box sx={{ mb: 2, p: 1.2, bgcolor: '#F5F0FF', borderRadius: '10px', textAlign: 'center', border: '1px solid #C4B5FD' }}>
          <Typography sx={{ fontWeight: 800, fontSize: '0.9rem', color: '#7B2CBF' }}>
            Subtotal: {money(form.qty * form.preco)}
          </Typography>
        </Box>
      </Collapse>
      <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, color: 'text.secondary', mb: 1, textTransform: 'uppercase', letterSpacing: 0.4 }}>
        Categoria
      </Typography>
      <SeletorCategoria value={form.categoria} onChange={v => setForm(p => ({ ...p, categoria: v }))} />
      <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
        {onCancelar && (
          <Button variant="outlined" color="inherit" onClick={onCancelar}
            sx={{ fontWeight: 700, color: 'text.secondary', borderRadius: '12px' }}>
            Cancelar
          </Button>
        )}
        <Button fullWidth variant="contained" onClick={handleAdicionar} disabled={!form.nome.trim()}
          sx={{ fontWeight: 800, borderRadius: '12px', py: 1.3 }}>
          Adicionar à Lista
        </Button>
      </Box>
    </Card>
  );
};

// ── Subcomponente: Card resumo orçamento ─────────────────────────────────────
const CardOrcamento = ({ totalCarrinho, totalMarcado, qtdMarcados, orcamento, onEditarOrc }) => {
  const temOrc   = orcamento > 0;
  const pctUsado = temOrc ? Math.min(100, (totalCarrinho / orcamento) * 100) : 0;
  const falta    = orcamento - totalCarrinho;
  const estourou = temOrc && totalCarrinho > orcamento;
  const barColor = estourou ? '#EF233C' : pctUsado > 80 ? '#FFB703' : '#06D6A0';

  return (
    <Card sx={{ mb: 2, p: 0, overflow: 'hidden', border: estourou ? '2px solid #FFCDD2' : '1.5px solid #F0F0F0' }}>
      <Box sx={{
        px: 2, py: 1.5, background: 'linear-gradient(135deg, #7B2CBF08 0%, #F7258508 100%)',
        borderBottom: '1px solid #F5F5F5',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <Typography sx={{ fontWeight: 800, fontSize: '0.72rem', color: '#7B2CBF', letterSpacing: '0.6px', textTransform: 'uppercase' }}>
          🛒 Resumo da Compra
        </Typography>
        {estourou && (
          <Chip label="Orçamento estourado" size="small"
            sx={{ bgcolor: '#FFF1F3', color: '#EF233C', fontWeight: 700, fontSize: '0.62rem', height: 20 }} />
        )}
      </Box>
      <Box sx={{ p: 2 }}>
        <Box onClick={onEditarOrc} sx={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          mb: temOrc ? 1.5 : 0, cursor: 'pointer', p: 1.5, borderRadius: '12px',
          bgcolor: '#FAFAFA', border: '1.5px dashed #E0E0E0',
          '&:hover': { bgcolor: '#F5F0FF', borderColor: '#C4B5FD' }, transition: 'all .15s',
        }}>
          <Box>
            <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.5, mb: 0.2 }}>
              Orçamento total
            </Typography>
            <Typography sx={{ fontWeight: 800, fontSize: '1.1rem', color: temOrc ? '#1A1A2E' : '#C4B5FD' }}>
              {temOrc ? money(orcamento) : '+ Definir orçamento'}
            </Typography>
          </Box>
          {temOrc && (
            <Box sx={{ textAlign: 'right' }}>
              <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5,
                color: estourou ? '#EF233C' : '#06D6A0', mb: 0.2 }}>
                {estourou ? 'Acima do limite' : 'Disponível'}
              </Typography>
              <Typography sx={{ fontWeight: 800, fontSize: '1.1rem', color: estourou ? '#EF233C' : '#06D6A0' }}>
                {money(Math.abs(falta))}
              </Typography>
            </Box>
          )}
        </Box>

        {temOrc && (
          <Box sx={{ mb: 1.5 }}>
            <LinearProgress variant="determinate" value={pctUsado}
              sx={{ height: 8, borderRadius: 8, bgcolor: '#F0F0F0',
                '& .MuiLinearProgress-bar': { bgcolor: barColor, borderRadius: 8, transition: 'width .4s ease' } }}
            />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
              <Typography sx={{ fontSize: '0.65rem', color: 'text.secondary', fontWeight: 600 }}>{money(totalCarrinho)} usado</Typography>
              <Typography sx={{ fontSize: '0.65rem', color: barColor, fontWeight: 700 }}>{pctUsado.toFixed(0)}%</Typography>
            </Box>
          </Box>
        )}

        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Box sx={{ flex: 1, p: 1.5, bgcolor: '#F5F0FF', borderRadius: '12px', textAlign: 'center' }}>
            <Typography sx={{ fontSize: '0.6rem', fontWeight: 700, color: '#7B2CBF', mb: 0.2, textTransform: 'uppercase', letterSpacing: 0.4 }}>No Carrinho</Typography>
            <Typography sx={{ fontWeight: 900, fontSize: '1rem', color: '#7B2CBF' }}>{money(totalCarrinho)}</Typography>
          </Box>
          {qtdMarcados > 0 && (
            <Box sx={{ flex: 1, p: 1.5, bgcolor: '#F0FDF8', borderRadius: '12px', textAlign: 'center' }}>
              <Typography sx={{ fontSize: '0.6rem', fontWeight: 700, color: '#06D6A0', mb: 0.2, textTransform: 'uppercase', letterSpacing: 0.4 }}>Coletado</Typography>
              <Typography sx={{ fontWeight: 900, fontSize: '1rem', color: '#06D6A0' }}>{money(totalMarcado)}</Typography>
            </Box>
          )}
        </Box>
      </Box>
    </Card>
  );
};

// ════════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ════════════════════════════════════════════════════════════════════════════
const ListaCompras = ({ setRoute }) => {
  const hook = useListas();

  // ── estado de navegação interna ───────────────────────────────────────────
  const [tela,         setTela]         = useState('escolha');   // escolha | avulsa | lista_seletor | lista_ativa
  const [listaAtiva,   setListaAtiva]   = useState(null);        // objeto lista do Dexie
  const [itens,        setItens]        = useState([]);
  const [orcamento,    setOrcamento]    = useState(0);
  const [editandoOrc,  setEditandoOrc]  = useState(false);
  const [orcInput,     setOrcInput]     = useState('');
  const [showForm,     setShowForm]     = useState(false);
  const [modalClear,   setModalClear]   = useState(false);
  const [modalNomeLista, setModalNomeLista] = useState(false);
  const [nomeNovaLista,  setNomeNovaLista]  = useState('');
  const [toast,        setToast]        = useState({ open: false, texto: '', cor: 'success.main' });

  // ── carregar listas ao montar ─────────────────────────────────────────────
  useEffect(() => {
    hook.carregarListas();
  }, []);

  // ── helpers ───────────────────────────────────────────────────────────────
  const showToast = (texto, cor = 'success.main') => setToast({ open: true, texto, cor });

  const carregarItensAtivos = useCallback(async (listaId) => {
    const todos = await hook.carregarItens(listaId);
    setItens(todos.filter(i => i.status !== 'removido'));
  }, [hook.carregarItens]);

  const abrirLista = useCallback(async (lista) => {
    setListaAtiva(lista);
    setOrcamento(lista.orcamento || 0);
    await carregarItensAtivos(lista.id);
    setTela('lista_ativa');
  }, [carregarItensAtivos]);

  // ── totais memos ──────────────────────────────────────────────────────────
  const { totalCarrinho, totalMarcado, qtdMarcados, progresso } = useMemo(() => {
    const normalize = (i) => ({
      marcado: i.marcado || i.status === 'comprado',
      qty:     i.qty || i.quantidade || 1,
      preco:   i.preco || i.valorEstimado || 0,
    });
    const norm         = itens.map(normalize);
    const totalCarrinho = norm.reduce((a, i) => a + i.qty * i.preco, 0);
    const totalMarcado  = norm.filter(i => i.marcado).reduce((a, i) => a + i.qty * i.preco, 0);
    const qtdMarcados   = norm.filter(i => i.marcado).length;
    const progresso     = itens.length > 0 ? Math.round((qtdMarcados / itens.length) * 100) : 0;
    return { totalCarrinho, totalMarcado, qtdMarcados, progresso };
  }, [itens]);

  // ── handlers avulsos (itens em memória, sem persistência formal) ──────────
  const toggleAvulso = (id) =>
    setItens(prev => prev.map(i => i.id === id ? { ...i, marcado: !i.marcado } : i));
  const removerAvulso = (id) =>
    setItens(prev => prev.filter(i => i.id !== id));
  const adicionarAvulso = (form) => {
    setItens(prev => [...prev, { ...form, id: Date.now(), marcado: false }]);
    setShowForm(false);
  };

  // ── handlers lista Dexie ──────────────────────────────────────────────────
  const toggleDexie = async (id) => {
    const item = itens.find(i => i.id === id);
    if (!item) return;
    if (item.status === 'comprado') {
      await hook.desmarcarComprado(id);
    } else {
      await hook.marcarComprado(id, item.valorEstimado);
    }
    await carregarItensAtivos(listaAtiva.id);
  };

  const removerDexie = async (id) => {
    await hook.removerItem(id);
    await carregarItensAtivos(listaAtiva.id);
  };

  const adicionarDexie = async (form) => {
    await hook.adicionarItem(listaAtiva.id, {
      nome:          form.nome,
      categoria:     form.categoria,
      quantidade:    form.qty,
      valorEstimado: form.preco,
    });
    await carregarItensAtivos(listaAtiva.id);
    setShowForm(false);
    // Atualiza o objeto listaAtiva com novos totais
    const listas = await hook.carregarListas();
    const atualizada = listas.find(l => l.id === listaAtiva.id);
    if (atualizada) setListaAtiva(atualizada);
  };

  const criarNovaLista = async () => {
    if (!nomeNovaLista.trim()) return;
    const id = await hook.criarLista(nomeNovaLista.trim(), orcamento);
    const listas = await hook.carregarListas();
    const nova = listas.find(l => l.id === id);
    if (nova) await abrirLista(nova);
    setModalNomeLista(false);
    setNomeNovaLista('');
  };

  const confirmarOrcamento = () => {
    const num = parseFloat(String(orcInput).replace(/\D/g, '')) / 100;
    setOrcamento(isNaN(num) ? 0 : num);
    setEditandoOrc(false);
  };

  const limparTudo = async () => {
    if (tela === 'avulsa') {
      setItens([]);
    } else if (listaAtiva) {
      for (const i of itens) await hook.removerItem(i.id);
      await carregarItensAtivos(listaAtiva.id);
    }
    setModalClear(false);
  };

  // ══════════════════════════════════════════════════════════════════════════
  // TELA: ESCOLHA INICIAL
  // ══════════════════════════════════════════════════════════════════════════
  if (tela === 'escolha') {
    return (
      <Box sx={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        bgcolor: 'background.default', px: 3, py: 4,
      }}>
        <Box sx={{ width: 80, height: 80, borderRadius: '24px', mb: 3,
          background: 'linear-gradient(135deg, #7B2CBF 0%, #F72585 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem' }}>
          🛒
        </Box>

        <Typography sx={{ fontWeight: 900, fontSize: '1.5rem', color: 'text.primary', mb: 0.5, textAlign: 'center' }}>
          Lista de Compras
        </Typography>
        <Typography sx={{ fontSize: '0.85rem', color: 'text.secondary', mb: 4, textAlign: 'center', lineHeight: 1.6 }}>
          O que pretende fazer hoje?
        </Typography>

        {/* Opção A: Compra Avulsa */}
        <Box onClick={() => { setTela('avulsa'); setItens([]); }} sx={{
          width: '100%', maxWidth: 420, p: 2.5, borderRadius: '20px', cursor: 'pointer', mb: 2,
          border: '2px solid #7B2CBF', bgcolor: '#F5F0FF', transition: 'all .18s',
          '&:active': { transform: 'scale(0.97)' },
          '&:hover': { boxShadow: '0 4px 20px rgba(123,44,191,0.2)' },
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography sx={{ fontSize: '2.5rem', lineHeight: 1 }}>⚡</Typography>
            <Box>
              <Typography sx={{ fontWeight: 900, fontSize: '1rem', color: '#7B2CBF', mb: 0.3 }}>
                Compra Avulsa
              </Typography>
              <Typography sx={{ fontSize: '0.78rem', color: 'text.secondary', lineHeight: 1.4 }}>
                Adicione itens rapidamente sem criar uma lista. Ideal para compras rápidas.
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Opção B: Lista Completa */}
        <Box onClick={() => setTela('lista_seletor')} sx={{
          width: '100%', maxWidth: 420, p: 2.5, borderRadius: '20px', cursor: 'pointer',
          border: '2px solid #F72585', bgcolor: '#FFF0F7', transition: 'all .18s',
          '&:active': { transform: 'scale(0.97)' },
          '&:hover': { boxShadow: '0 4px 20px rgba(247,37,133,0.2)' },
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography sx={{ fontSize: '2.5rem', lineHeight: 1 }}>📋</Typography>
            <Box>
              <Typography sx={{ fontWeight: 900, fontSize: '1rem', color: '#F72585', mb: 0.3 }}>
                Lista Completa
              </Typography>
              <Typography sx={{ fontSize: '0.78rem', color: 'text.secondary', lineHeight: 1.4 }}>
                Crie uma nova lista ou reutilize uma lista guardada anteriormente.
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // TELA: SELETOR DE LISTA (criar nova ou escolher existente)
  // ══════════════════════════════════════════════════════════════════════════
  if (tela === 'lista_seletor') {
    const listasAbertas = hook.listas.filter(l => l.status === 'aberta');

    return (
      <Box sx={{ maxWidth: 500, margin: 'auto', px: 2, pt: 2, pb: 8 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
          <Button onClick={() => setTela('escolha')} sx={{ color: 'text.secondary', minWidth: 0, p: 0.5 }}>←</Button>
          <Typography sx={{ fontWeight: 900, fontSize: '1.2rem', color: 'text.primary' }}>
            📋 Minhas Listas
          </Typography>
        </Box>

        {/* criar nova lista */}
        <Button fullWidth variant="contained" onClick={() => setModalNomeLista(true)}
          sx={{ mb: 3, py: 1.5, borderRadius: '16px', fontWeight: 800, fontSize: '0.95rem' }}>
          + Criar Nova Lista
        </Button>

        {hook.loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress color="primary" />
          </Box>
        ) : listasAbertas.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 6, opacity: 0.6 }}>
            <Typography sx={{ fontSize: '2.5rem', mb: 1 }}>📭</Typography>
            <Typography sx={{ fontWeight: 700, color: 'text.secondary' }}>Nenhuma lista guardada</Typography>
            <Typography sx={{ fontSize: '0.8rem', color: 'text.secondary', mt: 0.5 }}>
              Crie uma nova lista para começar
            </Typography>
          </Box>
        ) : (
          <>
            <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: 'text.secondary',
              textTransform: 'uppercase', letterSpacing: 0.6, mb: 1.5 }}>
              Listas Abertas ({listasAbertas.length})
            </Typography>
            {listasAbertas.map(lista => (
              <Card key={lista.id} onClick={() => abrirLista(lista)} sx={{
                mb: 1.5, p: 2, cursor: 'pointer', border: '1.5px solid #E0E0E0',
                borderRadius: '14px', transition: 'all .15s',
                '&:hover': { borderColor: '#7B2CBF', bgcolor: '#F5F0FF' },
                '&:active': { transform: 'scale(0.98)' },
              }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography sx={{ fontWeight: 800, fontSize: '0.95rem', color: 'text.primary' }}>
                      {lista.nome}
                    </Typography>
                    <Typography sx={{ fontSize: '0.72rem', color: 'text.secondary', mt: 0.2 }}>
                      {new Date(lista.dataCriacao).toLocaleDateString('pt-BR')}
                      {lista.totalEstimado > 0 && ` · Est. ${money(lista.totalEstimado)}`}
                    </Typography>
                  </Box>
                  <Typography sx={{ fontSize: '1.2rem', color: '#7B2CBF' }}>→</Typography>
                </Box>
              </Card>
            ))}

            {/* listas concluídas */}
            {hook.listas.filter(l => l.status === 'concluida').length > 0 && (
              <>
                <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: 'text.secondary',
                  textTransform: 'uppercase', letterSpacing: 0.6, mb: 1.5, mt: 3 }}>
                  Concluídas
                </Typography>
                {hook.listas.filter(l => l.status === 'concluida').map(lista => (
                  <Card key={lista.id} sx={{
                    mb: 1.5, p: 2, border: '1.5px solid #E0E0E0', borderRadius: '14px', opacity: 0.7,
                  }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box>
                        <Typography sx={{ fontWeight: 800, fontSize: '0.95rem', color: 'text.secondary', textDecoration: 'line-through' }}>
                          {lista.nome}
                        </Typography>
                        <Typography sx={{ fontSize: '0.72rem', color: 'text.secondary', mt: 0.2 }}>
                          Concluída em {lista.dataFechamento ? new Date(lista.dataFechamento).toLocaleDateString('pt-BR') : '—'}
                          {lista.totalReal > 0 && ` · ${money(lista.totalReal)} gastos`}
                        </Typography>
                      </Box>
                      <Button size="small" variant="outlined" color="warning"
                        onClick={async (e) => { e.stopPropagation(); await hook.reabrirLista(lista.id); }}
                        sx={{ fontWeight: 700, fontSize: '0.7rem', borderRadius: '10px' }}>
                        Reabrir
                      </Button>
                    </Box>
                  </Card>
                ))}
              </>
            )}
          </>
        )}

        {/* Modal: nome da nova lista */}
        <Dialog open={modalNomeLista} onClose={() => setModalNomeLista(false)} fullWidth maxWidth="xs">
          <DialogTitle sx={{ fontWeight: 800 }}>📋 Nova Lista</DialogTitle>
          <DialogContent>
            <TextField fullWidth label="Nome da lista" autoFocus
              value={nomeNovaLista}
              onChange={e => setNomeNovaLista(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && criarNovaLista()}
              placeholder="Ex: Supermercado de Março"
              sx={{ mt: 1 }}
            />
          </DialogContent>
          <DialogActions sx={{ px: 2, pb: 2, gap: 1 }}>
            <Button onClick={() => setModalNomeLista(false)} color="inherit">Cancelar</Button>
            <Button variant="contained" onClick={criarNovaLista} disabled={!nomeNovaLista.trim()}>
              Criar Lista
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // TELA COMPARTILHADA: AVULSA + LISTA_ATIVA
  // (diferem apenas nos handlers de toggle/remover/adicionar e no header)
  // ══════════════════════════════════════════════════════════════════════════
  const isModoAvulso = tela === 'avulsa';
  const onToggle     = isModoAvulso ? toggleAvulso  : toggleDexie;
  const onRemove     = isModoAvulso ? removerAvulso : removerDexie;
  const onAdicionar  = isModoAvulso ? adicionarAvulso : adicionarDexie;

  const pendentes = itens.filter(i => !i.marcado && i.status !== 'comprado');
  const coletados = itens.filter(i =>  i.marcado || i.status === 'comprado');

  return (
    <Box sx={{ pb: 10, maxWidth: 600, margin: 'auto', px: 2, pt: 2, bgcolor: 'background.default', minHeight: '100vh' }}>
      <Snackbar open={toast.open} autoHideDuration={3000}
        onClose={() => setToast({ ...toast, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
        <Box sx={{ bgcolor: toast.cor, color: '#fff', px: 3, py: 1.5, borderRadius: '12px', fontWeight: 700 }}>
          {toast.texto}
        </Box>
      </Snackbar>

      {/* Header */}
      <Box sx={{ mb: 2.5, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
          <Button onClick={() => setTela(isModoAvulso ? 'escolha' : 'lista_seletor')}
            sx={{ color: 'text.secondary', minWidth: 0, p: 0.5, mt: 0.2 }}>
            ←
          </Button>
          <Box>
            <Typography sx={{ fontWeight: 900, fontSize: '1.2rem', color: 'text.primary', lineHeight: 1.1, letterSpacing: '-0.3px' }}>
              {isModoAvulso ? '⚡ Compra Avulsa' : `📋 ${listaAtiva?.nome || 'Lista'}`}
            </Typography>
            <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary', mt: 0.3, fontWeight: 600 }}>
              {itens.length === 0
                ? 'Nenhum item ainda'
                : `${coletados.length} de ${itens.length} coletados · ${progresso}%`}
            </Typography>
          </Box>
        </Box>
        <Button variant="outlined" size="small"
          onClick={() => setModalClear(true)}
          disabled={itens.length === 0}
          sx={{
            borderRadius: '10px', fontSize: '0.72rem',
            borderColor: '#FFCDD2', color: '#EF233C',
            '&:hover': { bgcolor: '#FFF1F3', borderColor: '#EF233C' },
            '&.Mui-disabled': { opacity: 0.3 },
          }}>
          🗑 Limpar
        </Button>
      </Box>

      {/* Progresso geral */}
      {itens.length > 0 && (
        <Box sx={{ mb: 2 }}>
          <LinearProgress variant="determinate" value={progresso}
            sx={{ height: 6, borderRadius: 8, bgcolor: '#E8E8E8',
              '& .MuiLinearProgress-bar': { background: 'linear-gradient(90deg, #7B2CBF 0%, #F72585 100%)', borderRadius: 8 } }}
          />
        </Box>
      )}

      {/* Card orçamento */}
      {editandoOrc ? (
        <Box sx={{ display: 'flex', gap: 1, mb: 2, alignItems: 'center' }}>
          <TextField fullWidth size="small" label="Orçamento total (R$)" autoFocus
            value={orcInput} placeholder="R$ 0,00"
            onChange={e => {
              const num = parseFloat(e.target.value.replace(/\D/g, '')) / 100;
              setOrcInput(isNaN(num) ? '' : money(num));
            }}
            onKeyDown={e => e.key === 'Enter' && confirmarOrcamento()}
            inputProps={{ inputMode: 'numeric' }}
          />
          <Button variant="contained" size="small" onClick={confirmarOrcamento}
            sx={{ height: 40, px: 2, borderRadius: '10px', fontWeight: 800, flexShrink: 0 }}>
            OK
          </Button>
          <IconButton size="small" onClick={() => setEditandoOrc(false)}
            sx={{ height: 40, width: 40, color: 'text.secondary', flexShrink: 0, bgcolor: '#F5F5F5', borderRadius: '10px' }}>
            ✕
          </IconButton>
        </Box>
      ) : (
        <CardOrcamento
          totalCarrinho={totalCarrinho}
          totalMarcado={totalMarcado}
          qtdMarcados={coletados.length}
          orcamento={orcamento}
          onEditarOrc={() => { setOrcInput(''); setEditandoOrc(true); }}
        />
      )}

      {/* Botão adicionar */}
      <Button fullWidth
        variant={showForm ? 'outlined' : 'contained'}
        onClick={() => setShowForm(v => !v)}
        sx={{ mb: 2, py: 1.4, borderRadius: '14px', fontWeight: 800, fontSize: '0.9rem',
          ...(showForm ? { borderColor: '#E0E0E0', color: 'text.secondary' } : {}),
        }}>
        {showForm ? '✕  Cancelar' : '+ Adicionar Item'}
      </Button>

      {/* Formulário de novo item */}
      <Collapse in={showForm}>
        <FormNovoItem
          onAdicionar={onAdicionar}
          onCancelar={() => setShowForm(false)}
        />
      </Collapse>

      {/* Estado vazio */}
      {itens.length === 0 && !showForm && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Box sx={{
            width: 80, height: 80, borderRadius: '24px', margin: '0 auto 16px',
            background: 'linear-gradient(135deg, #F5F0FF 0%, #EFF9FF 100%)',
            border: '2px dashed #C4B5FD',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.2rem',
          }}>
            🛒
          </Box>
          <Typography sx={{ fontWeight: 800, fontSize: '1.1rem', color: 'text.primary', mb: 0.5 }}>
            Lista vazia
          </Typography>
          <Typography sx={{ fontSize: '0.82rem', color: 'text.secondary', lineHeight: 1.5 }}>
            Toque em "+ Adicionar Item" para<br />começar a sua lista de compras
          </Typography>
        </Box>
      )}

      {/* Itens pendentes */}
      {pendentes.length > 0 && (
        <Box sx={{ mb: 2.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
            <Typography sx={{ fontWeight: 800, fontSize: '0.72rem', color: 'text.secondary', letterSpacing: '0.6px', textTransform: 'uppercase' }}>
              Pendentes
            </Typography>
            <Box sx={{ bgcolor: '#F5F0FF', borderRadius: '20px', px: 1, py: 0.15 }}>
              <Typography sx={{ fontSize: '0.65rem', fontWeight: 800, color: '#7B2CBF' }}>{pendentes.length}</Typography>
            </Box>
          </Box>
          {pendentes.map(item => (
            <ItemCard key={item.id} item={item} onToggle={onToggle} onRemove={onRemove} />
          ))}
        </Box>
      )}

      {/* Itens coletados */}
      {coletados.length > 0 && (
        <Box sx={{ mb: 2.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
            <Typography sx={{ fontWeight: 800, fontSize: '0.72rem', color: '#06D6A0', letterSpacing: '0.6px', textTransform: 'uppercase' }}>
              Coletados
            </Typography>
            <Box sx={{ bgcolor: '#F0FDF8', borderRadius: '20px', px: 1, py: 0.15 }}>
              <Typography sx={{ fontSize: '0.65rem', fontWeight: 800, color: '#06D6A0' }}>{coletados.length}</Typography>
            </Box>
          </Box>
          {coletados.map(item => (
            <ItemCard key={item.id} item={item} onToggle={onToggle} onRemove={onRemove} />
          ))}
        </Box>
      )}

      {/* Botão "Concluir Lista" (apenas no modo lista_ativa) */}
      {!isModoAvulso && coletados.length > 0 && (
        <Button fullWidth variant="contained" color="success"
          onClick={async () => {
            const total = await hook.concluirLista(listaAtiva.id);
            showToast(`✅ Lista concluída! ${money(total)} lançados nos Gastos.`);
            setTela('lista_seletor');
          }}
          sx={{ mt: 1, py: 1.5, fontWeight: 900, borderRadius: '16px', fontSize: '0.95rem' }}>
          ✅ Concluir Lista ({money(totalCarrinho)})
        </Button>
      )}

      {/* Modal limpar */}
      <Dialog open={modalClear} onClose={() => setModalClear(false)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontWeight: 800, color: '#EF233C' }}>🗑️ Limpar lista?</DialogTitle>
        <DialogContent>
          <Typography sx={{ color: 'text.secondary' }}>
            Isso remove todos os <strong>{itens.length} itens</strong>. Esta ação não pode ser desfeita.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 2, pb: 2, gap: 1 }}>
          <Button onClick={() => setModalClear(false)} color="inherit">Cancelar</Button>
          <Button variant="contained" color="error" onClick={limparTudo}>Limpar Tudo</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ListaCompras;
