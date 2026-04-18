// src/hooks/useListas.js
// Custom Hook — encapsula 100% do acesso ao Dexie (tabelas listas + itensLista).
// Nenhum componente acede o db diretamente; tudo passa por aqui.

import { useState, useCallback } from 'react';
import db from '../db/db';
import { calcularValorItem } from '../components/listaCompras/constants';

// ── helper interno ─────────────────────────────────────────────────────────────
async function _recalcularTotais(listaId) {
  const itens      = await db.itensLista.where('listaId').equals(listaId).toArray();
  const ativos     = itens.filter(i => i.status !== 'removido');
  const totalEstimado = ativos.reduce((s, i) => s + (i.valorTotal || 0), 0);
  const totalReal     = ativos
    .filter(i => i.status === 'comprado')
    .reduce((s, i) => s + (i.valorTotalReal ?? i.valorTotal ?? 0), 0);
  await db.listas.update(listaId, { totalEstimado, totalReal });
}

// ─────────────────────────────────────────────────────────────────────────────
export function useListas() {
  const [listas,  setListas]  = useState([]);
  const [loading, setLoading] = useState(false);
  const [erro,    setErro]    = useState(null);

  // ── LEITURA ─────────────────────────────────────────────────────────────────

  const carregarListas = useCallback(async () => {
    setLoading(true);
    setErro(null);
    try {
      const data = await db.listas.orderBy('dataCriacao').reverse().toArray();
      setListas(data);
      return data;
    } catch (e) {
      console.error('[useListas] carregarListas:', e);
      setErro('Não foi possível carregar as listas.');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const carregarItens = useCallback(async (listaId) => {
    try {
      const todos = await db.itensLista.where('listaId').equals(listaId).toArray();
      return todos.filter(i => i.status !== 'removido');
    } catch (e) {
      console.error('[useListas] carregarItens:', e);
      return [];
    }
  }, []);

  // ── LISTAS ──────────────────────────────────────────────────────────────────

  const criarLista = useCallback(async (nome, orcamento = 0) => {
    const id = await db.listas.add({
      nome,
      orcamento:      parseFloat(orcamento) || 0,
      status:         'aberta',
      dataCriacao:    new Date().toISOString(),
      dataFechamento: null,
      totalEstimado:  0,
      totalReal:      0,
    });
    await carregarListas();
    return id;
  }, [carregarListas]);

  const editarLista = useCallback(async (listaId, dados) => {
    await db.listas.update(listaId, dados);
    await carregarListas();
  }, [carregarListas]);

  const excluirLista = useCallback(async (listaId) => {
    await db.transaction('rw', db.gastos, db.itensLista, db.listas, async () => {
      await db.gastos.where('origemLista').equals(listaId).delete();
      await db.itensLista.where('listaId').equals(listaId).delete();
      await db.listas.delete(listaId);
    });
    await carregarListas();
  }, [carregarListas]);

  /**
   * Lança todos os itens com status 'comprado' nos gastos do Dexie
   * e marca a lista como concluída.
   * @returns {number} total lançado em R$
   */
  const concluirLista = useCallback(async (listaId) => {
    const lista = await db.listas.get(listaId);
    if (!lista) return 0;

    const itens     = await db.itensLista.where('listaId').equals(listaId).toArray();
    const comprados = itens.filter(i => i.status === 'comprado');
    const hoje      = new Date();
    const mesAno    = `${String(hoje.getMonth() + 1).padStart(2, '0')}/${hoje.getFullYear()}`;
    let totalLancado = 0;

    await db.transaction('rw', db.gastos, db.listas, async () => {
      for (const item of comprados) {
        const valor = item.valorTotalReal ?? item.valorTotal ?? 0;
        if (valor <= 0) continue;
        await db.gastos.add({
          nome:         `🛒 ${item.nome}`,
          valor,
          categoria:    item.categoria || 'Outros',
          tipoOperacao: 'despesa',
          mesAno,
          dia:          hoje.getDate(),
          pago:         true,
          origemLista:  listaId,
          nomeLista:    lista.nome,
        });
        totalLancado += valor;
      }
      await db.listas.update(listaId, {
        status:         'concluida',
        dataFechamento: new Date().toISOString(),
        totalReal:      totalLancado,
      });
    });

    await carregarListas();
    return totalLancado;
  }, [carregarListas]);

  const reabrirLista = useCallback(async (listaId) => {
    await db.transaction('rw', db.gastos, db.listas, async () => {
      await db.gastos.where('origemLista').equals(listaId).delete();
      await db.listas.update(listaId, { status: 'aberta', dataFechamento: null });
    });
    await carregarListas();
  }, [carregarListas]);

  // ── ITENS ────────────────────────────────────────────────────────────────────

  /**
   * @param {number} listaId
   * @param {{ nome, categoria, quantidade, unidade, precoPorMedida }} dados
   */
  const adicionarItem = useCallback(async (listaId, dados) => {
    const valorTotal = calcularValorItem({
      quantidade:     dados.quantidade,
      unidade:        dados.unidade,
      precoPorMedida: dados.precoPorMedida,
    });
    const id = await db.itensLista.add({
      listaId,
      nome:           dados.nome.trim(),
      categoria:      dados.categoria   || 'Outros',
      quantidade:     parseFloat(dados.quantidade)     || 1,
      unidade:        dados.unidade     || 'un',
      precoPorMedida: parseFloat(dados.precoPorMedida) || 0,
      valorTotal,
      valorTotalReal: null,
      status:         'pendente',
    });
    await _recalcularTotais(listaId);
    return id;
  }, []);

  const editarItem = useCallback(async (itemId, dados) => {
    const item = await db.itensLista.get(itemId);
    if (!item) return;
    const merged = { ...item, ...dados };
    const valorTotal = calcularValorItem({
      quantidade:     merged.quantidade,
      unidade:        merged.unidade,
      precoPorMedida: merged.precoPorMedida,
    });
    await db.itensLista.update(itemId, { ...dados, valorTotal });
    await _recalcularTotais(item.listaId);
  }, []);

  const marcarComprado = useCallback(async (itemId, valorTotalReal = null) => {
    const item = await db.itensLista.get(itemId);
    if (!item) return;
    const vReal = valorTotalReal !== null ? parseFloat(valorTotalReal) : item.valorTotal;
    await db.itensLista.update(itemId, { status: 'comprado', valorTotalReal: vReal });
    await _recalcularTotais(item.listaId);
  }, []);

  const desmarcarComprado = useCallback(async (itemId) => {
    const item = await db.itensLista.get(itemId);
    if (!item) return;
    await db.itensLista.update(itemId, { status: 'pendente', valorTotalReal: null });
    await _recalcularTotais(item.listaId);
  }, []);

  const removerItem = useCallback(async (itemId) => {
    const item = await db.itensLista.get(itemId);
    if (!item) return;
    await db.itensLista.delete(itemId);
    await _recalcularTotais(item.listaId);
  }, []);

  return {
    listas,
    loading,
    erro,
    carregarListas,
    carregarItens,
    criarLista,
    editarLista,
    excluirLista,
    concluirLista,
    reabrirLista,
    adicionarItem,
    editarItem,
    marcarComprado,
    desmarcarComprado,
    removerItem,
  };
}
