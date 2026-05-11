# Briefing de Inconsistências — SaldoReal
_Gerado em: análise estática do código-fonte_

---

## 🔴 BUG CORRIGIDO — Dias para pagamento não aparecem no primeiro acesso

**Arquivo:** `src/components/Home.jsx`  
**Causa:** No callback `onConcluir` do `TelaOnboarding`, o código só buscava `renda`
do banco após o cadastro inicial. O estado `diaPagamento` permanecia `null` mesmo que
o usuário tivesse preenchido o campo durante o onboarding.  
O `useMemo` de `diasParaPagamento` depende de `diaPagamento`, então o badge nunca
era exibido na primeira sessão — só após navegar para outra tela e voltar
(quando o `useEffect` remontava e carregava o valor do banco).

**Correção aplicada:**
```js
// ANTES (bugado)
const rendaDB = await FinanceiroService.getRenda();
setRenda(rendaDB); setUsuario(nome); setMostrarHumor(true);

// DEPOIS (corrigido)
const [rendaDB, diaDB] = await Promise.all([
  FinanceiroService.getRenda(),
  FinanceiroService.getDiaPagamento(),   // ← adicionado
]);
setRenda(rendaDB);
setDiaPagamento(diaDB);                  // ← adicionado
setUsuario(nome);
setMostrarHumor(true);
```

---

## 🔴 MELHORIA APLICADA — Exibição do badge de dias

**Arquivo:** `src/components/Home.jsx`

O badge exibia apenas `"13D"` — críptico para o usuário final.

**Nova lógica de exibição:**
| Dias | Antes | Depois | Cor |
|------|-------|--------|-----|
| 0 | `Hoje!` | `Hoje!` + sub "p/ salário" | Verde |
| 1 | `1d` | `Amanhã!` + sub "p/ salário" | Amarelo |
| 2–3 | `Xd` | `Faltam Xd` + sub "p/ salário" | Rosa |
| 4+ | `Xd` | `Faltam Xd` + sub "p/ salário" | Cinza |

---

## 🟠 Componentes Órfãos (dead code)

Os seguintes componentes existem em disco mas **nunca são importados** em nenhum
outro arquivo do projeto. São candidatos à remoção.

| Arquivo | Componente | Observação |
|---|---|---|
| `src/components/home/StatsBar.jsx` | `StatsBar` | Substituído por layout direto na Home |
| `src/components/home/CardResumoRapido.jsx` | `CardResumoRapido` | Nunca utilizado |
| `src/components/home/CardInsight.jsx` | `CardInsight` | `InsightStrip` é usado no lugar |
| `src/components/home/QuickMenu.jsx` | `QuickMenu` | `QuickMenuCards` é usado no lugar |

**Impacto:** Nenhum em runtime, mas aumentam o bundle final e confundem
quem mantém o código.

---

## 🟠 Terminologia Inconsistente (PT-PT vs PT-BR)

O projeto usa misturas de português de Portugal e português do Brasil.

| Local | Termo PT-PT | Equivalente PT-BR esperado |
|---|---|---|
| `useAcordos.js`, `Carteira.jsx`, `FinanceiroService.js` | `registar` | `registrar` |
| `Carteira.jsx` (toast de erro) | `guardar` | `salvar` |
| `ModalPagamentoAcordo.jsx` | `registar` | `registrar` |
| `Backup.jsx` | "guardar" | "salvar" |

**Recomendação:** padronizar tudo em PT-BR para consistência com o restante da UI.

---

## 🟠 Nomenclatura Duplicada — `valorDevidoMes` vs `valorDevidoNoMes`

A mesma operação tem dois nomes diferentes:

- `FinanceiroUtils.valorDevidoNoMes(acordo, mesAlvo)` — no utils
- `valorDevidoMes(acordo, offset)` — wrapper local em `Carteira.jsx`
- `FinanceiroUtils.valorDevidoNoMes(acordo, new Date())` — chamado diretamente em `ModalPagamentoAcordo.jsx`

**Risco:** Confusão ao manter ou adicionar lógica financeira. Recomenda-se
padronizar o nome e remover o wrapper se desnecessário.

---

## 🟠 `ListaCompras.jsx` — Itens "Avulsos" Sem Persistência

**Arquivo:** `src/components/ListaCompras.jsx` (linha ~359)

Existe um fluxo de itens em memória (`toggleAvulso`, `removerAvulso`, `adicionarAvulso`)
completamente paralelo ao fluxo persistido no Dexie (`toggleDexie`, `removerDexie`,
`adicionarDexie`). O comentário diz _"sem persistência formal"_.

**Risco:** Se o usuário estiver no modo "avulso" (sem lista ativa), os itens adicionados
são perdidos ao fechar o app.  
**Recomendação:** Clarificar intencionalmente no UI que o modo avulso é temporário,
ou migrar para persistência.

---

## 🟡 Fallback Nuclear no Banco de Dados

**Arquivo:** `src/db/db.js`

```js
db.open().catch(async (err) => {
  console.error('[SaldoRealDB] Erro ao abrir base de dados:', err);
  await Dexie.delete('SaldoRealDB');  // ← apaga TODOS os dados do usuário
  location.reload();
});
```

Qualquer erro na abertura do banco (ex: schema inválido durante dev, erro temporário)
resulta em **perda total e irrecuperável dos dados do usuário** e um reload silencioso.

**Recomendação:** Exibir um modal de aviso antes de deletar, com opção de cancelar
ou fazer download de backup, e só então deletar.

---

## 🟡 `calcularSaldoRestante` vs `saldoRealDoMes` — Conceitos Similares

Dois métodos em `FinanceiroService.js` com semânticas parecidas mas diferentes:

- `saldoRealDoMes()` → entradas pagas − saídas pagas (fluxo de caixa real)
- `calcularSaldoRestante()` → renda − débito do mês (projeção de saldo)

O nome `saldoReal` em `dadosDashboard()` retorna o fluxo de caixa, mas o estado
`saldoReal` no `CardHero` é usado como `renda + saldoReal` para compor o "saldo
exibido" — o que pode gerar confusão ao depurar valores inesperados.

**Recomendação:** Renomear para `fluxoCaixaMes()` e `saldoProjetado()` para
deixar o propósito explícito.

---

## 🟡 Erro Silencioso no `getConfig`

**Arquivo:** `src/services/FinanceiroService.js`

```js
async getConfig(chave, padrao = null) {
  try {
    const reg = await db.configuracoes.get(chave);
    return reg ? reg.valor : padrao;
  } catch { return padrao; }  // ← engole qualquer erro sem logar
},
```

Erros reais de IndexedDB são silenciados e retornam o valor padrão. Problemas
de banco de dados passam despercebidos.

**Recomendação:** Pelo menos `console.warn` no catch para facilitar debug.

---

## 🟡 SVG Icons Duplicados entre `App.jsx` e componentes internos

O comentário no próprio `App.jsx` admite:

```js
// SVG Icons — mesmo conjunto da Home, copiados aqui para não criar dep circular
```

Isso é um code smell: ícones duplicados que podem ficar dessincronizados.  
**Recomendação:** Extrair para `src/components/icons.jsx` e importar de lá.

---

## ✅ Pontos Positivos (sem ação necessária)

- Versionamento de schema do Dexie bem documentado e seguindo boas práticas.
- `useMemo` e `useCallback` usados corretamente nos hooks.
- Separação de responsabilidades entre `FinanceiroService`, `utils/financeiro` e hooks.
- `ErrorBoundary` implementado.
- Listeners de `visibilitychange` e `focus` para recarregar dados ao retornar ao app.
