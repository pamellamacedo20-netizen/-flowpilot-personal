# Serviço de reconstrução 3D do GraftMap Lab 0.10.39

O backend executa o COLMAP 4.2.1 em CPU via PyCOLMAP, com SIFT,
correspondências entre imagens, poses estimadas e triangulação
dos pontos reconstruídos. A malha entregue é esparsa e tem escala
relativa. O fluxo PyCOLMAP inclui cores RGB por vértice, obtidas das
fotografias. Isso permite visualizar as cores na malha. Ainda falta
um atlas de textura fotográfica. O caminho COLMAP CLI entrega a
geometria sem cores. A triangulação usa planos tangentes locais
para acompanhar superfícies curvas. Cada face exige apoio de mais
de uma vizinhança. O limite de distância em 3D reduz ligações através
de lacunas, e regiões com cobertura insuficiente podem ficar abertas.

## Rodar no próprio computador

Em Linux, macOS ou WSL com Python 3.10 ou superior, abra um terminal na pasta
`Backend`. Crie o ambiente virtual e instale as dependências.

```sh
python3 -m venv .venv
. .venv/bin/activate
python -m pip install -r requirements.txt
export GRAFTMAP_API_TOKEN="$(python -c 'import secrets; print(secrets.token_hex(24))')"
export GRAFTMAP_DATA="$(mktemp -d)"
uvicorn backend.app:app --host 127.0.0.1 --port 8000
```

Mantenha o terminal aberto. Em outro terminal, ative o mesmo ambiente
virtual e configure o mesmo token. Para vídeo, instale FFmpeg e FFprobe
no computador e confirme que os dois comandos estão no PATH.

```sh
. .venv/bin/activate
export GRAFTMAP_API_TOKEN='<mesmo token do primeiro terminal>'
python reconstruir_local.py --sessao '<UUID da sessão>' --fotos '/caminho/fotos' --saida malha-fotos.json
python reconstruir_local.py --sessao '<UUID da sessão>' --video '/caminho/volta.mov' --saida malha-video.json
```

Use o mesmo UUID nos dois comandos. A pasta deve conter de 12 a 48 JPEGs.
O vídeo precisa estar em MOV ou MP4 e ter entre 3 e 180 segundos. O comando
extrai quadros temporários, prioriza nitidez e descarta quadros muito
parecidos. Use `--quadros 12` para tentar selecionar até 12 quadros, por
exemplo ao comparar com um lote de 12 fotos. O padrão é 24. O vídeo
original permanece intacto. A API recebe JPEGs e roda o mesmo COLMAP
nos dois modos. O comando fala apenas com o serviço neste computador.

Na aba **3D** do iPad, selecione a sessão, importe os dois JSONs e abra
**Comparar malhas de fotos e vídeo**. Os arquivos têm origem identificada
e a importação exige que o UUID corresponda à sessão. Uma geometria
já salva fica protegida contra substituição. Arquivos de versões
anteriores sem indicação de origem são lidos como malhas fotográficas.

## Comparar precisão e cobertura em milímetros

Use um manequim imóvel com uma nuvem PLY de referência em milímetros,
obtida independentemente e recortada para a região de interesse. A
amostragem da referência deve ser densa e aproximadamente uniforme.
Faça uma sequência de fotos e uma gravação separada do mesmo manequim.
Mantenha a região e a iluminação comparáveis e registre os números
de vistas utilizados. Para comparar com o mesmo orçamento de vistas,
use a mesma quantidade de fotos e quadros aceitos.

Identifique seis marcos correspondentes em ambas as malhas e no PLY.
Escolha quatro marcos de ajuste não coplanares e dois pontos adicionais
de controle. Registre as coordenadas dos seis marcos do PLY no formato
`{"points_mm": [[x1,y1,z1], ..., [x6,y6,z6]]}`, substituindo os símbolos
por números. Na comparação do iPad, marque os pontos na mesma ordem
e toque em **Exportar comparação completa**. O JSON contém as duas malhas
e os marcos em ordem. As fotografias e o vídeo original continuam na sessão.

```sh
python comparar_geometria.py --pacote comparacao-3d.json \
  --referencia-ply referencia.ply --referencia-marcos referencia-marcos.json \
  --limiar-mm 2 --max-erro-marcos-mm 4 --saida relatorio-comparacao.json
```

Para arquivos de versões anteriores, substitua `--pacote comparacao-3d.json`
por `--fotos malha-fotos.json --video malha-video.json --marcos marcos-comparacao.json`.
A opção **Exportar somente marcos** ainda produz esse JSON separado.

Os valores 2 mm e 4 mm ilustram a chamada. Defina ambos os limiares
antes da aquisição, considerando a resolução do equipamento e a região.
Se um erro de marco exceder a tolerância, o método fica sem métricas
de superfície e o relatório marca a comparação como inconclusiva.

O relatório usa a mediana, o percentil 95 e a fração dentro do limiar.
A direção **malha para referência** descreve proximidade. A direção
**referência para malha** descreve cobertura dos pontos de referência.
As distâncias são aproximadas por pontos vizinhos e dependem da
densidade da nuvem e da amostragem das superfícies. O relatório inclui
o espaçamento mediano da referência. Resultados perto desse espaçamento
merecem ser repetidos com maior densidade. Contagens de faces ou
vértices não entram no cálculo.

## Testes

`pytest -q` cobre a API, o tratamento das imagens e o armazenamento.
No teste completo, o COLMAP registrou 12 de 12 vistas do conjunto
[South Building](https://www.demuc.de/colmap/datasets/) nos dois modos.
O teste de vídeo usou um MP4 montado com a mesma sequência de fotografias
e o extrator rejeitou um vídeo com a imagem parada. O teste Swift
conferiu a reabertura das duas malhas na mesma sessão e a preservação
das marcações. A comparação de capturas independentes com manequim
e referência física ainda precisa ser realizada.

## Hospedagem

O Dockerfile instala a versão fixada do PyCOLMAP. Para usar a rota remota
no iPad, hospede com HTTPS, armazenamento persistente em `/data` e um
`GRAFTMAP_API_TOKEN` aleatório de pelo menos 24 caracteres. O arquivo
`render.yaml` é uma configuração de referência. Esta versão não foi
implantada em um servidor remoto.

## Contrato HTTP

1. `POST /v1/jobs` com `Authorization: Bearer <token>`, `multipart/form-data`, `case_id` como UUID e várias partes `images`. Retorna `202` com `job_id`.
2. `GET /v1/jobs/{job_id}` — retorna `processing`, `completed` ou `failed`.
3. `GET /v1/jobs/{job_id}/mesh` — retorna a malha JSON.
4. `DELETE /v1/jobs/{job_id}` — exclui o job concluído e sua malha.

Rotas síncronas de compatibilidade `POST /reconstruct` e `/api/reconstruct` estão incluídas, porém podem expirar durante a fotogrametria. Prefira o fluxo de jobs. Os jobs em processamento são mantidos em memória; após reinício do servidor, apenas resultados já concluídos são recuperáveis.

## Como registrar as fotografias

Capture imagens ao redor da região com forte sobreposição (idealmente múltiplos ângulos progressivos, mantendo iluminação e foco constantes). Não confunda **12 fotos distintas** com 12 fotos úteis: se o cabelo não oferecer correspondências robustas ou não houver paralaxe suficiente, o COLMAP rejeitará a reconstrução. A imagem e o paciente não devem se mover significativamente durante a aquisição. Para obter escala física, será necessária uma referência calibrada e validação independente.

## Segurança e privacidade

**Use apenas fotos de objetos de teste neste estágio.** Para fotografias de pacientes reais, é necessário homologar LGPD, autorização apropriada, controle de acesso, retenção, criptografia em repouso, backups, políticas de exclusão e operação segura. O servidor elimina os JPEGs após o processamento, mas o modelo 3D persistido pode ainda conter informações identificáveis. Não exponha o token em repositórios nem compartilhe o link do servidor sem controles.



## Qualidade da reconstrução na versão 0.10.39

O PyCOLMAP conserva pontos observados em pelo menos três imagens,
com erro de reprojeção de até 2,5 pixels. Esse filtro pode reduzir
a quantidade de pontos e causar recusa de um lote insuficiente.
Ele não segmenta a cabeça nem assegura cobertura completa.

Os resultados incluem cores opcionais por vértice. As cores seguem
a deduplicação e a redução de pontos. Modelos antigos continuam aceitos.
O contador de imagens registradas aparece no visualizador do iPad.


## Excluir o fundo nas novas reconstruções por fotos

O computador pode gerar máscaras para objetos fotografados contra um
fundo uniforme. A máscara mantém a resolução e a orientação normalizada
da foto. Os arquivos originais permanecem preservados.

```sh
python preparar_mascaras.py --fotos '/caminho/fotos' --saida '/caminho/mascaras'
```

Abra REVISAO.jpg na pasta gerada. As regiões rosas ficam excluídas.
Confira todas as imagens e corrija manualmente os PNGs que precisarem.
A pasta de saída deve ser nova. Fundos complexos ou sem uma cor
predominante nas bordas podem impedir a geração. Essa operação não
identifica semanticamente uma cabeça e não foi validada em couro cabeludo.

```sh
python reconstruir_local.py --sessao '<UUID da sessão>' --fotos '/caminho/fotos' --mascaras '/caminho/mascaras' --saida malha-fotos-com-mascara.json
```

Cada foto tem uma máscara PNG opaca com o nome completo seguido de .png.
Por exemplo, IMG_001.jpg usa IMG_001.jpg.png. Preto exclui o fundo.
Qualquer valor acima de zero preserva a região. As dimensões devem
coincidir com a fotografia após correção da orientação EXIF.
Transparência é recusada para evitar a interpretação ambígua do fundo.

As máscaras são enviadas junto às fotos ao serviço e aplicadas durante
a extração de características do COLMAP. Depois do processamento,
as cópias de fotos e máscaras no servidor são removidas.
As chamadas antigas sem máscaras continuam funcionando.
Os quadros de vídeo continuam no fluxo anterior.
O app iPad recebe a malha resultante pela importação já existente.
A geração e a revisão de máscaras desta versão acontecem no computador.

Na API /v1/jobs, use campos multipart images e masks com uma máscara
por foto, na mesma ordem. O servidor valida formato, resolução e limites
antes de iniciar a reconstrução.


## Seleção das áreas no iPad

A versão 0.10.39 inclui revisão manual por fotografia na tela de
reconstrução. A elipse ajustável delimita a região preservada.
Salve a seleção em todas as fotos e ative o envio com máscaras.
O cliente monta um PNG opaco por foto, com as mesmas dimensões,
e envia fotos e máscaras na mesma ordem para /v1/jobs.
Use o Backend desta versão para aceitar inclusive PNGs RGBA opacos.
A geração de máscaras ocorre no iPad e a reconstrução ocorre no servidor.
O gerador automático para fundo uniforme continua disponível no computador.


## Recuperação e diagnóstico na versão 0.10.39

Quando a primeira calibração compartilhada perde imagens ou não produz
malha suficiente, o PyCOLMAP pode repetir o processamento com calibração
independente por imagem. Cada processo tem limite de 900 segundos.
O sistema ordena os resultados pelo número de imagens registradas e
pela quantidade de pontos e aceita a primeira malha geometricamente válida.
Uma falha na tentativa adicional não descarta a primeira malha válida.

O campo quality inclui registered_image_indices e
unregistered_image_indices, em ordem de envio, com índices a partir de
zero. O app exibe esses números a partir de um. camera_calibration
identifica o modelo escolhido, shared ou per_image.
O caminho de compatibilidade com executável COLMAP CLI mantém o fluxo
anterior e pode retornar apenas as contagens.

As duas pastas temporárias de processamento são removidas ao finalizar
o job. As fontes locais do usuário permanecem preservadas.
As novas informações descrevem registro de imagens, sem quantificar
cobertura anatômica ou precisão física da superfície.

## Textura projetada na versão 0.10.39

O fluxo PyCOLMAP inclui calibrações e poses no arquivo temporário de
pontos. A malha escolhida recebe um atlas por triângulo com pixels das
imagens originais, limitado a 4096 pixels por dimensão e 8 MiB JPEG.
O algoritmo usa projeção SIMPLE_RADIAL e um z-buffer de 128 pixels
para testar aproximadamente oclusões na malha esparsa. Cada face usa
a câmera com melhor pontuação por ângulo e distância entre as vistas
consideradas utilizáveis. A amostragem do atlas é de 32 pixels por face.

Máscaras são aplicadas à amostragem. Pontos fora da máscara e faces
sem vista utilizável recebem cor de apoio, sem preencher buracos
da geometria. Iluminação e exposição diferentes podem gerar emendas.
A checagem de visibilidade é aproximada e depende da própria geometria.

Os campos opcionais são texture_jpeg_base64, face_texture_coordinates
e texture_info. Cada face contém três coordenadas UV normalizadas.
O app renderiza triângulos com esses UVs e conserva a geometria original
para marcação e medição. O cabeçalho JPEG e os limites de dimensões
são verificados antes da apresentação.
O caminho COLMAP CLI continua no formato anterior sem atlas.


## Referência física por QR na versão 0.10.39

O endpoint /v1/jobs recebe opcionalmente o campo scale_reference como
JSON com marker_side_mm e observations. Cada observação contém
image_index na ordem de envio (a partir de zero) e corners com quatro
pares [x,y] normalizados, com origem no canto superior esquerdo.
O iPad lê somente o código GRAFTMAP-SCALE com Vision.

São necessárias quatro vistas registradas com o mesmo marcador rígido.
O algoritmo triangula primeiro três vistas e confere as seguintes,
depois refina com todas. Exige paralaxe mínima de 3 graus, erro máximo
de reprojeção de 3 pixels e consistência de lados, diagonais, ângulos
e centro das diagonais. Os limiares são critérios experimentais.

Quando aceita, a resposta adiciona metrics.units_per_cm e identifica
scale_source como qr_multiview_experimental. A geometria mantém unit
relative e validated_for_clinical_measurement permanece false.
A qualidade inclui o estado e a mensagem da estimativa ou recusa.
Uma referência inconsistente não impede retornar uma malha suficiente
em escala relativa. As observações temporárias são removidas ao
finalizar o processamento.

No utilitário local, --referencia-json permite fornecer o mesmo JSON
junto a --fotos. Os cantos devem estar alinhados às fotos normalizadas.
O modo de vídeo não aceita esse arquivo, pois seus índices dependeriam
dos quadros selecionados.
Os testes numéricos não validam a impressão nem a escala física real.


### 0.10.39 — conferência multi-vista das seleções
Quando máscaras são fornecidas ao PyCOLMAP, a superfície resultante passa por `clip_to_selections` antes do atlas. Sete amostras por face (vértices, meios das arestas e centro) são projetadas nas câmeras SIMPLE_RADIAL registradas. Duas vistas precisam apoiar a face inteira e nenhuma amostra em quadro pode contradizer uma seleção, com dilatação de dois pixels para arredondamento. Fotos e máscaras permanecem intactas. Coordenadas e cores dos vértices mantidos não são alteradas. Escala QR continua calculada nas câmeras originais.
Menos de 50 faces sustentadas recusa a reconstrução em vez de devolver silenciosamente a geometria sem filtro. Uma segunda tentativa de calibração também pode ser usada quando a primeira falha nessa conferência. A alternativa CLI continua sem esse filtro e informa essa limitação.
`quality.surface_topology` reporta `components` (conexão por aresta), `largest_component_faces`, `boundary_edges` e `nonmanifold_edges`. `quality.selection_filter` reporta faces removidas e vistas usadas; `quality.surface_review` fornece a explicação exibida no iPad. Não representam cobertura anatômica ou precisão clínica. Não há segmentação automática nem fechamento de lacunas. O método amostra faces e não calcula a interseção exata de todos os seus pixels.


### 0.10.40 — refinamento estéreo opcional
Reinstale requirements.txt ou reconstrua o container: acrescentado opencv-python-headless 4.12.0.88. A API /v1/jobs e rotas legadas aceitam campo de formulário `stereo_refine=true`; o padrão é false. Exige uma máscara alinhada por foto. O PyCOLMAP calcula poses normalmente; em seguida um subprocesso de até 120 segundos executa retificação e StereoSGBM. No fluxo CLI sem PyCOLMAP, informa que não executou o refinamento.
A implementação testa consistência esquerda/direita, contraste local e diferença fotométrica, limita a faixa de profundidade usando pontos esparsos e restringe novos pontos à vizinhança e caixa da nuvem original. Não acrescenta superfície anatômica inferida nem preenche buracos artificialmente. Usa até 12 pares e dois pares por câmera, 640 pixels de largura, 30 mil pontos e 7 mil vértices; proporções diferentes de fotos são recusadas para essa fase. Fotos e máscaras originais não são alteradas. Não é MVS denso completo.
A nova malha só é adotada com aumento de faces, limites de área e fragmentação. Caso contrário o resultado mantém a inicial. A mensagem `quality.stereo_refinement` indica adoção ou recusa e é preservada no iPad. Os critérios detalhados e resultados estão em Tests/stereo-v0.10.40.txt no pacote raiz; são heurísticas, não validação clínica.
Documentação técnica primária consultada para retificação, transformações e reprojeção: https://docs.opencv.org/4.x/d9/d0c/group__calib3d.html .
Uso local: acrescentar `--refinar-estereo` a reconstruir_local.py, com --fotos e --mascaras. O fluxo automático de extração de vídeo não aceita essa opção diretamente; os quadros precisam de revisão de máscaras.


### 0.10.42 — fotos e vídeo em lote híbrido
O iPad extrai e pré-seleciona quadros localmente; o upload continua sendo JPEGs, com campo opcional `photo_count` indicando quantas entradas iniciais são fotos. Deve haver ao menos uma foto e 12 quadros, até 48 entradas. A API valida antes de gravar e limpa o manifesto temporário ao concluir/falhar.
O worker tenta PER_FOLDER (grupo de fotos, grupo de vídeo) via links temporários e, se parcial, PER_IMAGE. O resultado preserva índices do lote, leva `capture_source: hybrid` e `quality.input_composition`. Exige PyCOLMAP. Clientes antigos sem esse campo mantêm comportamento anterior.
No desktop, `reconstruir_local.py --fotos pasta --video arquivo.mp4 --sessao UUID --saida resultado.json` prepara um lote híbrido; selecione --quadros conforme o limite total de 48. Não combine --mascaras ou --referencia-json com a extração automática de vídeo por esse script: os quadros precisam primeiro de revisão e máscaras alinhadas. Para o fluxo com máscaras, prepare os quadros como fotos antes ou use a revisão no iPad.
O FFmpeg agora limita o tamanho sem ampliar fontes menores. Fotos e vídeo originais não são alterados.
Referências primárias consultadas: https://colmap.github.io/tutorial e https://developer.apple.com/documentation/avfoundation/avassetimagegenerator/appliespreferredtracktransform . Vídeo exige sobreposição, textura e movimento adequado; não garante superfície fechada. Resultados do ensaio sintético em Tests/hybrid-v0.10.42.txt do pacote raiz.


### 0.10.43 — proposta de continuidade por ball pivoting
Reinstale requirements.txt ou reconstrua o container Linux incluído: acrescentado open3d-cpu==0.19.0. O backend executa a proposta em subprocesso de até 45 segundos sobre até 7.000 vértices. Exige máscaras e metadados de câmeras para conferir a proposta em várias vistas. Sem dependência, sem máscaras, com falha/timeout ou sem ganho heurístico, mantém a superfície anterior e informa a razão resumida.
Nenhum vértice é acrescentado ou deslocado pelo mesher; os triângulos novos interpolam entre amostras observadas e podem aumentar a área. A proposta é limitada por comprimentos locais, contagens de topologia, variação de área e conferência nas seleções. Esses testes não excluem todos os erros geométricos ou interseções. `quality.surface_refinement` informa o resultado; JSON permanece em unidade relativa e sem validação clínica.
A referência primária do algoritmo e da API utilizada é https://www.open3d.org/docs/release/tutorial/geometry/surface_reconstruction.html . Não há extrapolação por Poisson ou fecho convexo global. Casos com regiões não fotografadas devem continuar abertos. Resultados numéricos e testes em Tests/continuity-v0.10.43.txt no pacote raiz.


### 0.10.44 — apoio fotográfico e trajetória de captura
`face_view_support` é uma contagem por face, calculada durante a escolha de vistas do atlas. Usa enquadramento, incidência, profundidade aproximada e sete amostras de máscara. Pode existir sem textura quando nenhuma foto serve. Os consumidores antigos ignoram o novo campo; o novo cliente valida comprimento e valores antes de salvar.
`quality.mask_conflicts` conta contradições por entrada do lote na etapa de recorte; as contagens podem se sobrepor e não devem ser somadas como total de faces removidas. `quality.capture_guidance` fornece orientação heurística baseada nos centros das câmeras. Não são medidores de cobertura anatômica, movimento correto ou precisão clínica. A geometria reconstruída e seus critérios de aceitação permanecem os da 0.10.43.
Ensaio e limites detalhados em Tests/view-support-v0.10.44.txt do pacote raiz. O mapa de cores não inclui as áreas ausentes da superfície, mesmo quando todas as faces existentes têm múltiplas vistas.


### 0.10.45 — amostragem espacial antes da triangulação
A nuvem acima do orçamento é reduzida por farthest-point sampling, com pré-seleção em células para limitar o conjunto de trabalho. Seleciona apenas índices observados, sem deslocar coordenadas ou desvincular RGB. O limite de saída continua em 5.000 pontos (7.000 na etapa estéreo), e o atlas continua limitado a 16.384 faces. Para comparação com a implementação anterior, configure GRAFTMAP_POINT_SAMPLING=legacy; o padrão é spatial. O método efetivo é reportado em quality.point_sampling.
A amostragem busca distribuição espacial, não garante maior precisão nem substitui captura suficiente e calibração. Resultados e limites estão em Tests/spatial-v0.10.45.txt do pacote raiz. As poses e os pontos sintéticos de referência estão em Exemplo-Hibrido/pontos-e-cameras.npz, sem dados de pacientes.
O aplicativo passa a aceitar JSONs de malha de até 20 MiB; o novo exemplo ultrapassava o limite anterior de 5 MB. Mantém limites de textura e validação dos campos existentes.


### 0.10.47 — condicionamento dos pontos esparsos
Atualize o serviço para aplicar o filtro de separação angular no worker PyCOLMAP.
Após track.length >= 3 e erro <= 2,5 px, exige um par de raios com ângulo agudo
entre linhas >= 1°. Duplicatas e câmeras ausentes não fornecem evidência extra.
Pontos aceitos preservam xyz e RGB. A aceitação é por ponto observado, antes de
amostragem espacial e construção da superfície; não altera a escala física.
As contagens são devolvidas em quality.triangulation_review. Elas não representam
as observações de novos pontos do refinamento estéreo. O fluxo CLI de contingência
não aplica o filtro. Um lote mal condicionado pode passar a falhar por falta de
pontos; capture com translação da câmera e sobreposição, mantendo o objeto imóvel.
122 testes automatizados aprovados. No ensaio nativo da esfera (12 fotos e 24
quadros), registrou 36 vistas e reteve os 10.264 pontos: nenhuma mudança de
geometria atribuível ao filtro nesse exemplo. Relatório em Tests/triangulation-v0.10.47.txt
na raiz do pacote. Não há validação com cabeça de paciente nesta versão.


### 0.10.48 — pares estéreo em lotes de formatos mistos
Removida a restrição global de mesma proporção. `pair_working_size` elimina
pares incompatíveis antes da seleção e do orçamento de duas participações
por câmera. Pares 4:3 e pares 16:9 podem ser refinados no mesmo mundo COLMAP,
com resoluções de trabalho e calibrações próprias. Não são forçados pares
entre proporções diferentes. O cache de imagens inclui a resolução do par.
Os limites anteriores, as máscaras, a verificação esquerda/direita, a vizinhança
da nuvem e os critérios de aceitação da superfície continuam em vigor.
A falta de dois pares aceitos mantém o fallback anterior.
`working_sizes` lista resoluções dos pares aceitos; `working_width` e
`working_height` passam a representar máximos, que podem pertencer a pares
diferentes. Isso não é uma resolução única de todo o lote.
Validação: 127 testes backend; ensaio real SGBM e worker em plano sintético.
Sem novo ensaio com paciente. Atualize o serviço para obter a correção.


### 0.10.49 — apoio fotométrico em terceira vista
`third_view_support` verifica pontos SGBM antes da seleção por vizinhança e
amostragem. Exige outra imagem e ângulo agudo >= 1° com as duas linhas de
visão do par. Escolhe até quatro candidatas próximas do centro das câmeras
do par, com separação angular no centro mediano dos pontos; a separação é
reverificada por ponto. Cada candidata usa sua própria calibração/resolução.
Projeções com profundidade positiva, margem de três pixels, máscara erodida
7x7 e erro médio absoluto RGB < 35/255 fornecem apoio. Isso é heurística
fotométrica, não prova de visibilidade ou profundidade da terceira câmera.
Candidatas não examinadas podem conter apoio útil. Exposição/iluminação
variáveis podem recusar pontos corretos; texturas repetidas podem passar.
A falha do refinamento preserva a superfície inicial. O contrato de métricas
do worker acrescenta `third_view_checked` e `corroborated_pair_samples`;
esta última é contagem cumulativa por par antes de subamostragem e voxel,
não contagem de pontos únicos da malha. As coordenadas aceitas são mantidas.
134 testes backend aprovados, incluindo SGBM real em plano sintético com
formatos mistos e testes do worker. Não há novo ensaio em paciente.


### 0.10.50 — seleção de terceira vista por projeção e complementaridade
`third_view_candidates` avalia até 512 pontos já existentes por câmera,
exigindo profundidade positiva, separação angular e projeção interior ao quadro.
Escolhe até quatro candidatas por ganho de projeções ainda não alcançadas;
desempata pelo total projetável, proximidade e índice determinístico.
O ranking não decodifica imagem e não conhece máscara, textura ou profundidade
oclusora. A verificação fotométrica e de máscara permanece por ponto no passo
seguinte. Portanto candidatas selecionadas ainda podem falhar e vistas úteis
não selecionadas podem existir. O orçamento anterior é mantido.
`third_view_selection=projected_complementary_support` identifica a política
nos dados internos do worker. Não é métrica de cobertura anatômica.
Regressão com poses conhecidas: quatro vistas próximas voltadas para trás
bloqueavam uma quinta útil; 0/500 pontos apoiados antes, 500/500 depois, uma
imagem lida. Testes de complementaridade, determinismo e limites aprovados.
139 testes backend aprovados. Não houve novo ensaio de paciente ou de COLMAP
nesta versão; o teste adicional exercita a seleção com calibrações conhecidas.


### 0.10.51 — contradições com profundidade esparsa
`backend/sparse_occlusion.py` cria índices de projeção por câmera a partir dos
pontos esparsos observados. A terceira vista recusa apoio se a profundidade do
candidato exceder a mais frontal entre até 8 amostras próximas (raio de 2 pixels
de trabalho), acrescida de 3 vezes o espaçamento mediano 3D + 2% da profundidade.
O índice é cacheado por câmera/resolução, máximo 8 entradas. Os demais limites
seguem iguais. `sparse_occlusion_checked` identifica a checagem no worker.
Ausência de amostra é desconhecida, não uma certificação de visibilidade; o
ponto ainda depende das verificações anteriores. Não é depth map denso, não
interpola oclusores e pode errar com nuvem ruidosa ou incompleta. Limiares são
heurísticas do projeto e não comprovam precisão clínica.
Regressão de duas camadas observadas, mesma cor, poses conhecidas: a distância
da camada oculta à nuvem era zero; apoio indevido passou de 500 para 0, mantendo
500 pontos frontais. 145 testes backend aprovados e ensaio isolado dos seis
testes de oclusão. Sem novo caso de paciente, COLMAP ou execução nativa no iPad.
