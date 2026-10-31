# FlowPilot Personal — deploy no Render

## Estado atual
O projeto suporta deploy inicial em `SETUP_MODE=true`. Nesse modo, o servidor sobe com Postgres, login privado e worker mesmo antes de preencher as credenciais do Instagram. A tela de diagnóstico continuará mostrando Instagram como não configurado até a etapa Meta.

## Recursos
- Web service Node: `flowpilot-personal`
- Banco Postgres: fornecido por `DATABASE_URL` nas variáveis privadas do Render
- Região: Virginia
- Healthcheck: `/api/ready`
- Modo: single-user / single-workspace

## Deploy por Blueprint
1. Coloque este projeto em um repositório Git acessível ao Render.
2. No Render, crie um Blueprint apontando para o `render.yaml` da raiz.
3. Preencha `PERSONAL_EMAIL` e `PERSONAL_PASSWORD` (forte, exclusiva, com pelo menos 16 caracteres) quando solicitado. Nunca coloque esses valores no Git.
4. `APP_ENCRYPTION_KEY`, `META_WEBHOOK_VERIFY_TOKEN` e `METRICS_TOKEN` são gerados pelo Render.
5. Crie ou selecione um banco Postgres na mesma região. Preencha `DATABASE_URL` com a URL interna desse banco no painel privado do Render. O Blueprint não cria nem presume a existência de um banco.

## Depois do primeiro deploy
Verifique `/api/ready` e abra `/api/deployment/readiness` no domínio `onrender.com`. Em `SETUP_MODE=true`, `instagramOAuth=false` e `ok=false` no diagnóstico são esperados até configurar a Meta. O app deve reportar HTTPS, Postgres, criptografia, credenciais pessoais e worker como prontos.

## Conectar Meta/Instagram
1. Crie/configure o Meta App para Instagram Business Login.
2. Adicione no serviço as variáveis `INSTAGRAM_APP_ID`, `INSTAGRAM_APP_SECRET` e, se usado separadamente, `INSTAGRAM_WEBHOOK_SECRET`.
3. Use como OAuth callback: `https://SEU-SERVICO.onrender.com/api/oauth/instagram/callback`.
4. Use como webhook: `https://SEU-SERVICO.onrender.com/api/webhooks/meta`.
5. O verify token é o valor de `META_WEBHOOK_VERIFY_TOKEN` no Render.
6. Salve as variáveis e redeploy. Depois conecte o Instagram pela interface do FlowPilot.
7. Após validar a conexão, você pode mudar `SETUP_MODE=false`.

## Observação sobre plano Free
Para teste inicial, o plano Free é suficiente. Para automações de Direct que precisem responder com baixa latência 24/7, prefira um plano sem suspensão por inatividade.
