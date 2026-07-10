Finora Payments
Documentação de Integração — Webhooks e Postbacks
Visão geral
A Finora Payments notifica sistemas externos em tempo real através de Webhooks (requisição HTTP POST com corpo JSON) ou Postbacks (requisição HTTP GET com variáveis substituídas na própria URL). Ambos os mecanismos são configurados pelo vendedor no painel, em Dashboard → Ferramentas.
Este documento descreve o formato dos eventos disparados, como validar a autenticidade das requisições e como configurar um endpoint de recebimento.
Eventos disponíveis
●	VENDA_PENDENTE — disparado quando uma venda é criada e aguarda confirmação de pagamento (PIX gerado, boleto gerado, cartão em processamento).
●	VENDA_PAGA — disparado quando o pagamento é confirmado, após todo o processamento interno (split, carteira, notificações).
Webhooks (recomendado)
Formato da requisição
Requisição HTTP POST com header Content-Type: application/json. O corpo contém o evento e um objeto data com os detalhes da venda.
POST {sua_url_configurada} Content-Type: application/json X-Finora-Signature: sha256={assinatura_hmac}
Verificação de assinatura
Toda requisição inclui o header X-Finora-Signature, contendo um HMAC-SHA256 do corpo bruto da requisição (payload), calculado usando o "secret" configurado para aquele webhook específico no painel. Compare esse valor no seu servidor antes de confiar na requisição.
// Node.js — exemplo de verificação const crypto = require("crypto");  function verificarAssinatura(payloadBruto, assinaturaRecebida, secret) {   const esperada = crypto     .createHmac("sha256", secret)     .update(payloadBruto)     .digest("hex");    const recebida = assinaturaRecebida.replace("sha256=", "");   return esperada === recebida; }
Importante: calcule o HMAC sobre o corpo bruto da requisição (raw body), antes de qualquer parse de JSON — frameworks que já fazem parse automático do body (como Express com body-parser) podem exigir configuração especial para expor o raw body.
Estrutura do payload
{   "evento": "VENDA_PAGA",   "timestamp": "2026-07-10T14:32:00.000Z",   "data": { ... } }
Campos do objeto "data":
Campo	Tipo	Descrição
vendaId	string	ID único da venda na Finora
produtoNome	string	Nome do produto vendido
produtoId	string	ID único do produto
nomePlano	string | null	Nome do plano/oferta específico, se houver
valor	number	Valor total da venda (produto + order bumps)
valorProduto	number	Valor do produto, sem order bumps
valorOrderBumps	number	Soma dos order bumps adicionados
orderBumps	array	Lista de order bumps: [{ nome, valor }]
valorLiquido	number	Valor líquido após taxas da plataforma (apenas em VENDA_PAGA)
compradorNome	string	Nome completo do comprador
compradorEmail	string	E-mail do comprador
compradorCpf	string	CPF do comprador (somente números)
compradorTel	string	Telefone do comprador (somente números)
metodoPagamento	string	PIX, CARTAO ou BOLETO
status	string	PENDENTE ou PAGO
createdAt	string (ISO 8601)	Data/hora de criação da venda
utmSource	string | null	UTM source da campanha de origem
utmMedium	string | null	UTM medium da campanha de origem
utmCampaign	string | null	UTM campaign da campanha de origem
afiliadoId	string | null	ID do afiliado responsável pela venda, se houver
afiliadoEmail	string | null	E-mail do afiliado, se houver
comissaoAfiliado	number | null	Valor da comissão do afiliado, se houver
Exemplo completo de payload
{   "evento": "VENDA_PAGA",   "timestamp": "2026-07-10T14:32:00.000Z",   "data": {     "vendaId": "cmxyz12340001",     "produtoNome": "Curso Avançado de Marketing",     "produtoId": "cmabc98760002",     "nomePlano": "Plano Único",     "valor": 297.00,     "valorProduto": 247.00,     "valorOrderBumps": 50.00,     "orderBumps": [{ "nome": "Garantia estendida", "valor": 50.00 }],     "valorLiquido": 271.15,     "compradorNome": "Maria Souza",     "compradorEmail": "maria@email.com",     "compradorCpf": "12345678900",     "compradorTel": "11999998888",     "metodoPagamento": "PIX",     "status": "PAGO",     "createdAt": "2026-07-10T14:30:00.000Z",     "utmSource": "facebook",     "utmMedium": "cpc",     "utmCampaign": "campanha-julho",     "afiliadoId": null,     "afiliadoEmail": null,     "comissaoAfiliado": null   } }
Resposta esperada e comportamento
●	Responda com qualquer status HTTP 2xx para indicar recebimento bem-sucedido.
●	O tempo limite de espera pela sua resposta é de 10 segundos.
●	Atualmente não há reenvio automático em caso de falha — cada tentativa é registrada em log (sucesso, código HTTP e resposta), visível no painel em Ferramentas → Webhooks. Recomendamos que seu endpoint seja tolerante e processe rapidamente, retornando 200 assim que enfileirar o processamento internamente.
Postbacks (alternativa simples)
Para integrações que não suportam receber JSON via POST, é possível configurar um Postback: uma URL com variáveis que são substituídas automaticamente e disparadas via requisição HTTP (método configurável, tipicamente GET).
Variáveis disponíveis
{vendaId} {produtoNome} {produtoId} {nomePlano} {valor} {valorProduto} {valorOrderBumps} {valorLiquido} {compradorNome} {compradorEmail} {compradorCpf} {compradorTel} {metodoPagamento} {status} {utmSource} {utmMedium} {utmCampaign} {afiliadoId} {afiliadoEmail} {comissaoAfiliado} {timestamp}
Exemplo de URL de postback configurada:
https://exemplo-parceiro.com/api/conversao?email={compradorEmail}&valor={valor}&status={status}
Nomes e e-mails são automaticamente URL-encoded. CPF e telefone chegam apenas com números (sem máscara).
Como configurar
●	Acesse o painel da Finora → Dashboard → Ferramentas.
●	Escolha entre Webhook (POST + JSON, recomendado) ou Postback (GET + variáveis na URL).
●	Informe a URL do seu endpoint e selecione quais eventos deseja receber (VENDA_PENDENTE, VENDA_PAGA).
●	Para Webhooks, defina um "secret" — ele será usado para assinar cada requisição (X-Finora-Signature).
●	Salve e realize uma venda de teste para validar o recebimento no seu endpoint.
Suporte
Em caso de dúvidas técnicas sobre esta integração, entre em contato através do painel da Finora Payments ou pelo e-mail de suporte da plataforma.
