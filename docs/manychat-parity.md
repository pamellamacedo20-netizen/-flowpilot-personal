# FlowPilot × ManyChat — Instagram parity roadmap

Atualizado em 2026-11-02.

## Implementado nesta branch

- DM recebida (`instagram_message`)
- Resposta a Story (`instagram_story_reply`)
- Menção em Story (`instagram_story_mention`)
- Comentários de Post/Reel (`instagram_comment`)
- Comentários de Live (`instagram_live_comment`)
- Filtros de palavra: contém, exato, começa com, palavra inteira
- Palavras excluídas
- Qualquer comentário
- Escopo por mídia específica / próxima mídia vinculada
- Escopo de Story específico
- Default Reply com fallback somente quando nenhum fluxo específico corresponde
- Cooldown por contato, incluindo 1 resposta a cada 24 h
- Resposta pública a comentário via replies edge
- Private reply por `comment_id`
- Variações determinísticas de resposta pública para reduzir repetição
- Private reply terminal: o fluxo não continua até nova interação do usuário
- Templates prontos na galeria para comentário→DM, Story Reply, Story Mention, Default Reply e Live Comments
- Webhook normalizado com `commentId`, `mediaId`, `storyId` e metadados necessários
- CI com sintaxe e testes automatizados

## Regras de plataforma respeitadas

- Private reply de comentário é uma primeira mensagem especial; a janela normal de 24 h só começa após o usuário interagir.
- Story Reply e Story Mention usam a janela de atendimento permitida pelo evento do usuário.
- Story Mention pode ser limitado a uma resposta por usuário a cada 24 h.
- Default Reply é fallback e não deve competir com automações específicas.
- Live Comments usam private reply enquanto a live está ativa.

## Ainda não equivalente ao ManyChat

- Seletor visual de Posts/Reels/Stories pela API, com thumbnail e preview.
- Follow-to-DM (recurso dependente de elegibilidade da Meta).
- Instagram Ads Trigger / Click-to-Instagram Direct completo.
- Botões e Quick Replies específicos do primeiro private reply, com opt-in visual no builder.
- Reação automática ❤️ em Story Mention.
- Preview real no Instagram a partir do builder.
- Proteções anti-spam adaptativas por volume além das variações de resposta.
- Editor visual dedicado para todas as opções acima; os templates cobrem os casos padrão, e JSON continua disponível para configuração avançada.

## Critério antes de produção

1. CI verde.
2. Merge controlado para `main`.
3. Deploy Render `LIVE`.
4. OAuth Instagram conectado ao workspace.
5. Teste real de DM, comentário→private reply, Story Reply/Mention e Live.
6. Só então ativar automações em produção.
