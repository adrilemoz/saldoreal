// src/components/Home.jsx — v5
// Navbar e modais Add/Config removidos daqui — vivem no App.jsx global.
// Home mantém apenas: TelaPerfil, modal de alertas, conteúdo do dashboard.

import React, { useState, useEffect, useMemo } from 'react';
import Box           from '@mui/material/Box';
import Typography    from '@mui/material/Typography';
import Button        from '@mui/material/Button';
import Chip          from '@mui/material/Chip';
import TextField     from '@mui/material/TextField';
import Dialog        from '@mui/material/Dialog';
import DialogTitle   from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Snackbar      from '@mui/material/Snackbar';
import Alert         from '@mui/material/Alert';
import InputAdornment from '@mui/material/InputAdornment';
import Slide         from '@mui/material/Slide';

import FinanceiroService from '../services/FinanceiroService';
import TelaOnboarding    from './home/TelaOnboarding';
import TelaHumor         from './home/TelaHumor';
import CardHero          from './home/CardHero';
import InsightStrip      from './home/InsightStrip';
import GraficoMensal     from './home/GraficoMensal';
import QuickMenuCards    from './home/QuickMenuCards';
import { money, saudacao, HUMORES } from './home/constants';

// ─────────────────────────────────────────────────────────────────────────────
// Tela Perfil — Dialog fullscreen com Slide de baixo para cima
// ─────────────────────────────────────────────────────────────────────────────
const TelaPerfil = ({ open, onClose, usuario, renda, diaPagamento: diaPagamentoProp, humorHoje, onSaved }) => {
  const [nome,          setNome]          = useState('');
  const [inputRenda,    setInputRenda]    = useState('');
  const [diaPag,        setDiaPag]        = useState('');
  const [humorSel,      setHumorSel]      = useState(null);
  const [salvando,      setSalvando]      = useState(false);

  useEffect(() => {
    if (open) {
      setNome(usuario || '');
      setInputRenda(renda || '');
      setDiaPag(diaPagamentoProp ? String(diaPagamentoProp) : '');
      setHumorSel(humorHoje);
    }
  }, [open, usuario, renda, diaPagamentoProp, humorHoje]);

  const handleRendaChange = (e) => {
    const raw = e.target.value.replace(/\D/g, '');
    const num = parseFloat(raw) / 100;
    setInputRenda(isNaN(num) ? '' : num);
  };

  const salvar = async () => {
    setSalvando(true);
    try {
      if (nome.trim()) await FinanceiroService.setUsuario(nome.trim());
      const val = typeof inputRenda === 'number' ? inputRenda : parseFloat(String(inputRenda)) || 0;
      await FinanceiroService.setRenda(val);
      const dia = parseInt(diaPag);
      const diaValido = dia >= 1 && dia <= 31 ? dia : null;
      await FinanceiroService.setDiaPagamento(diaValido);
      if (humorSel) await FinanceiroService.salvarHumor(humorSel.nivel, humorSel.rotulo);
      onSaved({ nome: nome.trim(), renda: val, diaPagamento: diaValido, humor: humorSel });
      onClose();
    } finally {
      setSalvando(false);
    }
  };

  const rendaDisplay = typeof inputRenda === 'number' && inputRenda > 0
    ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(inputRenda)
    : '';

  return (
    <Dialog open={open} onClose={onClose} fullScreen
      TransitionComponent={Slide} TransitionProps={{ direction: 'up' }}
      PaperProps={{ sx: { bgcolor: 'background.default' } }}>

      {/* Header */}
      <Box sx={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        px: 2.5, pt: 3, pb: 1.5,
        background: 'linear-gradient(145deg, #1A0533 0%, #2D0B5E 60%, #6B1FA8 100%)',
      }}>
        <Box>
          <Typography sx={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase' }}>
            Meu Perfil
          </Typography>
          <Typography sx={{ color: '#fff', fontWeight: 900, fontSize: '1.4rem', letterSpacing: '-0.3px', mt: 0.3 }}>
            {(usuario || 'Usuário').split(' ')[0]} 👤
          </Typography>
        </Box>
        <Box onClick={onClose} sx={{
          width: 36, height: 36, borderRadius: '12px',
          bgcolor: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', fontSize: '1rem', '&:active': { transform: 'scale(0.9)' },
        }}>✕</Box>
      </Box>

      <Box sx={{ px: 2.5, pt: 2.5, pb: 10, maxWidth: 480, margin: 'auto', width: '100%' }}>
        <Typography sx={{ fontSize: '0.7rem', fontWeight: 800, color: 'text.secondary', letterSpacing: '0.8px', textTransform: 'uppercase', mb: 0.8 }}>
          Nome
        </Typography>
        <TextField fullWidth value={nome} onChange={e => setNome(e.target.value)} placeholder="Seu nome" sx={{ mb: 2.5 }} />

        <Typography sx={{ fontSize: '0.7rem', fontWeight: 800, color: 'text.secondary', letterSpacing: '0.8px', textTransform: 'uppercase', mb: 0.8 }}>
          Renda Mensal
        </Typography>
        <TextField fullWidth label="Renda mensal" value={rendaDisplay} onChange={handleRendaChange}
          inputProps={{ inputMode: 'numeric' }}
          InputProps={{ startAdornment: <InputAdornment position="start"><Typography sx={{ fontWeight: 700, color: 'text.secondary' }}>R$</Typography></InputAdornment> }}
          sx={{ mb: 2.5 }} />

        <Typography sx={{ fontSize: '0.7rem', fontWeight: 800, color: 'text.secondary', letterSpacing: '0.8px', textTransform: 'uppercase', mb: 0.8 }}>
          Dia do Recebimento
        </Typography>
        <TextField fullWidth label="Dia do salário (1–31)" value={diaPag}
          onChange={e => { const v = e.target.value.replace(/\D/g, ''); if (v === '' || parseInt(v) <= 31) setDiaPag(v); }}
          inputProps={{ inputMode: 'numeric', maxLength: 2 }}
          helperText="Aparece a contagem regressiva na tela inicial"
          sx={{ mb: 2.5 }} />

        <Typography sx={{ fontSize: '0.7rem', fontWeight: 800, color: 'text.secondary', letterSpacing: '0.8px', textTransform: 'uppercase', mb: 1 }}>
          Humor Financeiro de Hoje
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 3 }}>
          {HUMORES.map(h => {
            const sel = humorSel?.nivel === h.nivel;
            return (
              <Box key={h.nivel} onClick={() => setHumorSel(h)} sx={{
                display: 'flex', alignItems: 'center', gap: 0.7,
                px: 1.3, py: 0.8, borderRadius: '12px', cursor: 'pointer',
                border: `2px solid ${sel ? h.cor : 'rgba(0,0,0,0.08)'}`,
                bgcolor: sel ? `${h.cor}14` : 'background.paper',
                transition: 'all 0.15s', '&:active': { transform: 'scale(0.93)' },
              }}>
                <Typography sx={{ fontSize: '1.2rem', lineHeight: 1 }}>{h.emoji}</Typography>
                <Typography sx={{ fontSize: '0.75rem', fontWeight: sel ? 800 : 600, color: sel ? h.cor : 'text.secondary' }}>
                  {h.rotulo}
                </Typography>
              </Box>
            );
          })}
        </Box>

        <Button fullWidth variant="contained" size="large" disabled={salvando} onClick={salvar}
          sx={{ borderRadius: '16px', py: 1.5, fontWeight: 900, fontSize: '1rem',
            background: 'linear-gradient(135deg, #7B2CBF, #F72585)', boxShadow: '0 6px 22px rgba(123,44,191,0.35)' }}>
          {salvando ? 'Salvando...' : '✅ Salvar Alterações'}
        </Button>
      </Box>
    </Dialog>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// HOME
// ─────────────────────────────────────────────────────────────────────────────
const Home = ({ setRoute }) => {
  const [carregando,     setCarregando]     = useState(true);
  const [usuario,        setUsuario]        = useState('');
  const [mostrarHumor,   setMostrarHumor]   = useState(false);
  const [humorHoje,      setHumorHoje]      = useState(null);

  const [renda,          setRenda]          = useState(0);
  const [diaPagamento,   setDiaPagamento]   = useState(null);
  const [totalMes,       setTotalMes]       = useState(0);
  const [saldoReal,      setSaldoReal]      = useState(0);
  const [percentual,     setPercentual]     = useState(0);
  const [alertas,        setAlertas]        = useState([]);
  const [insight,        setInsight]        = useState(null);

  const [modalAlertas,   setModalAlertas]   = useState(false);
  const [telaPerfilOpen, setTelaPerfilOpen] = useState(false);
  const [toast,          setToast]          = useState({ open: false, msg: '', sev: 'success' });

  const alertasUrgentes = useMemo(() => alertas.filter(a => a.atrasado || a.diff <= 2), [alertas]);

  // Calcula quantos dias faltam para o próximo pagamento
  const diasParaPagamento = useMemo(() => {
    if (!diaPagamento) return null;
    const hoje = new Date();
    const diaHoje = hoje.getDate();
    const mes = hoje.getMonth();
    const ano = hoje.getFullYear();
    let prox;
    if (diaPagamento > diaHoje) {
      prox = new Date(ano, mes, diaPagamento);
    } else if (diaPagamento === diaHoje) {
      return 0;
    } else {
      prox = new Date(ano, mes + 1, diaPagamento);
    }
    const diff = Math.round((prox - new Date(ano, mes, diaHoje)) / (1000 * 60 * 60 * 24));
    return diff;
  }, [diaPagamento]);

  useEffect(() => {
    (async () => {
      const [nome, rendaDB, humorDB, diaDB] = await Promise.all([
        FinanceiroService.getUsuario(),
        FinanceiroService.getRenda(),
        FinanceiroService.getHumorHoje(),
        FinanceiroService.getDiaPagamento(),
      ]);
      setUsuario(nome);
      setRenda(rendaDB);
      setDiaPagamento(diaDB);
      setHumorHoje(humorDB);
      if (nome && !humorDB) setMostrarHumor(true);
      setCarregando(false);
    })();
  }, []);

  useEffect(() => {
    if (!usuario || carregando) return;
    const carregar = async () => {
      const [{ debito, alertas: al, saldoReal: sr }, pct, ins] = await Promise.all([
        FinanceiroService.dadosDashboard(),
        FinanceiroService.calcularPercentualGasto(),
        FinanceiroService.gerarInsight(),
      ]);
      setTotalMes(debito);
      setSaldoReal(sr);
      setAlertas(al);
      setPercentual(pct);
      setInsight(ins);
    };
    carregar();
    const onFocus   = () => carregar();
    const onVisible = () => { if (document.visibilityState === 'visible') carregar(); };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', onFocus);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', onFocus);
    };
  }, [usuario, renda, carregando]);

  if (carregando) return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'background.default' }}>
      <Box sx={{ textAlign: 'center' }}>
        <Typography sx={{ fontSize: '2.5rem', mb: 1 }}>💜</Typography>
        <Typography sx={{ color: 'text.secondary', fontSize: '0.85rem', fontWeight: 600 }}>Carregando...</Typography>
      </Box>
    </Box>
  );

  if (!usuario) return <TelaOnboarding onConcluir={async (nome) => {
    const rendaDB = await FinanceiroService.getRenda();
    setRenda(rendaDB); setUsuario(nome); setMostrarHumor(true);
  }} />;

  if (mostrarHumor) return (
    <TelaHumor nome={usuario} onConcluir={(h) => { setHumorHoje(h); setMostrarHumor(false); }} />
  );

  const primeiroNome = usuario.split(' ')[0];

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <Snackbar open={toast.open} autoHideDuration={3000}
        onClose={() => setToast(t => ({ ...t, open: false }))}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
        <Alert severity={toast.sev} variant="filled" sx={{ borderRadius: '12px', fontWeight: 700 }}>
          {toast.msg}
        </Alert>
      </Snackbar>

      <Box sx={{ px: 2, pt: 2.5, maxWidth: 480, margin: 'auto' }}>

        {/* ── CABEÇALHO ─────────────────────────────────────────────────── */}
        <Box sx={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.8,
          animation: 'fadeDown 0.35s ease both',
          '@keyframes fadeDown': {
            '0%': { opacity: 0, transform: 'translateY(-8px)' },
            '100%': { opacity: 1, transform: 'translateY(0)' },
          },
        }}>
          <Box>
            <Typography sx={{ color: 'text.secondary', fontSize: '0.75rem', fontWeight: 600, lineHeight: 1 }}>
              {saudacao()},
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
              <Typography sx={{ fontWeight: 900, fontSize: '1.6rem', color: 'text.primary', lineHeight: 1.15, letterSpacing: '-0.5px' }}>
                {primeiroNome}
              </Typography>
              <Typography sx={{
                fontSize: '1.3rem', lineHeight: 1.15, display: 'inline-block',
                animation: 'wave 2.2s ease-in-out infinite',
                '@keyframes wave': {
                  '0%, 60%, 100%': { transform: 'rotate(0deg)' },
                  '10%, 30%': { transform: 'rotate(20deg)' },
                  '20%': { transform: 'rotate(-10deg)' },
                },
                transformOrigin: '80% 80%',
              }}>👋</Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', gap: 0.8, alignItems: 'center' }}>
            {/* Badge dias para o pagamento */}
            {diasParaPagamento !== null && (
              <Box sx={{
                display: 'flex', alignItems: 'center', gap: 0.4,
                px: 1, py: 0.5, borderRadius: '10px',
                bgcolor: diasParaPagamento === 0
                  ? 'rgba(16,185,129,0.12)'
                  : diasParaPagamento <= 3
                  ? 'rgba(247,37,133,0.08)'
                  : 'rgba(0,0,0,0.04)',
                border: `1.5px solid ${diasParaPagamento === 0
                  ? 'rgba(16,185,129,0.35)'
                  : diasParaPagamento <= 3
                  ? 'rgba(247,37,133,0.25)'
                  : 'rgba(0,0,0,0.07)'}`,
              }}>
                <Typography sx={{ fontSize: '0.7rem' }}>💰</Typography>
                <Typography sx={{
                  fontSize: '0.65rem', fontWeight: 800, lineHeight: 1,
                  color: diasParaPagamento === 0
                    ? '#10B981'
                    : diasParaPagamento <= 3
                    ? '#F72585'
                    : 'text.secondary',
                }}>
                  {diasParaPagamento === 0 ? 'Hoje!' : `${diasParaPagamento}d`}
                </Typography>
              </Box>
            )}
            {/* Sino de alertas */}
            <Box onClick={() => setModalAlertas(true)} sx={{
              width: 38, height: 38, borderRadius: '12px',
              bgcolor: alertasUrgentes.length > 0 ? 'rgba(247,37,133,0.08)' : 'rgba(0,0,0,0.04)',
              border: alertasUrgentes.length > 0 ? '1.5px solid rgba(247,37,133,0.3)' : '1.5px solid rgba(0,0,0,0.07)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', position: 'relative', transition: 'all 0.2s',
              '&:active': { transform: 'scale(0.9)' },
              ...(alertasUrgentes.length > 0 && {
                animation: 'bellShake 3s ease-in-out infinite',
                '@keyframes bellShake': {
                  '0%, 80%, 100%': { transform: 'rotate(0deg)' },
                  '10%': { transform: 'rotate(-12deg)' }, '20%': { transform: 'rotate(12deg)' },
                  '30%': { transform: 'rotate(-8deg)' },  '40%': { transform: 'rotate(8deg)' },
                },
              }),
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M12 22c1.1 0 2-.9 2-2H10c0 1.1.9 2 2 2zm6-6V11c0-3.07-1.63-5.64-4.5-6.32V4a1.5 1.5 0 00-3 0v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"
                  fill={alertasUrgentes.length > 0 ? '#F72585' : '#9CA3AF'} />
              </svg>
              {alertasUrgentes.length > 0 && (
                <Box sx={{
                  position: 'absolute', top: -4, right: -4,
                  width: 17, height: 17, borderRadius: '50%',
                  bgcolor: '#F72585', border: '2px solid #F5F5F5',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Typography sx={{ fontSize: '0.5rem', fontWeight: 900, color: '#fff', lineHeight: 1 }}>
                    {alertasUrgentes.length}
                  </Typography>
                </Box>
              )}
            </Box>

            {/* Avatar → abre TelaPerfil */}
            <Box onClick={() => setTelaPerfilOpen(true)} sx={{
              width: 38, height: 38, borderRadius: '12px',
              background: 'linear-gradient(135deg, rgba(123,44,191,0.15), rgba(247,37,133,0.1))',
              border: '1.5px solid rgba(123,44,191,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', fontSize: '1.1rem',
              transition: 'all 0.2s', '&:active': { transform: 'scale(0.9)' },
            }}>👤</Box>
          </Box>
        </Box>

        {/* ── HERO ──────────────────────────────────────────────────────── */}
        <CardHero debito={totalMes} percentual={percentual} renda={renda} humor={humorHoje} saldoReal={saldoReal} />

        {/* ── INSIGHT ───────────────────────────────────────────────────── */}
        <InsightStrip insight={insight} />

        {/* ── GRÁFICO ───────────────────────────────────────────────────── */}
        <GraficoMensal />

        {/* ── CARDS 2x2 ─────────────────────────────────────────────────── */}
        <QuickMenuCards setRoute={setRoute} />

      </Box>

      {/* ════ MODAIS DA HOME ════ */}

      <TelaPerfil
        open={telaPerfilOpen}
        onClose={() => setTelaPerfilOpen(false)}
        usuario={usuario}
        renda={renda}
        diaPagamento={diaPagamento}
        humorHoje={humorHoje}
        onSaved={({ nome, renda: r, diaPagamento: dp, humor }) => {
          if (nome) setUsuario(nome);
          setRenda(r);
          setDiaPagamento(dp);
          if (humor) setHumorHoje(humor);
          setToast({ open: true, msg: '✅ Perfil atualizado!', sev: 'success' });
        }}
      />

      <Dialog open={modalAlertas} onClose={() => setModalAlertas(false)} fullWidth maxWidth="xs"
        PaperProps={{ sx: { borderRadius: '20px' } }}>
        <DialogTitle sx={{ fontWeight: 800 }}>🔔 Alertas de Vencimento</DialogTitle>
        <DialogContent>
          {alertas.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 3 }}>
              <Typography sx={{ fontSize: '2.5rem', mb: 1 }}>🟢</Typography>
              <Typography sx={{ fontWeight: 700, color: 'success.main' }}>Tudo em dia!</Typography>
            </Box>
          ) : alertas.map((a, i) => (
            <Box key={i} sx={{
              mb: 1.5, p: 1.5, borderRadius: '12px', border: '1.5px solid',
              borderColor: a.atrasado ? 'error.light' : a.diff <= 2 ? 'warning.light' : 'divider',
              bgcolor: a.atrasado ? '#FFF1F3' : a.diff <= 2 ? '#FFFBEB' : 'background.paper',
            }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  <Chip label={a.tipo === 'acordo' ? 'Acordo' : 'Gasto'} size="small" color={a.tipo === 'acordo' ? 'info' : 'secondary'} />
                  <Typography sx={{ fontWeight: 700, fontSize: '0.88rem' }}>{a.nome}</Typography>
                </Box>
                <Typography sx={{ fontWeight: 800, color: 'error.main', fontSize: '0.88rem' }}>{money(a.valor)}</Typography>
              </Box>
              <Typography sx={{ fontSize: '0.72rem', mt: 0.5, color: a.atrasado ? 'error.main' : a.diff <= 2 ? 'warning.main' : 'text.secondary' }}>
                {a.atrasado ? `⚠️ Venceu dia ${a.dia} — ${Math.abs(a.diff)}d em atraso`
                  : a.diff === 0 ? '🔴 Vence HOJE'
                  : `🟡 Vence em ${a.diff}d — dia ${a.dia}`}
              </Typography>
            </Box>
          ))}
        </DialogContent>
        <DialogActions sx={{ px: 2, pb: 2 }}>
          <Button fullWidth variant="contained" onClick={() => setModalAlertas(false)}>Fechar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Home;
