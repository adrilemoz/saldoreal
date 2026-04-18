// ─────────────────────────────────────────────────────────────────────────────
// src/hooks/useAcordos.js
// Custom Hook — encapsula toda a lógica de acesso ao Dexie para acordos.
// Carteira.jsx e Acordos.jsx consomem este hook, não o db diretamente.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useCallback } from 'react';
import FinanceiroService from '../services/FinanceiroService';

export function useAcordos() {
  const [acordos, setAcordos]   = useState([]);
  const [loading, setLoading]   = useState(false);
  const [erro,    setErro]      = useState(null);

  const carregar = useCallback(async () => {
    setLoading(true);
    setErro(null);
    try {
      const data = await FinanceiroService.carregarAcordos();
      setAcordos(data);
    } catch (e) {
      console.error('[useAcordos] carregar:', e);
      setErro('Não foi possível carregar os acordos.');
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Registra o pagamento de N parcelas com um valor real (pode diferir do valor da parcela).
   * @param {object}  acordo        — objeto completo do acordo
   * @param {number}  qtd           — quantidade de parcelas a registar
   * @param {string}  data          — data no formato ISO (YYYY-MM-DD)
   * @param {number}  valorRealPago — valor realmente pago (por parcela)
   * @returns {boolean} — true se quitou
   */
  const registarPagamento = useCallback(async (acordo, qtd, data, valorRealPago) => {
    const dataFormatada = data.split('-').reverse().join('/');
    const historico = [...(acordo.historicoPagamentos || [])];
    const valorPorParcela = valorRealPago != null ? valorRealPago : (acordo.valorParcela || 0);

    for (let i = 1; i <= qtd; i++) {
      historico.push({
        parcela:   parseInt(acordo.parcelasPagas || 0) + i,
        data:      dataFormatada,
        valorPago: valorPorParcela,
      });
    }

    const novasPagas = parseInt(acordo.parcelasPagas || 0) + parseInt(qtd);
    const sit        = novasPagas >= acordo.parcelas ? 'quitado' : acordo.situacao;

    await FinanceiroService.atualizarAcordo(acordo.id, {
      parcelasPagas:        novasPagas,
      historicoPagamentos:  historico,
      situacao:             sit,
    });

    return sit === 'quitado';
  }, []);

  const excluir = useCallback(async (id) => {
    await FinanceiroService.apagarAcordo(id);
  }, []);

  return { acordos, loading, erro, carregar, registarPagamento, excluir };
}
