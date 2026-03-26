'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Shield, Eye, Database, Lock, Mail, Cookie } from 'lucide-react';
import { Star, Instagram, Youtube, Linkedin } from 'lucide-react';
import { Navbar } from '@/components/Navbar';

export default function PrivacyPage() {
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
              <Shield className="w-7 h-7 text-emerald-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Política de Privacidade</h1>
              <p className="text-slate-500">Última atualização: {new Date().toLocaleDateString('pt-BR')}</p>
            </div>
          </div>

          <div className="space-y-8">
            <section>
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2 mb-4">
                <Eye className="w-5 h-5 text-emerald-600" />
                1. Introdução
              </h2>
              <p className="text-slate-600 leading-relaxed">
                A sua privacidade é importante para nós. Esta Política de Privacidade explica como o Professor Jato 
                coleta, usa, armazena e protege suas informações pessoais. Ao utilizar nosso Serviço, você concorda 
                com as práticas descritas nesta política.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2 mb-4">
                <Database className="w-5 h-5 text-emerald-600" />
                2. Dados que Coletamos
              </h2>
              <div className="bg-slate-50 rounded-xl p-4 space-y-3">
                <div>
                  <p className="font-medium text-slate-700">Dados de Conta:</p>
                  <p className="text-slate-600 text-sm">Nome, email, foto de perfil (via Google OAuth)</p>
                </div>
                <div>
                  <p className="font-medium text-slate-700">Dados de Uso:</p>
                  <p className="text-slate-600 text-sm">Interações no chat, módulos completados, XP acumulado, nível de aprendizado</p>
                </div>
                <div>
                  <p className="font-medium text-slate-700">Dados de Pagamento:</p>
                  <p className="text-slate-600 text-sm">Processados pelo Stripe. Não armazenamos dados de cartão.</p>
                </div>
                <div>
                  <p className="font-medium text-slate-700">Dados Técnicos:</p>
                  <p className="text-slate-600 text-sm">Endereço IP, tipo de navegador, dispositivo, timestamps</p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2 mb-4">
                <Lock className="w-5 h-5 text-emerald-600" />
                3. Como Usamos seus Dados
              </h2>
              <ul className="list-disc list-inside text-slate-600 space-y-2">
                <li>Fornecer e melhorar o Serviço de aprendizado</li>
                <li>Personalizar sua experiência de acordo com seu nível</li>
                <li>Processar pagamentos e gerenciar assinaturas</li>
                <li>Enviar comunicações sobre sua conta e atualizações</li>
                <li>Detectar e prevenir fraudes ou uso abusivo</li>
                <li>Cumprir obrigações legais</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2 mb-4">
                <Shield className="w-5 h-5 text-emerald-600" />
                4. Compartilhamento de Dados
              </h2>
              <p className="text-slate-600 leading-relaxed mb-4">
                Não vendemos seus dados pessoais. Compartilhamos apenas quando necessário:
              </p>
              <ul className="list-disc list-inside text-slate-600 space-y-2">
                <li><strong>Provedores de IA</strong>: Google Gemini, DeepSeek (para gerar respostas)</li>
                <li><strong>Processamento de Pagamento</strong>: Stripe (pagamentos)</li>
                <li><strong>Autenticação</strong>: Google Firebase (login)</li>
                <li><strong>Requisitos Legais</strong>: Quando exigido por lei</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2 mb-4">
                <Lock className="w-5 h-5 text-emerald-600" />
                5. Segurança dos Dados
              </h2>
              <p className="text-slate-600 leading-relaxed">
                Implementamos medidas de segurança técnicas e organizacionais para proteger seus dados:
              </p>
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mt-4 space-y-2">
                <p className="text-emerald-800 font-medium flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Nossas Medidas:
                </p>
                <ul className="list-disc list-inside text-emerald-700 text-sm space-y-1">
                  <li>Criptografia em trânsito (HTTPS/TLS)</li>
                  <li>Controles de acesso restritos</li>
                  <li>Monitoramento de segurança contínuo</li>
                  <li>Backups regulares e seguros</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2 mb-4">
                <Cookie className="w-5 h-5 text-emerald-600" />
                6. Cookies e Tecnologias
              </h2>
              <p className="text-slate-600 leading-relaxed">
                Utilizamos cookies essenciais para:
              </p>
              <ul className="list-disc list-inside text-slate-600 space-y-2 mt-2">
                <li>Manter sua sessão autenticada</li>
                <li>Lembrar suas preferências</li>
                <li>Analisar uso do Serviço (anonimizado)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2 mb-4">
                <Database className="w-5 h-5 text-emerald-600" />
                7. Retenção e Exclusão
              </h2>
              <ul className="list-disc list-inside text-slate-600 space-y-2">
                <li>Dados de conta: Mantidos enquanto a conta estiver ativa</li>
                <li>Dados de uso: Anonimizados após 2 anos</li>
                <li>Dados de pagamento: Mantidos por 5 anos (exigência legal)</li>
                <li>Você pode solicitar exclusão a qualquer momento</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2 mb-4">
                <Shield className="w-5 h-5 text-emerald-600" />
                8. Seus Direitos (LGPD)
              </h2>
              <p className="text-slate-600 leading-relaxed mb-4">
                Conforme a Lei Geral de Proteção de Dados (LGPD - Lei 13.709/2018), você tem direito a:
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-slate-50 rounded-xl p-4">
                  <p className="font-medium text-slate-700 mb-2">Acessar seus dados</p>
                  <p className="text-slate-600 text-sm">Solicitar cópia de todas as informações que temos sobre você</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-4">
                  <p className="font-medium text-slate-700 mb-2">Corrigir dados</p>
                  <p className="text-slate-600 text-sm">Atualizar informações incorretas ou incompletas</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-4">
                  <p className="font-medium text-slate-700 mb-2">Excluir dados</p>
                  <p className="text-slate-600 text-sm">Solicitar remoção das suas informações</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-4">
                  <p className="font-medium text-slate-700 mb-2">Exportar dados</p>
                  <p className="text-slate-600 text-sm">Receber seus dados em formato legível</p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2 mb-4">
                <Mail className="w-5 h-5 text-emerald-600" />
                9. Contato
              </h2>
              <p className="text-slate-600 leading-relaxed mb-4">
                Para exercer seus direitos ou tirar dúvidas sobre esta política:
              </p>
              <div className="bg-slate-50 rounded-xl p-4">
                <p className="text-slate-700 font-medium">Professor Jato - Encarregado de Dados (DPO)</p>
                <p className="text-slate-600 text-sm">Email: privacidade@professorajato.com.br</p>
                <p className="text-slate-600 text-sm mt-2">
                  Prazo de resposta: até 15 dias úteis
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2 mb-4">
                <Shield className="w-5 h-5 text-emerald-600" />
                10. Alterações
              </h2>
              <p className="text-slate-600 leading-relaxed">
                Esta política pode ser atualizada periodicamente. Notificaremos sobre mudanças significativas 
                via email ou aviso no Serviço. A data de &quot;última atualização&quot; no topo indica quando 
                a política foi modificada pela última vez.
              </p>
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
