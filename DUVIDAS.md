# ❓ Dúvidas Frequentes — Minhas Finanças

---

## 🔧 Termux

**O script importar-financas.sh apaga meu histórico Git?**
Não. Foi corrigido para preservar a pasta `.git` a cada importação. Podes rodar quantas vezes quiseres sem perder o histórico.

**O `/tmp` não existe no Termux, dá erro no script?**
Corrigido. O script usa `$TMPDIR` que é o diretório temporário correto do Termux.

**Como instalar git e ssh no Termux?**
```bash
pkg update && pkg install -y git openssh
```

**Como dar acesso ao armazenamento?**
```bash
termux-setup-storage
# Aceita a permissão que aparecer no ecrã
```

---

## 🐙 GitHub

**Como enviar o projeto para o GitHub pela primeira vez?**
```bash
bash ~/enviar-github.sh
```
O script configura tudo: SSH, identidade Git, remote e push.

**Preciso rodar o enviar-github.sh toda vez?**
Não. Só na primeira vez. Depois usa:
```bash
cd ~/projetos/minhas-financas
git add . && git commit -m "descrição" && git push
```

**Esqueci de criar o repositório no GitHub antes de rodar o script?**
Cria em github.com → "+" → New repository → **sem** README, .gitignore ou licença → Create repository. Depois rode o script normalmente.

---

## 🌐 Vercel

**Como o deploy funciona?**
A Vercel está ligada ao teu repositório GitHub. A cada `git push` ela detecta automaticamente e publica uma nova versão. Não precisas fazer nada além do push.

**A URL do meu app é qual?**
`https://minhas-financas-five-mu.vercel.app`

**O Vite dá aviso de bundle grande (500kb). É problema?**
É só um aviso de performance — o app funciona normalmente. O bundle grande é causado pelo MUI. Pode ser otimizado com code splitting no `vite.config.js` quando quiseres.

---

## 📦 APK

**Como gerar o APK sem PC?**
O GitHub Actions gera automaticamente a cada `git push`. Para baixar:
1. GitHub → **Actions** → **Build APK Android**
2. Clica no workflow mais recente
3. Em **Artifacts** baixa `minhas-financas-debug`
4. Extrai e instala o `.apk` no telemóvel

**O APK gerado é debug ou release?**
Debug — suficiente para uso pessoal e testes. Para publicar na Play Store seria necessário um APK release com keystore assinado.

**Quanto tempo demora o build do APK?**
O primeiro build demora ~5 minutos. Os seguintes são mais rápidos pelo cache do Gradle (~2-3 minutos).

---

## 🧪 Testes

**Como rodar os testes unitários?**
```bash
cd ~/projetos/minhas-financas
npm run test:unit
```

**Como rodar os testes E2E sem clicar em nada?**
```bash
npx playwright test --reporter=line
```
O Playwright acede à Vercel e simula os cliques automaticamente.

**Os testes E2E falharam logo após um push. Por quê?**
A Vercel precisa de ~30 segundos para publicar após o push. Aguarda um momento e tenta novamente.

**O Playwright não funciona no Termux com browser local?**
Correto. Por isso os testes apontam para a Vercel (URL real). Não é possível abrir browser no Termux.

---

## 🗂️ Git

**O que é o `.gitattributes`?**
Garante que os ficheiros não corrompem entre diferentes sistemas operativos (Windows/Linux/Mac) — especialmente os scripts `.sh`.

**O que está no `.gitignore`?**
```
node_modules/   ← dependências (muito pesadas, reinstaladas com npm install)
dist/           ← build gerado automaticamente
android/        ← gerado pelo Capacitor
.env            ← variáveis de ambiente (segredos)
```

**Como ver o histórico de commits?**
```bash
git log --oneline
```

**Como desfazer o último commit (sem perder as alterações)?**
```bash
git reset --soft HEAD~1
```
