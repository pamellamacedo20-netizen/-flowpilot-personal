# Recon map — plataforma de automação conversacional

## Escopo clean-room

Fonte: páginas públicas e documentação pública do ManyChat. Não usa conta autenticada do produto-alvo, não lê bundles JS, não captura tráfego, não usa APIs privadas e não copia assets/textos.

## Core loop

1. Conectar um canal oficial.
2. Criar uma automação.
3. Definir gatilho.
4. Adicionar mensagens, condições, ações, espera ou etapa de IA.
5. Publicar/testar.
6. Contatos entram no fluxo.
7. A equipe acompanha conversas no Inbox e segmenta contatos.
8. Campanhas/broadcasts usam segmentos e regras de canal.

## Telas

- S01 Dashboard
- S02 Lista de automações
- S03 Flow builder
- S04 Contatos
- S05 Inbox
- S06 Broadcasts
- S07 Configurações/canais/equipe

## Fluxos

- F01 Criar e publicar automação
- F02 Editar automação visual
- F03 Adicionar/editar contato e tags
- F04 Responder conversa e pausar automação
- F05 Criar e agendar broadcast
- F06 Conectar/desconectar canal (mock no protótipo)

## Entidades inferidas

Workspace, User, ChannelConnection, Contact, Tag, Segment, Automation, FlowNode, FlowEdge, Conversation, Message, Broadcast, AuditEvent.

## Fora do escopo desta versão

- Entrega real de mensagens.
- OAuth real.
- Meta/WhatsApp/Instagram webhooks.
- SMS/email pagos.
- Billing real.
- IA real.
- Analytics de produção.
