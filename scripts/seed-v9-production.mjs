import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();

if (!url || !serviceKey || !adminEmail) {
  console.error('Configure NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY e ADMIN_EMAIL.');
  process.exit(1);
}
if (/example\.supabase\.co|SEU-PROJETO/i.test(url) || /preview|xxxxxxxx|troque-por/i.test(serviceKey)) {
  console.error('Recusado: ambiente ainda contém credenciais-placeholder.');
  process.exit(1);
}

const sb = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });

async function findUserByEmail(email) {
  for (let page = 1; page <= 10; page++) {
    const { data, error } = await sb.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    const user = data.users.find((u) => u.email?.toLowerCase() === email);
    if (user) return user;
    if (data.users.length < 1000) break;
  }
  return null;
}

async function upsertCatalogItem(item) {
  const { data: existing, error: readError } = await sb.from('catalog_items').select('id').eq('title', item.title).eq('section', item.section).maybeSingle();
  if (readError) throw readError;
  if (existing?.id) {
    const { error } = await sb.from('catalog_items').update(item).eq('id', existing.id);
    if (error) throw error;
    return 'updated';
  }
  const { error } = await sb.from('catalog_items').insert(item);
  if (error) throw error;
  return 'created';
}

const admin = await findUserByEmail(adminEmail);
if (!admin) throw new Error(`Usuário administrador ${adminEmail} ainda não existe no Supabase Auth. Crie a conta uma vez e execute novamente.`);

const { error: profileRoleError } = await sb.from('profiles').upsert({ id: admin.id, email: adminEmail, full_name: 'Dra. Pamella Macedo Bermudes', role: 'admin' }, { onConflict: 'id' });
if (profileRoleError) throw profileRoleError;

const { error: memberError } = await sb.from('member_profiles').upsert({
  user_id: admin.id,
  public_name: 'Dra. Pamella Macedo Bermudes',
  profession: 'Tricologia e Transplante Capilar',
  city: 'Vitória',
  state: 'ES',
  country: 'Brasil',
  tags: ['tricologia', 'transplante capilar', 'dermatologia'],
  accent: 'member-a',
  is_visible: true,
  updated_at: new Date().toISOString(),
}, { onConflict: 'user_id' });
if (memberError) throw memberError;

const { data: courses, error: coursesError } = await sb.from('courses').select('id,title,status').order('created_at', { ascending: true });
if (coursesError) throw coursesError;
const primaryCourse = (courses || []).find((c) => c.status === 'published') || (courses || [])[0] || null;

const catalog = [
  { title: primaryCourse?.title || 'Formação em Tricologia Clínica', subtitle: 'Conteúdo principal da Pamella Academy', section: 'formacoes', cover_style: 'catalog-wine', badge: 'FORMAÇÃO', course_id: primaryCourse?.id || null, external_url: null, locked: false, is_published: true, position: 10 },
  { title: 'Trilha Transplante Capilar', subtitle: 'Jornada de aprofundamento técnico', section: 'trilhas', cover_style: 'catalog-active', badge: 'TRILHA', course_id: null, external_url: null, locked: true, is_published: true, position: 20 },
  { title: 'Protocolos e Checklists', subtitle: 'Materiais complementares para consulta', section: 'bonus', cover_style: 'catalog-champagne', badge: 'BÔNUS', course_id: null, external_url: null, locked: false, is_published: true, position: 30 },
  { title: 'Biblioteca de Atualização', subtitle: 'Conteúdos e referências selecionadas', section: 'produtos', cover_style: 'catalog-library', badge: 'BIBLIOTECA', course_id: null, external_url: null, locked: true, is_published: true, position: 40 },
  { title: 'Comunidade Pamella Academy', subtitle: 'Conexão entre membros e atualizações da comunidade', section: 'sociedade', cover_style: 'catalog-mentor', badge: 'COMUNIDADE', course_id: null, external_url: '/society', locked: false, is_published: true, position: 50 },
];

for (const item of catalog) {
  const outcome = await upsertCatalogItem(item);
  console.log(`✓ ${outcome}: ${item.title}`);
}
console.log('✓ Perfil institucional da Dra. Pamella configurado.');
console.log(`✓ Catálogo V9 pronto com ${catalog.length} itens.`);
console.log('Seed concluído sem duplicação de itens por título + seção.');
