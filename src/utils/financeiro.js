// ─────────────────────────────────────────────────────────────────────────────
// src/utils/financeiro.js
// Utilitário central de datas, parcelas e formatação monetária.
// ─────────────────────────────────────────────────────────────────────────────

const FinanceiroUtils = {

  money(v) {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(v || 0);
  },

  dateParaMesAno(date) {
    return `${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
  },

  mesAnoParaNum(mesAno) {
    if (!mesAno || mesAno === 'fixo') return 999999;
    const [m, y] = mesAno.split('/');
    return parseInt(`${y}${m}`);
  },

  mesComOffset(offset = 0) {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth() + offset, 1);
  },

  parcelasEsperadas(dataAcordo, mesAlvo) {
    if (!dataAcordo) return 1;
    const inicio = new Date(dataAcordo + 'T00:00:00');
    return (
      (mesAlvo.getFullYear() - inicio.getFullYear()) * 12 +
      (mesAlvo.getMonth() - inicio.getMonth()) + 1
    );
  },

  temParcelaNesteMes(acordo, mesAlvo) {
    const esperadas = this.parcelasEsperadas(acordo.dataAcordo, mesAlvo);
    const totais = parseInt(acordo.parcelas) || 1;
    const pagas = parseInt(acordo.parcelasPagas) || 0;
    if (esperadas <= 0 || esperadas > totais) return false;
    return pagas < esperadas;
  },

  parcelaPagaNesteMes(acordo, mesAnoTarget) {
    return (acordo.historicoPagamentos || [])
      .some(h => h.data && h.data.endsWith(mesAnoTarget));
  },

  valorDevidoNoMes(acordo, mesAlvo) {
    if (acordo.situacao !== 'acordo') return 0;
    const pagas = parseInt(acordo.parcelasPagas) || 0;
    const totais = parseInt(acordo.parcelas) || 1;
    if (pagas >= totais) return 0;
    if (!this.temParcelaNesteMes(acordo, mesAlvo)) return 0;
    return acordo.valorParcela || 0;
  },

  nomeMesOffset(offset, curto = false) {
    if (offset === 0) return curto ? 'Este Mês' : 'ESTE MÊS';
    const nomes = curto
      ? ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
      : ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];
    const d = this.mesComOffset(offset);
    const ano = curto ? String(d.getFullYear()).slice(-2) : d.getFullYear();
    return `${nomes[d.getMonth()]}/${ano}`;
  },

  formatarDataInput(dataStr) {
    if (!dataStr) return '—';
    return dataStr.split('-').reverse().join('/');
  },

  calcularDataTermino(acordo) {
    if (!acordo.dataAcordo || !acordo.parcelas) return '—';
    const inicio = new Date(acordo.dataAcordo + 'T00:00:00');
    const fim = new Date(inicio.getFullYear(), inicio.getMonth() + parseInt(acordo.parcelas) - 1, 1);
    const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    return `${meses[fim.getMonth()]}/${fim.getFullYear()}`;
  },

  calcularTempoAberto(dataStr) {
    if (!dataStr) return '—';
    const inicio = new Date(dataStr + 'T00:00:00');
    const hoje = new Date();
    const meses = (hoje.getFullYear() - inicio.getFullYear()) * 12 + (hoje.getMonth() - inicio.getMonth());
    if (meses < 12) return `${meses} meses`;
    const anos = Math.floor(meses / 12);
    const resto = meses % 12;
    return resto > 0 ? `${anos} ano(s) e ${resto} mês(es)` : `${anos} ano(s)`;
  },

  verificarPrescricao(dataStr) {
    if (!dataStr) return false;
    const inicio = new Date(dataStr + 'T00:00:00');
    const hoje = new Date();
    const anos = (hoje.getFullYear() - inicio.getFullYear()) +
      (hoje.getMonth() - inicio.getMonth()) / 12;
    return anos >= 5;
  },
};

export default FinanceiroUtils;
