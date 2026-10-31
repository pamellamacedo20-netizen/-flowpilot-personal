import { createClient } from '@supabase/supabase-js';

const env = process.env;
const required = ['NEXT_PUBLIC_SUPABASE_URL','NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY','SUPABASE_SERVICE_ROLE_KEY','APP_URL','ADMIN_EMAIL'];
let failed = false;
for (const key of required) {
  const value = env[key]?.trim();
  const bad = !value || /example\.supabase\.co|SEU-PROJETO|xxxxxxxx|troque-por|sb_publishable_preview/i.test(value);
  console.log(`${bad ? '✗' : '✓'} ${key}${bad ? ' — ausente/placeholder' : ''}`);
  if (bad) failed = true;
}
if (env.NEXT_PUBLIC_DEMO_MODE === 'true') {
  console.log('✗ NEXT_PUBLIC_DEMO_MODE — ainda está true');
  failed = true;
} else console.log('✓ NEXT_PUBLIC_DEMO_MODE — produção');
if (failed) process.exit(1);

const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
const checks = [
  ['profiles', () => sb.from('profiles').select('id', { count: 'exact', head: true })],
  ['courses', () => sb.from('courses').select('id', { count: 'exact', head: true })],
  ['catalog_items', () => sb.from('catalog_items').select('id', { count: 'exact', head: true })],
  ['member_profiles', () => sb.from('member_profiles').select('user_id', { count: 'exact', head: true })],
  ['lesson_resources', () => sb.from('lesson_resources').select('id', { count: 'exact', head: true })],
  ['lesson_notes', () => sb.from('lesson_notes').select('user_id', { count: 'exact', head: true })],
  ['quizzes', () => sb.from('quizzes').select('id', { count: 'exact', head: true })],
  ['lesson_questions', () => sb.from('lesson_questions').select('id', { count: 'exact', head: true })],
];
for (const [name, fn] of checks) {
  const { error } = await fn();
  if (error) {
    console.log(`✗ tabela ${name}: ${error.message}`);
    failed = true;
  } else console.log(`✓ tabela ${name}`);
}
const { count: catalogCount, error: catalogError } = await sb.from('catalog_items').select('id', { count: 'exact', head: true }).eq('is_published', true);
if (catalogError || !catalogCount) {
  console.log('✗ catálogo publicado — nenhum item visível');
  failed = true;
} else console.log(`✓ catálogo publicado — ${catalogCount} item(ns)`);

const adminEmail = env.ADMIN_EMAIL.trim().toLowerCase();
let adminUser = null;
for (let page = 1; page <= 10 && !adminUser; page++) {
  const { data, error } = await sb.auth.admin.listUsers({ page, perPage: 1000 });
  if (error) throw error;
  adminUser = data.users.find((u) => u.email?.toLowerCase() === adminEmail) || null;
  if (data.users.length < 1000) break;
}
if (!adminUser) {
  console.log(`✗ administrador no Auth — ${adminEmail}`);
  failed = true;
} else {
  const { data: profile, error } = await sb.from('profiles').select('role').eq('id', adminUser.id).maybeSingle();
  if (error || !profile || !['admin','creator'].includes(profile.role)) {
    console.log('✗ perfil administrativo não configurado');
    failed = true;
  } else console.log(`✓ administrador — role=${profile.role}`);
}
if (failed) process.exit(1);
console.log('\nGO-LIVE READY: banco, catálogo, admin e modo de produção validados.');
