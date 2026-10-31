# FlowPilot — implantação pessoal

Esta build foi preparada para 1 administrador, 1 workspace e uso privado.

## 0. Gere os segredos

Use `npm run secrets -- seu-email@exemplo.com` e guarde a saída em um gerenciador de senhas. Em produção o servidor recusa senha pessoal curta/default, chave de criptografia fraca, Postgres ausente ou `PUBLIC_BASE_URL` sem HTTPS.

## 1. Variáveis obrigatórias

Em produção configure:

- `PERSONAL_MODE=true`
- `PERSONAL_EMAIL` — seu login privado
- `PERSONAL_PASSWORD` — senha forte e exclusiva
- `PERSONAL_NAME`
- `PERSONAL_WORKSPACE_NAME`
- `STORAGE_DRIVER=postgres`
- `DATABASE_URL`
- `APP_ENCRYPTION_KEY` com pelo menos 32 bytes
- `PUBLIC_BASE_URL` com HTTPS
- `INSTAGRAM_APP_ID`
- `INSTAGRAM_APP_SECRET`
- `INSTAGRAM_OAUTH_REDIRECT_URI`
- `META_WEBHOOK_VERIFY_TOKEN`

Não coloque senhas, App Secret ou tokens no Git.

## 2. Meta / Instagram

No painel da Meta, configure o callback OAuth exatamente como:

`https://SEU_DOMINIO/api/oauth/instagram/callback`

Configure o webhook em:

`https://SEU_DOMINIO/api/webhooks/meta`

Use no painel da Meta o mesmo valor de `META_WEBHOOK_VERIFY_TOKEN` configurado no servidor.

Depois entre no FlowPilot → Configurações → Conectar Instagram. A autorização acontece pelo login oficial do Instagram.

## 3. Validação

Em Configurações use:

- `Checar produção` — infraestrutura, Postgres, HTTPS, segredos e worker.
- `Diagnosticar Instagram` — token, perfil e assinaturas do webhook.

O teste final é enviar uma DM a partir de outra conta para o Instagram conectado e verificar Inbox + execução da automação + resposta.

## 4. Segurança do modo pessoal

Quando `PERSONAL_MODE=true`:

- cadastro público retorna 403;
- criação de workspace retorna 403;
- billing/Stripe retorna 403;
- qualquer `x-workspace-id` externo é ignorado;
- o usuário autenticado é forçado ao único workspace disponível;
- a interface esconde billing, equipe e seletor de workspace.
