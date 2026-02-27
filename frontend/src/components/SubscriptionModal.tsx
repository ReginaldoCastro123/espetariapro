import React, { useState } from 'react';
import { X, CreditCard, Smartphone, Check, Copy } from 'lucide-react';

export default function SubscriptionModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [step, setStep] = useState<'confirm' | 'method' | 'details' | 'success'>('confirm');
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-dark-900 border border-dark-700 p-6 rounded-2xl w-full max-w-md shadow-2xl relative">
        <button onClick={onClose} className="absolute right-4 top-4 text-gray-400 hover:text-white"><X size={20} /></button>

        {/* STEP 1: Confirmar Upgrade */}
        {step === 'confirm' && (
          <div className="text-center">
            <div className="w-16 h-16 bg-fire-500/10 text-fire-500 rounded-full flex items-center justify-center mx-auto mb-4">🔥</div>
            <h2 className="text-xl font-bold text-white mb-2">Plano Enterprise</h2>
            <p className="text-3xl font-bold text-fire-500 mb-6">R$ 39,90<span className="text-sm text-gray-400">/mês</span></p>
            <button onClick={() => setStep('method')} className="w-full bg-fire-500 hover:bg-fire-600 text-white py-3 rounded-lg font-semibold">
              Confirmar Upgrade
            </button>
          </div>
        )}

        {/* STEP 2: Forma de Pagamento */}
        {step === 'method' && (
          <div>
            <h2 className="text-lg font-bold text-white mb-4">Forma de Pagamento</h2>
            <div onClick={() => setStep('details')} className="border border-dark-700 p-4 rounded-xl flex items-center gap-4 cursor-pointer hover:border-fire-500 transition">
              <div className="p-2 bg-green-500/10 text-green-500 rounded-lg"><Smartphone size={24} /></div>
              <div><p className="font-semibold text-white">PIX</p><p className="text-xs text-gray-400">Pagamento instantâneo - 5% OFF</p></div>
            </div>
            <div className="border border-dark-700 p-4 rounded-xl flex items-center gap-4 opacity-50 mt-3">
              <div className="p-2 bg-gray-700 text-gray-400 rounded-lg"><CreditCard size={24} /></div>
              <div><p className="font-semibold text-white">Cartão de Crédito</p><p className="text-xs text-gray-400">Em breve</p></div>
            </div>
          </div>
        )}

        {/* STEP 3: Dados do Assinante */}
        {step === 'details' && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-white">Dados do Assinante</h2>
            <input placeholder="Nome completo" className="w-full bg-dark-800 border-dark-700 rounded-lg p-3 text-white" />
            <input placeholder="(00) 00000-0000" className="w-full bg-dark-800 border-dark-700 rounded-lg p-3 text-white" />
            <input placeholder="000.000.000-00" className="w-full bg-dark-800 border-dark-700 rounded-lg p-3 text-white" />
            <button onClick={() => setStep('success')} className="w-full bg-fire-500 text-white py-3 rounded-lg font-semibold">
              Gerar QR Code PIX
            </button>
          </div>
        )}

        {/* STEP 4: Pix Gerado */}
        {step === 'success' && (
          <div className="text-center">
            <h2 className="text-lg font-bold text-white mb-4">Pedido Gerado com Sucesso!</h2>
            <div className="bg-white p-2 rounded-lg inline-block mb-4">
              <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=ExemploPix" alt="QR Code" />
            </div>
            <div className="flex gap-2 bg-dark-800 p-2 rounded-lg text-xs text-gray-400 mb-4 overflow-hidden">
              <span className="truncate">00020126580014br.gov.bcb.pix...</span>
              <button><Copy size={16} /></button>
            </div>
            <button onClick={onClose} className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold">
              Concluí o pagamento
            </button>
          </div>
        )}
      </div>
    </div>
  );
}