export type MemberDemo = {
  id: string;
  name: string;
  profession: string;
  city: string;
  state: string;
  country: string;
  initials: string;
  tags: string[];
  accent: string;
  avatarUrl?: string;
  bannerUrl?: string;
};

export const demoMembers: MemberDemo[] = [
  { id:'m1', name:'Marina Alves', profession:'Médica dermatologista', city:'Vitória', state:'ES', country:'Brasil', initials:'MA', tags:['tricologia','dermatologia clínica'], accent:'member-a' },
  { id:'m2', name:'Carolina Reis', profession:'Médica', city:'São Paulo', state:'SP', country:'Brasil', initials:'CR', tags:['transplante capilar','FUE'], accent:'member-b' },
  { id:'m3', name:'Amanda Freitas', profession:'Enfermeira estética', city:'Belo Horizonte', state:'MG', country:'Brasil', initials:'AF', tags:['procedimentos','fotobiomodulação'], accent:'member-c' },
];

export type CatalogDemo = {
  id:string;
  title:string;
  subtitle:string;
  section:'formacoes'|'trilhas'|'bonus'|'mentoria'|'produtos'|'sociedade';
  cover:string;
  coverUrl?:string;
  locked?:boolean;
  progress?:number;
  courseId?:string;
  badge?:string;
  externalUrl?:string;
  resumeLessonId?:string;
  resumeSeconds?:number;
};

export const demoCatalog: CatalogDemo[] = [
  {id:'c-trico',title:'Tricologia Clínica',subtitle:'Da consulta ao plano terapêutico',section:'formacoes',cover:'catalog-wine',progress:42,courseId:'trico',badge:'FORMAÇÃO'},
  {id:'t1',title:'Comece por aqui',subtitle:'Orientação e nivelamento',section:'trilhas',cover:'catalog-question',courseId:'trico'},
  {id:'b1',title:'Atlas de Tricoscopia',subtitle:'Material visual de apoio',section:'bonus',cover:'catalog-atlas',badge:'BÔNUS'},
  {id:'mtr1',title:'Mentoria Clínica — Casos e Estratégia',subtitle:'Discussão de casos e raciocínio clínico',section:'mentoria',cover:'catalog-mentor',locked:true,badge:'MENTORIA'},
  {id:'p1',title:'Workshop de Transplante Capilar',subtitle:'Planejamento cirúrgico e jornada do paciente',section:'produtos',cover:'catalog-ink',locked:true,badge:'WORKSHOP'},
  {id:'s1',title:'Círculo PM',subtitle:'Comunidade profissional exclusiva',section:'sociedade',cover:'catalog-society',badge:'COMUNIDADE'},
];
