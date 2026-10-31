# Pamella Academy V9 — Go-live real

Este fluxo substitui o modo demonstração por Supabase real sem expor credenciais.

## Ordem segura

1. Criar/conectar o projeto Supabase definitivo.
2. Aplicar `supabase/schema.sql` em projeto novo, ou todas as migrations pendentes em projeto existente (incluindo `migration_v8_to_v9.sql`).
3. Criar a conta administrativa em Supabase Auth com o mesmo e-mail de `ADMIN_EMAIL`.
4. Configurar na Vercel, como variáveis `sensitive` quando aplicável:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `HOTMART_HOTTOK`
   - `HEALTHCHECK_SECRET`
   - `APP_URL`
   - `ADMIN_EMAIL`
5. Definir `NEXT_PUBLIC_DEMO_MODE=false`.
6. Executar `npm run bootstrap:admin`.
7. Executar `npm run seed:v9`.
8. Executar `npm run go-live:check`.
9. Criar preview Vercel novo e testar login, home, mural, curso, progresso, materiais, notas, quizzes e dúvidas.
10. Só depois promover para produção.

## Seed V9

`npm run seed:v9` é idempotente para os itens-padrão do catálogo (título + seção) e configura o perfil institucional da Dra. Pamella. Itens podem ser editados ou ocultados em `/admin/catalog`.

## Regra de segurança

Nunca gravar `SUPABASE_SERVICE_ROLE_KEY`, `HOTMART_HOTTOK` ou `HEALTHCHECK_SECRET` no GitHub, em logs, screenshots ou mensagens de chat.
