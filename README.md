# Finanças PWA - Controle Financeiro

Aplicativo de controle financeiro pessoal como Progressive Web App (PWA), desenvolvido com React, TypeScript, Firebase e Tailwind CSS.

## Funcionalidades

- **Autenticação**: Login com email/senha ou Google
- **Dashboard**: Visão geral das finanças com gráficos
- **Transações**: Controle de receitas e despesas
- **Cartões**: Gerenciamento de cartões de crédito e débito
- **Investimentos**: Acompanhamento de carteira de investimentos
- **Categorias**: Organização personalizada de categorias
- **Lembretes**: Alertas de contas a pagar
- **Relatórios**: Geração de relatórios em PDF
- **Assistente IA**: Dicas e análises financeiras
- **Perfil**: Configurações e compartilhamento

## Tecnologias

- React 18 + TypeScript
- Vite
- Tailwind CSS
- shadcn/ui
- Firebase (Auth, Firestore, Storage)
- Recharts (gráficos)
- jsPDF (relatórios)

## Estrutura do Projeto

```
/public
  /icons          - Ícones do PWA (72x72 a 512x512)
  manifest.json   - Configuração do PWA
  service-worker.js - Service Worker para offline
  offline.html    - Página offline
/src
  /components     - Componentes reutilizáveis
  /pages          - Páginas da aplicação
  /hooks          - Custom hooks (useAuth, useTransactions, etc.)
  /firebase       - Configuração do Firebase
  /types          - Tipos TypeScript
App.tsx           - Rotas principais
main.tsx          - Entry point com registro do SW
```

## Configuração do Firebase

1. Crie um projeto no [Firebase Console](https://console.firebase.google.com/)
2. Ative Authentication (Email/Password e Google)
3. Crie um banco de dados Firestore
4. Copie as credenciais do projeto
5. Crie o arquivo `.env` na raiz:

```env
VITE_FIREBASE_API_KEY=sua-api-key
VITE_FIREBASE_AUTH_DOMAIN=seu-projeto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=seu-projeto-id
VITE_FIREBASE_STORAGE_BUCKET=seu-projeto.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef
VITE_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
```

## Como Executar

### Desenvolvimento Local

```bash
# Instalar dependências
npm install

# Executar em modo desenvolvimento
npm run dev
```

Acesse `http://localhost:5173`

### Build de Produção

```bash
# Criar build otimizado
npm run build

# Preview do build
npm run preview
```

## Hospedagem

### Vercel (Recomendado)

1. Instale a CLI: `npm i -g vercel`
2. Execute: `vercel`
3. Siga as instruções

Ou conecte seu repositório Git diretamente na [Vercel](https://vercel.com/).

### Firebase Hosting

```bash
# Instalar Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Inicializar
firebase init hosting

# Deploy
firebase deploy
```

## Validação PWA

### PWA Builder

1. Acesse [PWA Builder](https://www.pwabuilder.com/)
2. Insira a URL do seu app hospedado
3. Clique em "Start"
4. Verifique se todas as verificações passam:
   - ✅ Manifesto válido
   - ✅ Service Worker registrado
   - ✅ HTTPS habilitado
   - ✅ Ícones corretos

### Lighthouse (Chrome DevTools)

1. Abra o app no Chrome
2. Pressione F12 > Lighthouse
3. Selecione "PWA" e "Performance"
4. Clique em "Generate report"
5. Objetivo: Score 90+ em todas as categorias

## Instalação no Dispositivo

### Android
1. Acesse o app no Chrome
2. Toque no menu (3 pontos)
3. Selecione "Adicionar à tela inicial"

### iOS
1. Acesse o app no Safari
2. Toque no botão de compartilhar
3. Selecione "Adicionar à Tela de Início"

### Desktop (Chrome/Edge)
1. Acesse o app
2. Clique no ícone de instalação na barra de endereço
3. Siga as instruções

## Funcionamento Offline

O app funciona offline graças ao Service Worker que:
- Cacheia arquivos estáticos
- Mantém dados do Firebase em cache
- Mostra página offline quando necessário
- Sincroniza dados quando volta online

## Gerar APK (Android)

1. Vá para [PWA Builder](https://www.pwabuilder.com/)
2. Insira a URL do app
3. Clique em "Package for stores"
4. Selecione "Android"
5. Baixe o APK gerado

## Contribuição

1. Fork o projeto
2. Crie uma branch: `git checkout -b feature/nova-feature`
3. Commit: `git commit -m 'Adiciona nova feature'`
4. Push: `git push origin feature/nova-feature`
5. Abra um Pull Request

## Licença

MIT License - veja o arquivo [LICENSE](LICENSE) para detalhes.

---

Desenvolvido com React + Firebase
