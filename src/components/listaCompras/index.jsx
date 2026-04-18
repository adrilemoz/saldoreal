// src/components/listaCompras/index.jsx
//
// ════════════════════════════════════════════════════════════════════════════
// ListaComprasIndex — Orquestrador (apenas roteamento + estado de navegação)
//
// Responsabilidades ÚNICAS deste componente:
//   1. Controlar qual "tela" está ativa (seletor | lista_ativa)
//   2. Manter o estado da lista atualmente aberta e seus itens
//   3. Fazer a ponte entre o hook useListas e os componentes de UI
//
// NÃO contém: lógica de negócio, cálculos, UI própria.
// ════════════════════════════════════════════════════════════════════════════

import React, { useState, useEffect, useCallback } from 'react';
import { useListas }        from '../../hooks/useListas';
import TelaSeletorListas    from './TelaSeletorListas';
import TelaListaAtiva       from './TelaListaAtiva';

const TELAS = {
  SELETOR:      'seletor',
  LISTA_ATIVA:  'lista_ativa',
};

const ListaComprasIndex = () => {
  const hook = useListas();

  const [tela,       setTela]       = useState(TELAS.SELETOR);
  const [listaAtiva, setListaAtiva] = useState(null);   // objeto lista do Dexie
  const [itens,      setItens]      = useState([]);     // itens filtrados da lista ativa

  // ── Carrega listas ao montar ───────────────────────────────────────────────
  useEffect(() => {
    hook.carregarListas();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Abre uma lista e carrega seus itens ────────────────────────────────────
  const abrirLista = useCallback(async (lista) => {
    const itensCarregados = await hook.carregarItens(lista.id);
    setItens(itensCarregados);
    setListaAtiva(lista);
    setTela(TELAS.LISTA_ATIVA);
  }, [hook]);

  // ── Sincroniza lista ativa com o estado do hook após mutações ─────────────
  const sincronizarListaAtiva = useCallback(async (listaId) => {
    const listas    = await hook.carregarListas();
    const atualizada = listas.find(l => l.id === listaId);
    if (atualizada) setListaAtiva(atualizada);
    const novosItens = await hook.carregarItens(listaId);
    setItens(novosItens);
  }, [hook]);

  // ── Handlers delegados para o hook ────────────────────────────────────────

  const handleCriarLista = async (nome, orcamento) => {
    const novoId = await hook.criarLista(nome, orcamento);
    const listas = await hook.carregarListas();
    const nova   = listas.find(l => l.id === novoId);
    if (nova) await abrirLista(nova);
  };

  const handleExcluir = async (listaId) => {
    await hook.excluirLista(listaId);
  };

  const handleReabrir = async (listaId) => {
    await hook.reabrirLista(listaId);
  };

  const handleToggle = async (itemId) => {
    const item = itens.find(i => i.id === itemId);
    if (!item) return;
    if (item.status === 'comprado') {
      await hook.desmarcarComprado(itemId);
    } else {
      await hook.marcarComprado(itemId);
    }
    await sincronizarListaAtiva(listaAtiva.id);
  };

  const handleRemove = async (itemId) => {
    await hook.removerItem(itemId);
    await sincronizarListaAtiva(listaAtiva.id);
  };

  const handleAdicionar = async (dados) => {
    await hook.adicionarItem(listaAtiva.id, dados);
    await sincronizarListaAtiva(listaAtiva.id);
  };

  const handleConcluir = async (listaId) => {
    return hook.concluirLista(listaId);
  };

  const handleEditarLista = async (listaId, dados) => {
    await hook.editarLista(listaId, dados);
    await sincronizarListaAtiva(listaId);
  };

  const handleLimpar = async () => {
    for (const item of itens) {
      await hook.removerItem(item.id);
    }
    await sincronizarListaAtiva(listaAtiva.id);
  };

  const handleVoltarAoSeletor = () => {
    setTela(TELAS.SELETOR);
    setListaAtiva(null);
    setItens([]);
    hook.carregarListas();
  };

  // ── Roteamento ─────────────────────────────────────────────────────────────
  if (tela === TELAS.LISTA_ATIVA && listaAtiva) {
    return (
      <TelaListaAtiva
        lista={listaAtiva}
        itens={itens}
        onVoltar={handleVoltarAoSeletor}
        onToggle={handleToggle}
        onRemove={handleRemove}
        onAdicionar={handleAdicionar}
        onConcluir={handleConcluir}
        onEditarLista={handleEditarLista}
        onLimpar={handleLimpar}
      />
    );
  }

  return (
    <TelaSeletorListas
      listas={hook.listas}
      loading={hook.loading}
      onVoltar={() => {}}            // sem tela anterior no fluxo atual
      onAbrirLista={abrirLista}
      onCriarLista={handleCriarLista}
      onExcluir={handleExcluir}
      onReabrir={handleReabrir}
    />
  );
};

export default ListaComprasIndex;
