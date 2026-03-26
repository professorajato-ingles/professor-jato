'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Shield, FileText, AlertTriangle, CheckCircle, Scale, Users, Lock } from 'lucide-react';
import { Star, Instagram, Youtube, Linkedin } from 'lucide-react';
import { Navbar } from '@/components/Navbar';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-4 pt-28 pb-12">
        <Link href="/" className="inline-flex items-center gap-2 text-emerald-600 hover:text-emerald-700 mb-8">
          <ArrowLeft className="w-4 h-4" />
          Voltar para Home
        </Link>

        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8 md:p-12">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center">
              <Scale className="w-7 h-7 text-emerald-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Termos de Uso</h1>
              <p className="text-slate-500">Última atualização: {new Date().toLocaleDateString('pt-BR')}</p>
            </div>
          </div>

          <div className="space-y-8">
            <section>
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2 mb-4">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
                1. Aceitação dos Termos
              </h2>
              <p className="text-slate-600 leading-relaxed">
                Ao acessar e utilizar o Professor Jato (&quot;Serviço&quot;), você concorda em cumprir estes Termos de Uso. 
                Se você não concorda com qualquer parte destes termos, não utilize nosso Serviço.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2 mb-4">
                <Users className="w-5 h-5 text-emerald-600" />
                2. Descrição do Serviço
              </h2>
              <p className="text-slate-600 leading-relaxed">
                O Professor Jato é uma plataforma de aprendizado de inglês assistida por inteligência artificial. 
                Fornecemos lições interativas, tutoria por IA e ferramentas de prática de idiomas.
              </p>
              <div className="bg-slate-50 rounded-xl p-4 mt-4">
                <p className="text-sm text-slate-500">
                  <strong>Importante:</strong> O Serviço utiliza inteligência artificial para correção e feedback. 
                  Nos esforçamos para fornecer feedbacks precisos, mas não garantimos que todas as correções sejam 
                  perfeitas ou completas.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2 mb-4">
                <FileText className="w-5 h-5 text-emerald-600" />
                3. Conta do Usuário
              </h2>
              <p className="text-slate-600 leading-relaxed mb-4">
                Para acessar certas funcionalidades, você deve criar uma conta. Você é responsável por:
              </p>
              <ul className="list-disc list-inside text-slate-600 space-y-2">
                <li>Manter a confidencialidade de suas credenciais de acesso</li>
                <li>Todas as atividades que ocorrem sob sua conta</li>
                <li>Notificar-nos imediatamente sobre qualquer uso não autorizado</li>
                <li>Fornecer informações verdadeiras e atualizadas</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2 mb-4">
                <Shield className="w-5 h-5 text-emerald-600" />
                4. Uso Aceitável
              </h2>
              <p className="text-slate-600 leading-relaxed mb-4">
                Você concorda em <strong>não</strong> utilizar o Serviço para:
              </p>
              <ul className="list-disc list-inside text-slate-600 space-y-2">
                <li>Qualquer finalidade ilegal ou não autorizada</li>
                <li>Gerar conteúdo ofensivo, discriminatório ou prejudicial</li>
                <li>Tentar acessar contas de outros usuários</li>
                <li>Realizar engenharia reversa ou copiar nossa tecnologia</li>
                <li>Automatizar acesso excessivo que sobrecarregue nossos servidores</li>
                <li>Usar bots, scripts ou métodos automatizados sem autorização</li>
                <li>Compartilhar sua conta com terceiros</li>
                <li>Revender ou redistribuir nosso conteúdo</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2 mb-4">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                5. Conduta Proibida e Consequências
              </h2>
              <p className="text-slate-600 leading-relaxed mb-4">
                O seguinte comportamento resultará em <strong>rescisão imediata</strong> da sua conta:
              </p>
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-2">
                <p className="text-red-800 font-medium">Violações Graves:</p>
                <ul className="list-disc list-inside text-red-700 space-y-1 text-sm">
                  <li>Uso para gerar conteúdo ilegal, malicioso ou fraudulento</li>
                  <li>Assédio, ameaças ou intimidação de outros usuários</li>
                  <li>Tentativas de hack ou acesso não autorizado</li>
                  <li>Spam ou uso comercial não autorizado</li>
                  <li>Violação de propriedade intelectual de terceiros</li>
                </ul>
              </div>
              <p className="text-slate-600 leading-relaxed mt-4">
                Reservamo-nos o direito de suspender ou encerrar contas sem aviso prévio em casos de violação.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2 mb-4">
                <Lock className="w-5 h-5 text-emerald-600" />
                6. Propriedade Intelectual
              </h2>
              <p className="text-slate-600 leading-relaxed">
                Todo o conteúdo, design, logos e tecnologia do Professor Jato são propriedade nossa ou dos nossos licenciadores. 
                Você mantém propriedade do conteúdo que cria, mas nos concede licença para utilizá-lo na prestação do Serviço.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2 mb-4">
                <FileText className="w-5 h-5 text-emerald-600" />
                7. Planos e Pagamentos
              </h2>
              <ul className="list-disc list-inside text-slate-600 space-y-2">
                <li>Os preços podem ser alterados com aviso prévio de 30 dias</li>
                <li>Planos são cobrados mensalmente de forma recorrente</li>
                <li>Cancelamentos podem ser feitos a qualquer momento</li>
                <li>Reembolso disponível em até 7 dias após contratação</li>
                <li>O acesso ao plano pago é revogado em caso de inadimplência</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2 mb-4">
                <Shield className="w-5 h-5 text-emerald-600" />
                8. Limitação de Responsabilidade
              </h2>
              <p className="text-slate-600 leading-relaxed">
                O Serviço é fornecido &quot;como está&quot;. Não garantimos que o Serviço será ininterrupto, seguro ou livre de erros. 
                Não somos responsáveis por quaisquer danos indiretos, incidentais, especiais ou consequenciais.
              </p>
              <div className="bg-slate-50 rounded-xl p-4 mt-4">
                <p className="text-sm text-slate-600">
                  <strong>Importante:</strong> Resultados de aprendizado variam de pessoa para pessoa. 
                  O Serviço é uma ferramenta de apoio, não substituindo orientação profissional.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2 mb-4">
                <Shield className="w-5 h-5 text-emerald-600" />
                9. Privacidade
              </h2>
              <p className="text-slate-600 leading-relaxed">
                Sua privacidade é importante para nós. Coletamos e processamos seus dados conforme descrito em nossa 
                <Link href="/privacidade" className="text-emerald-600 hover:underline ml-1">
                  Política de Privacidade
                </Link>.
                Ao usar nosso Serviço, você concorda com a coleta e uso de dados conforme descrito.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2 mb-4">
                <FileText className="w-5 h-5 text-emerald-600" />
                10. Modificações dos Termos
              </h2>
              <p className="text-slate-600 leading-relaxed">
                Podemos modificar estes termos periodicamente. Notificaremos sobre mudanças significativas via email 
                ou aviso no Serviço. Seu uso continuado após as mudanças constitui aceitação dos novos termos.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2 mb-4">
                <Scale className="w-5 h-5 text-emerald-600" />
                11. Lei Aplicável
              </h2>
              <p className="text-slate-600 leading-relaxed">
                Estes termos são regidos pela legislação brasileira. Qualquer disputa será resolvida 
                nos tribunais competentes do Brasil.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2 mb-4">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                12. Contato
              </h2>
              <p className="text-slate-600 leading-relaxed">
                Para dúvidas sobre estes termos, entre em contato:
              </p>
              <div className="bg-slate-50 rounded-xl p-4 mt-4">
                <p className="text-slate-700 font-medium">Professor Jato</p>
                <p className="text-slate-600 text-sm">contato@professorajato.com.br</p>
              </div>
            </section>
          </div>
        </div>
      </div>

      <footer className="bg-slate-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="bg-emerald-500 p-2 rounded-xl">
                  <Star className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold tracking-tight">
                  Professor <span className="text-emerald-400">Jato</span>
                </span>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed">
                Democratizando o ensino de inglês de alta qualidade para brasileiros.
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-4">Legal</h4>
              <ul className="space-y-2 text-slate-400 text-sm">
                <li><Link href="/privacidade" className="hover:text-emerald-400 transition-colors">Política de Privacidade</Link></li>
                <li><Link href="/termos" className="hover:text-emerald-400 transition-colors">Termos de Uso</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Redes Sociais</h4>
              <div className="flex gap-4">
                <a href="#" className="text-slate-400 hover:text-white transition-colors"><Instagram className="w-5 h-5" /></a>
                <a href="#" className="text-slate-400 hover:text-white transition-colors"><Youtube className="w-5 h-5" /></a>
                <a href="#" className="text-slate-400 hover:text-white transition-colors"><Linkedin className="w-5 h-5" /></a>
              </div>
            </div>
          </div>
          <div className="pt-8 border-t border-slate-800 text-center text-slate-500 text-sm">
            <p>© {new Date().getFullYear()} Professor Jato. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
