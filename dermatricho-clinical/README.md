# DermaTricho Clinical

Módulo clínico clean-room inspirado em padrões funcionais de apps de decisão clínica, destinado a futura integração no Derma Studio/Skincoder da Dra. Pamella.

## Escopo

Somente Dermatologia e Tricologia. Não inclui clínica geral.

## Objetivos funcionais

- busca rápida por doença, sintoma, estrutura anatômica ou termo relacionado;
- catálogo por categorias;
- favoritos e recentes;
- ficha clínica padronizada;
- diagnóstico diferencial;
- exames e investigação;
- conduta e tratamento;
- prescrições estruturadas e editáveis;
- alertas, contraindicações e seguimento;
- campos específicos de tricologia/tricoscopia;
- ponto de integração com IA para gerar resumo, plano e relatório do paciente;
- futura conexão com pacientes, fotos, evolução, rotina, produtos e protocolos do Derma Studio.

## Estrutura da ficha clínica

1. Resumo
2. Clínica
3. Diagnóstico
4. Diagnósticos diferenciais
5. Exames
6. Tratamento
7. Prescrição / posologia
8. Alertas / contraindicações
9. Seguimento
10. Referências

### Campos adicionais em Tricologia

- padrão de perda;
- áreas acometidas;
- sinais de atividade;
- tricoscopia;
- cicatricial vs. não cicatricial;
- pull test / shedding;
- procedimentos e terapias adjuvantes;
- documentação fotográfica/evolução.

## Arquitetura de integração futura

Derma Studio
→ Pacientes / Avaliação
→ Rotina
→ Produtos e Protocolos
→ Biblioteca Clínica DermaTricho
→ IA clínica
→ Relatório

O módulo deve compartilhar autenticação, paciente, banco e histórico clínico do Derma Studio quando for incorporado ao projeto principal.

## Clean-room

Este módulo replica funções e padrões de fluxo, não código, marca, textos, assets, conteúdo proprietário nem APIs privadas do Whitebook. Conteúdo clínico será escrito do zero e suportado por fontes públicas e diretrizes científicas.