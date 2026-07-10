'use client';

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold text-purple-600">Finora Payments</h1>
          <p className="text-gray-600 mt-1">Documentacao de Integracao - Webhooks e Postbacks</p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-10 space-y-10">

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">Visao geral</h2>
          <p className="text-gray-700 leading-relaxed">
            A Finora Payments notifica sistemas externos em tempo real atraves de <strong>Webhooks</strong> (requisicao HTTP POST com corpo JSON)
            ou <strong>Postbacks</strong> (requisicao HTTP GET com variaveis substituidas na propria URL). Ambos sao configurados pelo vendedor
            no painel, em <strong>Dashboard -&gt; Ferramentas</strong>.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">Eventos disponiveis</h2>
          <ul className="list-disc list-inside text-gray-700 space-y-1">
            <li><code className="bg-gray-100 px-1.5 py-0.5 rounded text-sm">VENDA_PENDENTE</code> - venda criada, aguardando confirmacao de pagamento</li>
            <li><code className="bg-gray-100 px-1.5 py-0.5 rounded text-sm">VENDA_PAGA</code> - pagamento confirmado</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">Webhooks (recomendado)</h2>
          <p className="text-gray-700 mb-3">Requisicao HTTP POST com corpo JSON e assinatura HMAC no header:</p>
          <pre className="bg-gray-900 text-gray-100 text-sm rounded-lg p-4 overflow-x-auto">
{`POST {sua_url_configurada}
Content-Type: application/json
X-Finora-Signature: sha256={assinatura_hmac}`}
          </pre>

          <h3 className="font-semibold text-gray-900 mt-6 mb-2">Verificacao de assinatura</h3>
          <p className="text-gray-700 mb-3">
            Calcule o HMAC-SHA256 do corpo bruto da requisicao usando o <em>secret</em> configurado para aquele webhook, e compare com o header <code className="bg-gray-100 px-1.5 py-0.5 rounded text-sm">X-Finora-Signature</code>.
          </p>
          <pre className="bg-gray-900 text-gray-100 text-sm rounded-lg p-4 overflow-x-auto">
{`const crypto = require("crypto");

function verificarAssinatura(payloadBruto, assinaturaRecebida, secret) {
  const esperada = crypto
    .createHmac("sha256", secret)
    .update(payloadBruto)
    .digest("hex");

  const recebida = assinaturaRecebida.replace("sha256=", "");
  return esperada === recebida;
}`}
          </pre>
          <p className="text-sm text-gray-500 mt-2">
            Calcule o HMAC sobre o corpo bruto (raw body), antes do parse de JSON.
          </p>

          <h3 className="font-semibold text-gray-900 mt-6 mb-2">Estrutura do payload</h3>
          <pre className="bg-gray-900 text-gray-100 text-sm rounded-lg p-4 overflow-x-auto">
{`{
  "evento": "VENDA_PAGA",
  "timestamp": "2026-07-10T14:32:00.000Z",
  "data": { ... }
}`}
          </pre>

          <div className="overflow-x-auto mt-4">
            <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
              <thead className="bg-purple-600 text-white">
                <tr>
                  <th className="text-left py-2 px-3">Campo</th>
                  <th className="text-left py-2 px-3">Tipo</th>
                  <th className="text-left py-2 px-3">Descricao</th>
                </tr>
              </thead>
              <tbody className="text-gray-700">
                {[
                  ['vendaId', 'string', 'ID unico da venda na Finora'],
                  ['produtoNome', 'string', 'Nome do produto vendido'],
                  ['produtoId', 'string', 'ID unico do produto'],
                  ['nomePlano', 'string | null', 'Nome do plano/oferta especifico, se houver'],
                  ['valor', 'number', 'Valor total da venda (produto + order bumps)'],
                  ['valorProduto', 'number', 'Valor do produto, sem order bumps'],
                  ['valorOrderBumps', 'number', 'Soma dos order bumps adicionados'],
                  ['orderBumps', 'array', 'Lista de order bumps: [{ nome, valor }]'],
                  ['valorLiquido', 'number', 'Valor liquido apos taxas (apenas em VENDA_PAGA)'],
                  ['compradorNome', 'string', 'Nome completo do comprador'],
                  ['compradorEmail', 'string', 'E-mail do comprador'],
                  ['compradorCpf', 'string', 'CPF do comprador (somente numeros)'],
                  ['compradorTel', 'string', 'Telefone do comprador (somente numeros)'],
                  ['metodoPagamento', 'string', 'PIX, CARTAO ou BOLETO'],
                  ['status', 'string', 'PENDENTE ou PAGO'],
                  ['createdAt', 'string (ISO 8601)', 'Data/hora de criacao da venda'],
                  ['utmSource', 'string | null', 'UTM source da campanha'],
                  ['utmMedium', 'string | null', 'UTM medium da campanha'],
                  ['utmCampaign', 'string | null', 'UTM campaign da campanha'],
                  ['afiliadoId', 'string | null', 'ID do afiliado, se houver'],
                  ['afiliadoEmail', 'string | null', 'E-mail do afiliado, se houver'],
                  ['comissaoAfiliado', 'number | null', 'Comissao do afiliado, se houver'],
                ].map((row, i) => (
                  <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="py-2 px-3 font-mono text-xs">{row[0]}</td>
                    <td className="py-2 px-3">{row[1]}</td>
                    <td className="py-2 px-3">{row[2]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h3 className="font-semibold text-gray-900 mt-6 mb-2">Exemplo completo</h3>
          <pre className="bg-gray-900 text-gray-100 text-sm rounded-lg p-4 overflow-x-auto">
{`{
  "evento": "VENDA_PAGA",
  "timestamp": "2026-07-10T14:32:00.000Z",
  "data": {
    "vendaId": "cmxyz12340001",
    "produtoNome": "Curso Avancado de Marketing",
    "produtoId": "cmabc98760002",
    "nomePlano": "Plano Unico",
    "valor": 297.00,
    "valorProduto": 247.00,
    "valorOrderBumps": 50.00,
    "orderBumps": [{ "nome": "Garantia estendida", "valor": 50.00 }],
    "valorLiquido": 271.15,
    "compradorNome": "Maria Souza",
    "compradorEmail": "maria@email.com",
    "compradorCpf": "12345678900",
    "compradorTel": "11999998888",
    "metodoPagamento": "PIX",
    "status": "PAGO",
    "createdAt": "2026-07-10T14:30:00.000Z",
    "utmSource": "facebook",
    "utmMedium": "cpc",
    "utmCampaign": "campanha-julho",
    "afiliadoId": null,
    "afiliadoEmail": null,
    "comissaoAfiliado": null
  }
}`}
          </pre>

          <h3 className="font-semibold text-gray-900 mt-6 mb-2">Resposta esperada</h3>
          <ul className="list-disc list-inside text-gray-700 space-y-1">
            <li>Responda com status HTTP <strong>2xx</strong> para confirmar recebimento.</li>
            <li>Tempo limite de espera pela sua resposta: <strong>10 segundos</strong>.</li>
            <li>Nao ha reenvio automatico em caso de falha - cada tentativa e registrada em log (sucesso, codigo HTTP e resposta), visivel em <strong>Ferramentas -&gt; Webhooks</strong>.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">Postbacks (alternativa simples)</h2>
          <p className="text-gray-700 mb-3">
            Para integracoes que nao recebem JSON via POST, configure uma URL com variaveis substituidas automaticamente:
          </p>
          <pre className="bg-gray-900 text-gray-100 text-sm rounded-lg p-4 overflow-x-auto">
{`{vendaId} {produtoNome} {produtoId} {nomePlano}
{valor} {valorProduto} {valorOrderBumps} {valorLiquido}
{compradorNome} {compradorEmail} {compradorCpf} {compradorTel}
{metodoPagamento} {status}
{utmSource} {utmMedium} {utmCampaign}
{afiliadoId} {afiliadoEmail} {comissaoAfiliado}
{timestamp}`}
          </pre>
          <p className="text-gray-700 mt-3">Exemplo de URL configurada:</p>
          <pre className="bg-gray-900 text-gray-100 text-sm rounded-lg p-4 overflow-x-auto">
{`https://exemplo-parceiro.com/api/conversao?email={compradorEmail}&valor={valor}&status={status}`}
          </pre>
          <p className="text-sm text-gray-500 mt-2">Nomes e e-mails sao automaticamente URL-encoded. CPF e telefone chegam sem mascara.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">Como configurar</h2>
          <ol className="list-decimal list-inside text-gray-700 space-y-1">
            <li>Acesse o painel da Finora -&gt; <strong>Dashboard -&gt; Ferramentas</strong>.</li>
            <li>Escolha entre Webhook (POST + JSON, recomendado) ou Postback (GET + variaveis na URL).</li>
            <li>Informe a URL do seu endpoint e selecione os eventos desejados.</li>
            <li>Para Webhooks, defina um <em>secret</em> - usado para assinar cada requisicao.</li>
            <li>Salve e realize uma venda de teste para validar o recebimento.</li>
          </ol>
        </section>

        <section className="pb-10">
          <h2 className="text-xl font-bold text-gray-900 mb-3">Suporte</h2>
          <p className="text-gray-700">
            Em caso de duvidas tecnicas sobre esta integracao, entre em contato atraves do painel da Finora Payments ou pelo e-mail de suporte da plataforma.
          </p>
        </section>

      </main>
    </div>
  );
}