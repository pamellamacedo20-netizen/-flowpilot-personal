const templates=[
  {id:'instagram-dm-auto-reply',name:'DM do Instagram → resposta automática',channel:'Instagram',description:'Responde uma DM recebida, identifica a intenção e marca o contato para atendimento.',flow:{nodes:[
    {id:'dm1',type:'trigger',name:'DM recebida',body:'Quando uma nova mensagem chegar no Direct',x:80,y:150,config:{triggerType:'instagram_message'}},
    {id:'dm2',type:'ai',name:'Entender a mensagem',body:'Classificar intenção e produzir resposta curta',x:360,y:150,config:{mode:'generate',prompt:'Responda com educação e objetividade à mensagem: {{text}}. Se a pessoa pedir preço ou agendamento, pergunte qual atendimento deseja.',fallbackText:'Olá! Obrigada pela mensagem. Posso te ajudar com informações e agendamento. O que você gostaria de saber?',sendReply:true}},
    {id:'dm3',type:'action',name:'Marcar atendimento Instagram',body:'Adicionar tag instagram_dm',x:690,y:150,config:{action:'add_tag',tag:'instagram_dm'}},
    {id:'dm4',type:'action',name:'Registrar conversão',body:'Registrar contato atendido pelo Direct',x:990,y:150,config:{action:'mark_conversion',conversionKey:'instagram_dm_atendido'}}
  ],edges:[{id:'dme1',from:'dm1',to:'dm2'},{id:'dme2',from:'dm2',to:'dm3'},{id:'dme3',from:'dm3',to:'dm4'}]}},
  {id:'comment-to-dm',name:'Comentário → DM',channel:'Instagram',description:'Responde interesse em comentário, qualifica e marca o lead.',flow:{nodes:[
    {id:'t1',type:'trigger',name:'Comentário com palavra-chave',body:'Quando alguém comentar QUERO',x:80,y:150,config:{triggerType:'instagram_comment',keywords:['quero']}},
    {id:'t2',type:'message',name:'Abrir conversa',body:'Olá, {{contact.name}}! Vi seu comentário. Posso te fazer uma pergunta rápida?',x:360,y:150,config:{}},
    {id:'t3',type:'condition',name:'Interesse confirmado?',body:'Ramifique por resposta',x:650,y:150,config:{}},
    {id:'t4',type:'action',name:'Marcar lead qualificado',body:'Adicionar tag lead quente',x:930,y:75,config:{action:'add_tag',tag:'lead quente'}},
    {id:'t5',type:'action',name:'Registrar conversão',body:'Registrar conversão de interesse',x:1190,y:75,config:{action:'mark_conversion',conversionKey:'lead_qualificado'}},
    {id:'t6',type:'message',name:'Encerrar',body:'Sem problema. Quando quiser, estou por aqui.',x:930,y:260,config:{}}
  ],edges:[{id:'te1',from:'t1',to:'t2'},{id:'te2',from:'t2',to:'t3'},{id:'te3',from:'t3',to:'t4',label:'sim'},{id:'te4',from:'t4',to:'t5'},{id:'te5',from:'t3',to:'t6',label:'não'}]}},
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
