// ─────────────────────────────────────────────────────────────────────────────
// src/services/FinanceiroService.js
// ─────────────────────────────────────────────────────────────────────────────

import db from '../db/db';
import u from '../utils/financeiro';

const FinanceiroService = {

  // ── CONFIGURAÇÕES ─────────────────────────────────────────────────────────

  async getConfig(chave, padrao = null) {
    try {
      const reg = await db.configuracoes.get(chave);
      return reg ? reg.valor : padrao;
    } catch { return padrao; }
  },

  async setConfig(chave, valor) {
    await db.configuracoes.put({ chave, valor });
  },

  async getUsuario()     { return this.getConfig('usuario', ''); },
  async setUsuario(nome) { return this.setConfig('usuario', nome); },
  async getRenda()             { return this.getConfig('renda', 0); },
  async setRenda(val)          { return this.setConfig('renda', val); },
  async getDiaPagamento()      { return this.getConfig('diaPagamento', null); },
  async setDiaPagamento(dia)   { return this.setConfig('diaPagamento', dia); },

  async getHumorHoje() {
    const hoje = new Date().toISOString().slice(0, 10);
    return this.getConfig(`humor_${hoje}`, null);
  },

  async salvarHumor(nivel, rotulo) {
    const hoje = new Date().toISOString().slice(0, 10);
    return this.setConfig(`humor_${hoje}`, { nivel, rotulo, data: hoje });
  },

  // ── LEITURA ───────────────────────────────────────────────────────────────

  async carregarAcordos() { return db.acordos.toArray(); },
  async carregarGastos()  { return db.gastos.toArray(); },

  async carregarTudo() {
    const [acordos, gastos] = await Promise.all([
      db.acordos.toArray(),
      db.gastos.toArray(),
    ]);
    return { acordos, gastos };
  },

  // ── DASHBOARD (Home) ──────────────────────────────────────────────────────

  async debitoDoMes() {
    const { acordos, gastos } = await this.carregarTudo();
    const hoje = new Date();
    const mesAnoTarget = u.dateParaMesAno(hoje);

    const valorAcordos = acordos.reduce((acc, a) => {
      if (a.situacao !== 'acordo') return acc;
      if (!u.temParcelaNesteMes(a, hoje)) return acc;
      if (u.parcelaPagaNesteMes(a, mesAnoTarget)) return acc;
      return acc + (a.valorParcela || 0);
    }, 0);

    const valorGastos = gastos.reduce((acc, g) => {
      if (g.tipoOperacao !== 'despesa') return acc;
      const pertence = g.mesAno === 'fixo' || g.mesAno === mesAnoTarget;
      if (!pertence) return acc;
      const isPago = g.mesAno === 'fixo'
        ? (g.pagos || []).includes(mesAnoTarget)
        : !!g.pago;
      if (isPago) return acc;
      return acc + (g.valor || 0);
    }, 0);

    return valorAcordos + valorGastos;
  },

  async alertasDeVencimento(diasAntecedencia = 5) {
    const { acordos, gastos } = await this.carregarTudo();
    const hoje = new Date();
    const mesAnoTarget = u.dateParaMesAno(hoje);
    const diaHoje = hoje.getDate();
    const alertas = [];

    acordos.forEach(a => {
      if (a.situacao !== 'acordo') return;
      const pagas = parseInt(a.parcelasPagas) || 0;
      const totais = parseInt(a.parcelas) || 1;
      if (pagas >= totais) return;
      if (u.parcelaPagaNesteMes(a, mesAnoTarget)) return;
      const dia = parseInt(a.vencimentoDia) || 1;
      const diff = dia - diaHoje;
      if (diff >= 0 && diff <= diasAntecedencia)
        alertas.push({ tipo: 'acordo', nome: a.empresa, dia, valor: a.valorParcela, diff });
      else if (diff < 0)
        alertas.push({ tipo: 'acordo', nome: a.empresa, dia, valor: a.valorParcela, diff, atrasado: true });
    });

    gastos.forEach(g => {
      if (g.tipoOperacao !== 'despesa') return;
      const pertence = g.mesAno === 'fixo' || g.mesAno === mesAnoTarget;
      if (!pertence) return;
      const isPago = g.mesAno === 'fixo'
        ? (g.pagos || []).includes(mesAnoTarget)
        : !!g.pago;
      if (isPago) return;
      const dia = parseInt(g.dia) || 1;
      const diff = dia - diaHoje;
      if (diff >= 0 && diff <= diasAntecedencia)
        alertas.push({ tipo: 'gasto', nome: g.nome, dia, valor: g.valor, diff });
      else if (diff < 0)
        alertas.push({ tipo: 'gasto', nome: g.nome, dia, valor: g.valor, diff, atrasado: true });
    });

    return alertas.sort((a, b) => a.diff - b.diff);
  },

  async saldoRealDoMes() {
    const { acordos, gastos } = await this.carregarTudo();
    const mesAnoTarget = u.dateParaMesAno(new Date());
    let entPaga = 0, saiPaga = 0;

    gastos.forEach(g => {
      const isPago = g.mesAno === 'fixo'
        ? (g.pagos || []).includes(mesAnoTarget)
        : (g.mesAno === mesAnoTarget ? !!g.pago : false);
      if (!isPago) return;
      if (g.tipoOperacao === 'entrada') entPaga += g.valor || 0;
      else saiPaga += g.valor || 0;
    });

    acordos.forEach(a => {
      (a.historicoPagamentos || []).forEach(h => {
        if (h.data && h.data.endsWith(mesAnoTarget))
          saiPaga += h.valorPago || a.valorParcela || 0;
      });
    });

    return entPaga - saiPaga;
  },

  async dadosDashboard() {
    const [debito, alertas, saldoReal] = await Promise.all([
      this.debitoDoMes(),
      this.alertasDeVencimento(),
      this.saldoRealDoMes(),
    ]);
    return { debito, alertas, saldoReal };
  },

  // ── INSIGHTS ──────────────────────────────────────────────────────────────

  async calcularSaldoRestante() {
    const renda = await this.getRenda();
    const debito = await this.debitoDoMes();
    return renda - debito;
  },

  /**
   * CORRIGIDO: percentual baseado no que JÁ FOI PAGO, não no pendente.
   */
  async calcularPercentualGasto() {
    const renda = await this.getRenda();
    if (renda <= 0) return 0;
    const { acordos, gastos } = await this.carregarTudo();
    const mesAnoTarget = u.dateParaMesAno(new Date());
    let saiPaga = 0;

    gastos.forEach(g => {
      if (g.tipoOperacao !== 'despesa') return;
      const isPago = g.mesAno === 'fixo'
        ? (g.pagos || []).includes(mesAnoTarget)
        : (g.mesAno === mesAnoTarget && !!g.pago);
      if (isPago) saiPaga += g.valor || 0;
    });

    acordos.forEach(a => {
      (a.historicoPagamentos || []).forEach(h => {
        if (h.data && h.data.endsWith(mesAnoTarget))
          saiPaga += h.valorPago || a.valorParcela || 0;
      });
    });

    return Math.min(100, Math.round((saiPaga / renda) * 100));
  },

  /**
   * CORRIGIDO: inclui acordos pagos hoje além dos gastos.
   */
  async gastoDeHoje() {
    const { gastos, acordos } = await this.carregarTudo();
    const hoje = new Date();
    const diaHoje = hoje.getDate();
    const mesAnoTarget = u.dateParaMesAno(hoje);
    const hojeStr = `${String(diaHoje).padStart(2, '0')}/${mesAnoTarget}`;
    let total = 0;

    // Gastos comuns pagos hoje
    gastos.forEach(g => {
      if (g.tipoOperacao !== 'despesa') return;
      if (g.mesAno !== mesAnoTarget) return;
      if (!g.pago) return;
      const diaGasto = parseInt(g.dia) || 0;
      if (diaGasto === diaHoje) total += g.valor || 0;
    });

    // Acordos com pagamento registrado hoje
    acordos.forEach(a => {
      (a.historicoPagamentos || []).forEach(h => {
        if (h.data && h.data.startsWith(`${String(diaHoje).padStart(2, '0')}/`) && h.data.endsWith(mesAnoTarget))
          total += h.valorPago || a.valorParcela || 0;
      });
    });

    return total;
  },

  /**
   * CORRIGIDO: inclui acordos na maior categoria.
   */
  async obterMaiorCategoria() {
    const { gastos, acordos } = await this.carregarTudo();
    const mesAnoTarget = u.dateParaMesAno(new Date());
    const totais = {};

    gastos.forEach(g => {
      if (g.tipoOperacao !== 'despesa') return;
      const pertence = g.mesAno === 'fixo' || g.mesAno === mesAnoTarget;
      if (!pertence) return;
      const cat = g.categoria || g.tipo || 'Outros';
      totais[cat] = (totais[cat] || 0) + (g.valor || 0);
    });

    // Acordos contam como categoria "Acordos/Dívidas"
    let totalAcordos = 0;
    acordos.forEach(a => {
      if (a.situacao !== 'acordo') return;
      if (!u.temParcelaNesteMes(a, new Date())) return;
      totalAcordos += a.valorParcela || 0;
    });
    if (totalAcordos > 0) totais['Acordos/Dívidas'] = (totais['Acordos/Dívidas'] || 0) + totalAcordos;

    const entradas = Object.entries(totais);
    if (entradas.length === 0) return null;
    const [categoria, total] = entradas.sort((a, b) => b[1] - a[1])[0];
    return { categoria, total };
  },

  async projecaoDoMes() {
    const { gastos, acordos } = await this.carregarTudo();
    const hoje = new Date();
    const mesAnoTarget = u.dateParaMesAno(hoje);
    const diaHoje = hoje.getDate();
    const diasNoMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).getDate();
    let totalPago = 0;

    gastos.forEach(g => {
      if (g.tipoOperacao !== 'despesa') return;
      const isPago = g.mesAno === 'fixo'
        ? (g.pagos || []).includes(mesAnoTarget)
        : (g.mesAno === mesAnoTarget && !!g.pago);
      if (isPago) totalPago += g.valor || 0;
    });

    acordos.forEach(a => {
      (a.historicoPagamentos || []).forEach(h => {
        if (h.data && h.data.endsWith(mesAnoTarget))
          totalPago += h.valorPago || a.valorParcela || 0;
      });
    });

    if (totalPago === 0) return null;
    const mediaDiaria = totalPago / diaHoje;
    return Math.round(mediaDiaria * diasNoMes);
  },

  async gerarInsight() {
    const [percentual, maiorCat, saldoRestante] = await Promise.all([
      this.calcularPercentualGasto(),
      this.obterMaiorCategoria(),
      this.calcularSaldoRestante(),
    ]);
    const renda = await this.getRenda();

    if (renda <= 0)
      return { emoji: '💡', texto: 'Configure sua renda mensal para receber insights personalizados.', tipo: 'info' };
    if (percentual >= 100)
      return { emoji: '🚨', texto: 'Atenção! Seus gastos já ultrapassaram a renda do mês.', tipo: 'error' };
    if (percentual >= 80)
      return { emoji: '⚠️', texto: `Você já comprometeu ${percentual}% da renda. Cuidado com novos gastos!`, tipo: 'warning' };
    if (maiorCat && maiorCat.total > 0) {
      const pctCat = renda > 0 ? Math.round((maiorCat.total / renda) * 100) : 0;
      if (pctCat >= 30)
        return { emoji: '📊', texto: `"${maiorCat.categoria}" está consumindo ${pctCat}% da sua renda este mês.`, tipo: 'warning' };
    }
    if (percentual <= 50)
      return { emoji: '✅', texto: `Você usou apenas ${percentual}% da renda. Ótimo controle financeiro!`, tipo: 'success' };
    return { emoji: '📈', texto: `${percentual}% da renda comprometida. Você está dentro do esperado.`, tipo: 'info' };
  },

  // ── GASTOS MENSAIS ────────────────────────────────────────────────────────

  async dadosGastosMensais(mesOffset = 0) {
    const { acordos, gastos } = await this.carregarTudo();
    const hoje = new Date();
    const mesAlvo = u.mesComOffset(mesOffset);
    const mesAnoTarget = u.dateParaMesAno(mesAlvo);
    const mesAtualNum = u.mesAnoParaNum(u.dateParaMesAno(hoje));
    const alvoNum = u.mesAnoParaNum(mesAnoTarget);

    let histEnt = 0, histSai = 0;
    gastos.forEach(g => {
      if (g.mesAno === 'fixo') {
        (g.pagos || []).forEach(mStr => {
          if (u.mesAnoParaNum(mStr) < alvoNum) {
            if (g.tipoOperacao === 'entrada') histEnt += g.valor || 0;
            else histSai += g.valor || 0;
          }
        });
      } else {
        if (g.pago && u.mesAnoParaNum(g.mesAno) < alvoNum) {
          if (g.tipoOperacao === 'entrada') histEnt += g.valor || 0;
          else histSai += g.valor || 0;
        }
      }
    });
    acordos.forEach(a => {
      (a.historicoPagamentos || []).forEach(h => {
        if (!h.data) return;
        const parts = h.data.split('/');
        if (parts.length === 3) {
          const hNum = parseInt(`${parts[2]}${parts[1]}`);
          if (hNum < alvoNum) histSai += h.valorPago || a.valorParcela || 0;
        }
      });
    });
    const sobraAnterior = Math.max(0, histEnt - histSai);

    const gastosFiltrados = gastos.filter(g => {
      if (g.mesAno === 'fixo') return mesOffset >= 0;
      if (g.mesAno === mesAnoTarget) return true;
      return mesOffset === 0 && !g.pago && u.mesAnoParaNum(g.mesAno) < mesAtualNum;
    });

    const acordosFiltrados = acordos.filter(a => {
      if (a.situacao !== 'acordo' && a.situacao !== 'quitado') return false;
      const jaPagoMes = u.parcelaPagaNesteMes(a, mesAnoTarget);
      if (jaPagoMes) return true;
      const pagas = parseInt(a.parcelasPagas) || 0;
      const totais = parseInt(a.parcelas) || 1;
      if (pagas >= totais) return false;
      const esperadas = u.parcelasEsperadas(a.dataAcordo || hoje.toISOString().substr(0, 10), mesAlvo);
      if (esperadas <= 0) return false;
      if (pagas >= esperadas) return false;
      if (esperadas <= totais) return true;
      return mesOffset === 0;
    });

    return { gastos: gastosFiltrados, acordos: acordosFiltrados, sobraAnterior, mesAnoTarget };
  },

  // ── RELATÓRIO ─────────────────────────────────────────────────────────────

  async dadosRelatorio(mesOffset = 0) {
    const { acordos, gastos } = await this.carregarTudo();
    const hoje = new Date();
    const mesAlvo = u.mesComOffset(mesOffset);
    const mesAnoTarget = u.dateParaMesAno(mesAlvo);
    const alvoNum = u.mesAnoParaNum(mesAnoTarget);

    let entradas = [], entradasPagas = [];
    let despesas = [], despesasPagas = [];
    let acordosPendentes = [], acordosPagos = [];

    gastos.forEach(g => {
      const pertence = g.mesAno === 'fixo' || g.mesAno === mesAnoTarget ||
        (g.mesAno !== 'fixo' && !g.pago && u.mesAnoParaNum(g.mesAno) < alvoNum && mesOffset === 0);
      if (!pertence) return;
      const isPago = g.mesAno === 'fixo'
        ? (g.pagos || []).includes(mesAnoTarget)
        : !!g.pago;
      if (g.tipoOperacao === 'entrada') isPago ? entradasPagas.push(g) : entradas.push(g);
      else isPago ? despesasPagas.push(g) : despesas.push(g);
    });

    acordos.forEach(a => {
      if (a.situacao !== 'acordo' && a.situacao !== 'quitado') return;
      const pagas = parseInt(a.parcelasPagas) || 0;
      const totais = parseInt(a.parcelas) || 1;
      const esperadas = u.parcelasEsperadas(a.dataAcordo || hoje.toISOString().substr(0, 10), mesAlvo);
      const jaPago = u.parcelaPagaNesteMes(a, mesAnoTarget);
      if (jaPago) { acordosPagos.push(a); return; }
      if (pagas >= totais) return;
      if (esperadas <= 0 || esperadas > totais) return;
      if (pagas < esperadas) acordosPendentes.push(a);
    });

    const totalEnt = [...entradas, ...entradasPagas].reduce((s, g) => s + (g.valor || 0), 0);
    const totalSai = [...despesas, ...despesasPagas].reduce((s, g) => s + (g.valor || 0), 0)
      + [...acordosPendentes, ...acordosPagos].reduce((s, a) => s + (a.valorParcela || 0), 0);
    const totalEntPago = entradasPagas.reduce((s, g) => s + (g.valor || 0), 0);
    const totalSaiPago = despesasPagas.reduce((s, g) => s + (g.valor || 0), 0)
      + acordosPagos.reduce((s, a) => s + (a.valorParcela || 0), 0);

    return { entradas, entradasPagas, despesas, despesasPagas, acordosPendentes, acordosPagos, totalEnt, totalSai, totalEntPago, totalSaiPago };
  },

  async dadosGrafico(meses = 6) {
    const { acordos, gastos } = await this.carregarTudo();
    const hoje = new Date();
    const resultado = [];

    for (let i = meses - 1; i >= 0; i--) {
      const d = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
      const mAno = u.dateParaMesAno(d);
      let ent = 0, sai = 0;

      gastos.forEach(g => {
        const pertence = g.mesAno === mAno || (g.mesAno === 'fixo' && (g.pagos || []).includes(mAno));
        if (!pertence) return;
        const isPago = g.mesAno === 'fixo' ? (g.pagos || []).includes(mAno) : !!g.pago;
        if (!isPago) return;
        if (g.tipoOperacao === 'entrada') ent += g.valor || 0;
        else sai += g.valor || 0;
      });

      acordos.forEach(a => {
        (a.historicoPagamentos || []).forEach(h => {
          if (h.data && h.data.endsWith(mAno)) sai += h.valorPago || a.valorParcela || 0;
        });
      });

      const nomes = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
      resultado.push({ label: nomes[d.getMonth()], entradas: ent, saidas: sai });
    }

    return resultado;
  },

  // ── ESCRITA — GASTOS/ACORDOS ──────────────────────────────────────────────

  async registarPagamentoGasto(item, mesAnoTarget) {
    const hojeStr = `${String(new Date().getDate()).padStart(2, '0')}/${mesAnoTarget}`;
    if (item.tipo === 'acordo') {
      const acordo = await db.acordos.get(item.id);
      let hist = acordo.historicoPagamentos || [];
      let pagas = parseInt(acordo.parcelasPagas) || 0;
      let sit = acordo.situacao;

      if (item.isPago) {
        hist = hist.filter(h => !(h.data && h.data.includes(`/${mesAnoTarget}`)));
        pagas = pagas > 0 ? pagas - 1 : 0;
        if (sit === 'quitado') sit = 'acordo';
      } else {
        hist.push({ data: hojeStr, valorPago: acordo.valorParcela, parcela: pagas + 1 });
        pagas += 1;
        if (pagas >= (parseInt(acordo.parcelas) || 1)) sit = 'quitado';
      }
      await db.acordos.update(item.id, { historicoPagamentos: hist, parcelasPagas: pagas, situacao: sit });
    } else {
      if (item.mesAno === 'fixo') {
        let pagos = item.pagos || [];
        pagos = pagos.includes(mesAnoTarget)
          ? pagos.filter(m => m !== mesAnoTarget)
          : [...pagos, mesAnoTarget];
        await db.gastos.update(item.id, { pagos });
      } else {
        await db.gastos.update(item.id, { pago: !item.pago });
      }
    }
  },

  async registarPagamentoAcordo(acordo, qtd, data) {
    const dataFormatada = data.split('-').reverse().join('/');
    const historico = [...(acordo.historicoPagamentos || [])];
    for (let i = 1; i <= qtd; i++) {
      historico.push({ parcela: parseInt(acordo.parcelasPagas || 0) + i, data: dataFormatada, valorPago: acordo.valorParcela });
    }
    const novasPagas = parseInt(acordo.parcelasPagas || 0) + parseInt(qtd);
    const sit = novasPagas >= acordo.parcelas ? 'quitado' : acordo.situacao;
    await db.acordos.update(acordo.id, {
      parcelasPagas: novasPagas,
      historicoPagamentos: historico,
      situacao: sit,
    });
    return sit === 'quitado';
  },

  async apagarGasto(id)   { await db.gastos.delete(id); },
  async atualizarGasto(id, dados) { await db.gastos.update(id, dados); },
  async criarGasto(dados) { return db.gastos.add(dados); },
  async criarGastos(lista) { return db.gastos.bulkAdd(lista); },
  async apagarAcordo(id)  { await db.acordos.delete(id); },
  async criarAcordo(dados)          { return db.acordos.add(dados); },
  async atualizarAcordo(id, dados)  { await db.acordos.update(id, dados); },


  // ── BACKUP / RESTORE ──────────────────────────────────────────────────────

  async exportarTudo() {
    const [gastos, acordos, configuracoes] = await Promise.all([
      db.gastos.toArray(),
      db.acordos.toArray(),
      db.configuracoes.toArray(),
    ]);
    return { gastos, acordos, configuracoes };
  },

  async importarTudo({ gastos, acordos, configuracoes }) {
    if (gastos)        { await db.gastos.clear();        await db.gastos.bulkAdd(gastos); }
    if (acordos)       { await db.acordos.clear();       await db.acordos.bulkAdd(acordos); }
    if (configuracoes) { await db.configuracoes.clear(); await db.configuracoes.bulkAdd(configuracoes); }
  },

  // ── LISTA DE COMPRAS ──────────────────────────────────────────────────────

  async carregarListas() {
    return db.listas.orderBy('dataCriacao').reverse().toArray();
  },

  async carregarItensDaLista(listaId) {
    return db.itensLista.where('listaId').equals(listaId).toArray();
  },

  async criarLista(nome, orcamento = 0) {
    const id = await db.listas.add({
      nome,
      orcamento,
      status: 'aberta',       // aberta | concluida
      dataCriacao: new Date().toISOString(),
      dataFechamento: null,
      totalEstimado: 0,
      totalReal: 0,
    });
    return id;
  },

  async adicionarItemLista(listaId, { nome, categoria, quantidade, unidade, valorEstimado }) {
    const id = await db.itensLista.add({
      listaId,
      nome,
      categoria: categoria || 'Mercado',
      quantidade: parseFloat(quantidade) || 1,
      unidade: unidade || 'un',
      valorEstimado: parseFloat(valorEstimado) || 0,
      valorReal: null,
      status: 'pendente',     // pendente | comprado | removido
    });
    await this._recalcularTotaisLista(listaId);
    return id;
  },

  async marcarItemComprado(itemId, valorReal = null) {
    const item = await db.itensLista.get(itemId);
    if (!item) return;
    const vReal = valorReal !== null ? parseFloat(valorReal) : item.valorEstimado;
    await db.itensLista.update(itemId, {
      status: 'comprado',
      valorReal: vReal,
    });
    await this._recalcularTotaisLista(item.listaId);
  },

  async desmarcarItemComprado(itemId) {
    const item = await db.itensLista.get(itemId);
    if (!item) return;
    await db.itensLista.update(itemId, { status: 'pendente', valorReal: null });
    await this._recalcularTotaisLista(item.listaId);
  },

  async removerItemLista(itemId) {
    const item = await db.itensLista.get(itemId);
    if (!item) return;
    await db.itensLista.delete(itemId);
    await this._recalcularTotaisLista(item.listaId);
  },

  async editarItemLista(itemId, dados) {
    await db.itensLista.update(itemId, dados);
    const item = await db.itensLista.get(itemId);
    if (item) await this._recalcularTotaisLista(item.listaId);
  },

  async _recalcularTotaisLista(listaId) {
    const itens = await db.itensLista.where('listaId').equals(listaId).toArray();
    const ativos = itens.filter(i => i.status !== 'removido');
    const totalEstimado = ativos.reduce((s, i) => s + (i.valorEstimado || 0) * (i.quantidade || 1), 0);
    const totalReal = ativos
      .filter(i => i.status === 'comprado')
      .reduce((s, i) => s + (i.valorReal || 0) * (i.quantidade || 1), 0);
    await db.listas.update(listaId, { totalEstimado, totalReal });
  },

  /**
   * Conclui a lista: registra os itens comprados como gastos no mês atual.
   * Retorna o total lançado em Gastos.
   */
  async concluirLista(listaId) {
    const lista = await db.listas.get(listaId);
    if (!lista) return 0;

    const itens = await db.itensLista.where('listaId').equals(listaId).toArray();
    const comprados = itens.filter(i => i.status === 'comprado');
    const mesAnoTarget = u.dateParaMesAno(new Date());
    const diaHoje = new Date().getDate();
    let totalLancado = 0;

    for (const item of comprados) {
      const valor = (item.valorReal || item.valorEstimado || 0) * (item.quantidade || 1);
      if (valor <= 0) continue;
      await db.gastos.add({
        nome: `🛒 ${item.nome}`,
        valor,
        categoria: item.categoria || 'Mercado',
        tipoOperacao: 'despesa',
        mesAno: mesAnoTarget,
        dia: diaHoje,
        pago: true,
        origemLista: listaId,
        nomeLista: lista.nome,
      });
      totalLancado += valor;
    }

    await db.listas.update(listaId, {
      status: 'concluida',
      dataFechamento: new Date().toISOString(),
    });

    return totalLancado;
  },

  async reabrirLista(listaId) {
    // Remove gastos gerados por esta lista (usa índice v9)
    await db.gastos.where('origemLista').equals(listaId).delete();
    await db.listas.update(listaId, { status: 'aberta', dataFechamento: null });
  },

  async excluirLista(listaId) {
    await db.gastos.where('origemLista').equals(listaId).delete();
    await db.itensLista.where('listaId').equals(listaId).delete();
    await db.listas.delete(listaId);
  },
};

export default FinanceiroService;
