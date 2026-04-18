export const money = (v) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);

export const saudacao = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
};

export const insightColors = {
  success: { bg: '#F0FDF8', border: '#A7F3D0', text: '#065F46' },
  warning: { bg: '#FFFBEB', border: '#FDE68A', text: '#92400E' },
  error:   { bg: '#FFF1F3', border: '#FECDD3', text: '#9F1239' },
  info:    { bg: '#EFF9FF', border: '#BAE6FD', text: '#0C4A6E' },
};

export const HUMORES = [
  { nivel: 1, emoji: '😰', rotulo: 'Muito mal', cor: '#EF4444' },
  { nivel: 2, emoji: '😟', rotulo: 'Mal',       cor: '#F97316' },
  { nivel: 3, emoji: '😐', rotulo: 'Neutro',    cor: '#FFB703' },
  { nivel: 4, emoji: '🙂', rotulo: 'Bem',       cor: '#06D6A0' },
  { nivel: 5, emoji: '😄', rotulo: 'Muito bem', cor: '#7B2CBF' },
];

export const BG_GRADIENT = 'linear-gradient(160deg, #7B2CBF 0%, #9D4EDD 50%, #F72585 100%)';
