# Pamella Academy V8

Plataforma própria de cursos construída em clean-room, com identidade e código próprios.

## O que existe na V8

- Área da aluna com cursos, módulos, aulas, progresso e drip content.
- Vimeo protegido por RLS/tempo de liberação.
- Materiais por aula e anotações privadas.
- Editor de cursos, módulos, aulas, materiais e capa.
- Gestão de alunas, matrículas manuais e Hotmart.
- Certificados verificáveis.
- Avisos por curso.
- Quiz por aula com nota mínima e múltiplas tentativas.
- Gabarito não exposto ao navegador da aluna: questões são entregues por RPC segura e a correção acontece no banco.
- Quiz opcional ou obrigatório para o certificado.
- Dúvidas privadas por aula entre aluna e equipe.
- Caixa de entrada da criadora em `/admin/questions`.
- Analytics com conclusão de aulas e taxa de aprovação nos quizzes.

## Stack

Next.js 16.4.3, React 19.3.1, Supabase, Vimeo e integração Hotmart por webhook.

## Projeto novo

1. Crie um projeto Supabase.
2. Execute `supabase/schema.sql`.
3. Copie `.env.example` para `.env.local` e preencha as chaves.
4. Execute `npm install`.
5. Execute `npm run bootstrap:admin`.
6. Execute `npm run verify` e `npm run typecheck`.
7. Execute `npm run dev`.

## Atualizando da V7

Execute `supabase/migration_v7_to_v8.sql` uma única vez e publique o código da V8.

## Segurança importante

Nunca exponha `SUPABASE_SERVICE_ROLE_KEY` no navegador. O gabarito do quiz permanece em `quiz_options.is_correct`, mas a tabela só é consultável por criador/admin via RLS. Alunas recebem apenas IDs e textos das alternativas por `get_lesson_quiz()`; a correção usa `submit_quiz_attempt()` no banco.
