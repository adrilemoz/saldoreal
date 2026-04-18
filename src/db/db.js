// src/db/db.js
// ─────────────────────────────────────────────────────────────────────────────
// Dexie database — SaldoRealDB
//
// ATENÇÃO ao adicionar versões:
//   - Nunca modifiques versões anteriores.
//   - Adiciona sempre uma nova versão (incrementa o número).
//   - O upgrade() é obrigatório apenas se precisares migrar dados existentes.
// ─────────────────────────────────────────────────────────────────────────────

import Dexie from 'dexie';

const db = new Dexie('SaldoRealDB');

// ── v7 ──────────────────────────────────────────────────────────────────────
db.version(7).stores({
  gastos:         '++id, mesAno, tipoOperacao',
  acordos:        '++id, empresa, situacao',
  configuracoes:  'chave',
});

// ── v8 — Lista de Compras ────────────────────────────────────────────────────
db.version(8).stores({
  gastos:         '++id, mesAno, tipoOperacao',
  acordos:        '++id, empresa, situacao',
  configuracoes:  'chave',
  listas:         '++id, nome, status, dataCriacao',
  itensLista:     '++id, listaId, status',
});

// ── v9 — índice origemLista em gastos ────────────────────────────────────────
db.version(9).stores({
  gastos:         '++id, mesAno, tipoOperacao, origemLista',
  acordos:        '++id, empresa, situacao',
  configuracoes:  'chave',
  listas:         '++id, nome, status, dataCriacao',
  itensLista:     '++id, listaId, status',
});

// ── v10 — itensLista: novos campos de unidade e preço por medida ─────────────
// Campos adicionados: unidade, precoPorMedida, valorTotal, valorTotalReal
// (campos antigos valorEstimado e valorReal continuam a existir para
//  compatibilidade com itens criados nas versões anteriores)
db.version(10).stores({
  gastos:         '++id, mesAno, tipoOperacao, origemLista',
  acordos:        '++id, empresa, situacao',
  configuracoes:  'chave',
  listas:         '++id, nome, status, dataCriacao',
  itensLista:     '++id, listaId, status',
}).upgrade(async (tx) => {
  // Migra itens antigos: preenche valorTotal a partir de valorEstimado * quantidade
  await tx.itensLista.toCollection().modify((item) => {
    if (item.valorTotal === undefined) {
      item.valorTotal = (item.valorEstimado || 0) * (item.quantidade || 1);
    }
    if (item.unidade === undefined) {
      item.unidade = 'un';
    }
    if (item.precoPorMedida === undefined) {
      item.precoPorMedida = item.valorEstimado || 0;
    }
  });
});

// ── Abertura com fallback de recuperação ─────────────────────────────────────
db.open().catch(async (err) => {
  console.error('[SaldoRealDB] Erro ao abrir base de dados:', err);
  await Dexie.delete('SaldoRealDB');
  location.reload();
});

export default db;
