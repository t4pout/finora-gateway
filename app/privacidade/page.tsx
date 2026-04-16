export default function PrivacidadePage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Política de Privacidade</h1>
        <p className="text-gray-500 mb-10">Última atualização: Abril de 2026</p>

        <div className="space-y-8 text-gray-700 leading-relaxed">
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-3">1. Informações que coletamos</h2>
            <p>A Finora Payments coleta informações fornecidas diretamente pelos usuários, como nome, email, CPF e dados de pagamento, necessários para a prestação dos serviços de gateway de pagamento e rastreamento de campanhas.</p>
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-3">2. Como usamos suas informações</h2>
            <p>Utilizamos as informações coletadas para processar pagamentos, fornecer relatórios de campanhas, enviar notificações sobre transações e melhorar nossos serviços. Não vendemos dados pessoais a terceiros.</p>
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-3">3. Integração com Meta Ads</h2>
            <p>Ao conectar sua conta do Meta Ads ao Finora UTM, coletamos tokens de acesso para importar dados de gastos de campanhas. Esses dados são usados exclusivamente para exibir métricas de desempenho dentro da plataforma. Você pode desconectar sua conta a qualquer momento.</p>
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-3">4. Armazenamento e segurança</h2>
            <p>Seus dados são armazenados em servidores seguros com criptografia. Adotamos medidas técnicas e organizacionais para proteger suas informações contra acesso não autorizado.</p>
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-3">5. Seus direitos</h2>
            <p>Você tem direito a acessar, corrigir ou solicitar a exclusão dos seus dados pessoais. Para exercer esses direitos, entre em contato pelo email finorapayments@gmail.com.</p>
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-3">6. Contato</h2>
            <p>Em caso de dúvidas sobre esta política, entre em contato: <strong>finorapayments@gmail.com</strong></p>
          </div>
        </div>
      </div>
    </div>
  );
}