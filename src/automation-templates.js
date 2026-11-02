const templates=[
  {id:'instagram-dm-auto-reply',name:'DM do Instagram → resposta automática',channel:'Instagram',description:'Responde uma DM recebida, identifica a intenção e marca o contato para atendimento.',flow:{nodes:[
    {id:'dm1',type:'trigger',name:'DM recebida',body:'Quando uma nova mensagem chegar no Direct',x:80,y:150,config:{triggerType:'instagram_message'}},
    {id:'dm2',type:'ai',name:'Entender a mensagem',body:'Classificar intenção e produzir resposta curta',x:360,y:150,config:{mode:'generate',prompt:'Responda com educação e objetividade à mensagem: {{text}}. Se a pessoa pedir preço ou agendamento, pergunte qual atendimento deseja.',fallbackText:'Olá! Obrigada pela mensagem. Posso te ajudar com informações e agendamento. O que você gostaria de saber?',sendReply:true}},
    {id:'dm3',type:'action',name:'Marcar atendimento Instagram',body:'Adicionar tag instagram_dm',x:690,y:150,config:{action:'add_tag',tag:'instagram_dm'}},
    {id:'dm4',type:'action',name:'Registrar conversão',body:'Registrar contato atendido pelo Direct',x:990,y:150,config:{action:'mark_conversion',conversionKey:'instagram_dm_atendido'}}
  ],edges:[{id:'dme1',from:'dm1',to:'dm2'},{id:'dme2',from:'dm2',to:'dm3'},{id:'dme3',from:'dm3',to:'dm4'}]}},
  {id:'comment-to-dm',name:'Comentário/Reel → resposta pública + DM',channel:'Instagram',description:'Responde publicamente e envia a primeira private reply usando o comment_id. A continuação depende da interação do usuário.',flow:{nodes:[
    {id:'t1',type:'trigger',name:'Comentário com palavra-chave',body:'Quando alguém comentar QUERO',x:80,y:150,config:{triggerType:'instagram_comment',keywords:['quero'],keywordMatch:'full_word',mediaScope:'all'}},
    {id:'t2',type:'action',name:'Resposta pública',body:'Te mandei uma mensagem no direct.',x:360,y:80,config:{action:'instagram_public_reply',replies:['Te mandei uma mensagem no direct 😊','Acabei de te enviar os detalhes no direct.','Mensagem enviada no direct ✨']}},
    {id:'t4',type:'action',name:'Marcar origem',body:'Adicionar tag comentario_instagram',x:650,y:80,config:{action:'add_tag',tag:'comentario_instagram'}},
    {id:'t3',type:'action',name:'Private reply',body:'Olá! Vi seu comentário e te mandei esta mensagem para continuar por aqui. Toque em responder se quiser que eu te ajude.',x:930,y:150,config:{action:'instagram_private_reply'}}
  ],edges:[{id:'te1',from:'t1',to:'t2'},{id:'te2',from:'t2',to:'t4'},{id:'te3',from:'t4',to:'t3'}]}},
  {id:'instagram-story-reply',name:'Resposta ao Story → DM',channel:'Instagram',description:'Inicia uma automação quando alguém responde ou reage a um Story.',flow:{nodes:[
    {id:'sr1',type:'trigger',name:'Resposta ao Story',body:'Quando alguém responder ao Story',x:80,y:150,config:{triggerType:'instagram_story_reply',storyScope:'all'}},
    {id:'sr2',type:'message',name:'Responder no Direct',body:'Oi! Vi sua resposta ao Story 😊 Como posso te ajudar?',x:380,y:150,config:{}},
    {id:'sr3',type:'action',name:'Marcar origem',body:'Adicionar tag story_reply',x:690,y:150,config:{action:'add_tag',tag:'story_reply'}}
  ],edges:[{id:'sre1',from:'sr1',to:'sr2'},{id:'sre2',from:'sr2',to:'sr3'}]}},
  {id:'instagram-story-mention',name:'Menção em Story → resposta',channel:'Instagram',description:'Responde a menções públicas em Stories e pode limitar a uma resposta por usuário a cada 24 horas.',flow:{nodes:[
    {id:'sm1',type:'trigger',name:'Menção em Story',body:'Quando alguém mencionar seu perfil em um Story público',x:80,y:150,config:{triggerType:'instagram_story_mention',oncePer24h:true}},
    {id:'sm2',type:'delay',name:'Atraso natural',body:'30 segundos',x:360,y:150,config:{delayMs:30000}},
    {id:'sm3',type:'message',name:'Agradecer menção',body:'Obrigada por me mencionar no seu Story! 💛',x:650,y:150,config:{}},
    {id:'sm4',type:'action',name:'Marcar origem',body:'Adicionar tag story_mention',x:930,y:150,config:{action:'add_tag',tag:'story_mention'}}
  ],edges:[{id:'sme1',from:'sm1',to:'sm2'},{id:'sme2',from:'sm2',to:'sm3'},{id:'sme3',from:'sm3',to:'sm4'}]}},
  {id:'instagram-default-reply',name:'Resposta padrão do Instagram',channel:'Instagram',description:'Fallback quando nenhuma automação mais específica corresponde. Pode responder sempre ou uma vez por 24 horas.',flow:{nodes:[
    {id:'dr1',type:'trigger',name:'Resposta padrão',body:'Quando chegar uma DM sem outro fluxo correspondente',x:80,y:150,config:{triggerType:'instagram_default_reply',dmOnly:true,oncePer24h:true,anyMessage:true}},
    {id:'dr2',type:'message',name:'Resposta padrão',body:'Olá! Obrigada pela mensagem. Me conte em uma frase como posso te ajudar.',x:390,y:150,config:{}},
    {id:'dr3',type:'action',name:'Marcar origem',body:'Adicionar tag default_reply',x:730,y:150,config:{action:'add_tag',tag:'default_reply'}}
  ],edges:[{id:'dre1',from:'dr1',to:'dr2'},{id:'dre2',from:'dr2',to:'dr3'}]}},
  {id:'instagram-live-comments',name:'Comentários da Live → private reply',channel:'Instagram',description:'Detecta comentários durante uma Live e envia uma private reply enquanto a transmissão está ativa.',flow:{nodes:[
    {id:'lc1',type:'trigger',name:'Comentário na Live',body:'Quando alguém comentar QUERO durante a Live',x:80,y:150,config:{triggerType:'instagram_live_comment',keywords:['quero'],keywordMatch:'full_word'}},
    {id:'lc3',type:'action',name:'Marcar origem',body:'Adicionar tag live_instagram',x:390,y:100,config:{action:'add_tag',tag:'live_instagram'}},
    {id:'lc2',type:'action',name:'Private reply da Live',body:'Oi! Vi seu comentário na Live. Responda esta mensagem e eu continuo por aqui com você.',x:700,y:150,config:{action:'instagram_private_reply'}}
  ],edges:[{id:'lce1',from:'lc1',to:'lc3'},{id:'lce2',from:'lc3',to:'lc2'}]}},
  {id:'lead-qualification-ai',name:'Qualificação com IA',channel:'Instagram',description:'Detecta intenção, salva campo personalizado e marca conversão.',flow:{nodes:[
    {id:'q1',type:'trigger',name:'Intenção de orçamento',body:'Detectar intenção comercial',x:80,y:150,config:{triggerType:'ai_intent',threshold:1,intentDefinitions:[{name:'orcamento',examples:['quanto custa','valor','preço','orçamento']},{name:'duvida',examples:['como funciona','tenho dúvida']}] ,intents:['orcamento']}},
    {id:'q2',type:'ai',name:'Responder e qualificar',body:'Resposta curta orientada por contexto',x:370,y:150,config:{prompt:'Responda de forma objetiva a {{text}} e faça uma pergunta de qualificação.',fallbackText:'Posso te explicar os valores e entender qual opção faz mais sentido para você.',sendReply:true}},
    {id:'q3',type:'action',name:'Salvar interesse',body:'Campo interesse = orçamento',x:670,y:150,config:{action:'set_field',field:'interesse',value:'orçamento'}},
    {id:'q4',type:'action',name:'Conversão',body:'Registrar lead comercial',x:950,y:150,config:{action:'mark_conversion',conversionKey:'lead_comercial'}}
  ],edges:[{id:'qe1',from:'q1',to:'q2'},{id:'qe2',from:'q2',to:'q3'},{id:'qe3',from:'q3',to:'q4'}]}},
  {id:'follow-up-sequence',name:'Follow-up em sequência',channel:'WhatsApp',description:'Inscreve o contato em uma sequência durável de follow-up.',flow:{nodes:[
    {id:'s1',type:'trigger',name:'Tag orçamento',body:'Quando o lead entrar no fluxo',x:80,y:150,config:{triggerType:'keyword',keywords:['orçamento','valor']}},
    {id:'s2',type:'action',name:'Inscrever em sequência',body:'Iniciar sequência de follow-up',x:380,y:150,config:{action:'enroll_sequence',sequenceId:'seq_followup'}},
    {id:'s3',type:'action',name:'Marcar campo',body:'followup_ativo = sim',x:680,y:150,config:{action:'set_field',field:'followup_ativo',value:'sim'}}
  ],edges:[{id:'se1',from:'s1',to:'s2'},{id:'se2',from:'s2',to:'s3'}]}},
  {id:'external-webhook',name:'Webhook externo',channel:'WhatsApp',description:'Envia dados do lead para uma API externa de forma controlada.',flow:{nodes:[
    {id:'w1',type:'trigger',name:'Lead recebido',body:'Entrada do lead',x:80,y:150,config:{triggerType:'keyword',keywords:['quero']}},
    {id:'w2',type:'action',name:'Enviar ao CRM',body:'POST para webhook externo',x:380,y:150,config:{action:'http_request',http:{url:'https://example.com/webhooks/lead',method:'POST',body:{contactId:'{{contact.id}}',name:'{{contact.name}}',phone:'{{contact.phone}}',intent:'{{intent}}'}}}},
    {id:'w3',type:'message',name:'Confirmação',body:'Pronto, {{contact.name}}. Seu interesse foi registrado.',x:690,y:150,config:{}}
  ],edges:[{id:'we1',from:'w1',to:'w2'},{id:'we2',from:'w2',to:'w3'}]}}
];
function listTemplates(){return structuredClone(templates)}
function getTemplate(id){const t=templates.find(x=>x.id===id);return t?structuredClone(t):null}
module.exports={listTemplates,getTemplate};
