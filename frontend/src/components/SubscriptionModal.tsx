import React, { useState } from 'react';
import { X, Smartphone, CreditCard, Copy } from 'lucide-react';
import { subscriptionService } from '../services/subscriptions';

export default function SubscriptionModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [step, setStep] = useState<'confirm' | 'method' | 'details' | 'success'>('confirm');
  const [loading, setLoading] = useState(false);
  const [pixData, setPixData] = useState<{ pixCode: string; qrCodeBase64: string } | null>(null);
  const [formData, setFormData] = useState({ name: '', whatsapp: '', document: '' });

  if (!isOpen) return null;

  // --- FUNÇÕES DE MÁSCARA (FORMATAÇÃO AUTOMÁTICA) ---
  const formatPhone = (value: string) => {
    let v = value.replace(/\D/g, ''); // Remove tudo que não é número
    if (v.length <= 10) {
      v = v.replace(/^(\d{2})(\d)/g, '($1) $2');
      v = v.replace(/(\d{4})(\d)/, '$1-$2');
    } else {
      v = v.replace(/^(\d{2})(\d)/g, '($1) $2');
      v = v.replace(/(\d{5})(\d)/, '$1-$2');
    }
    return v.substring(0, 15); // Limita ao tamanho máximo de (99) 99999-9999
  };

  const formatDocument = (value: string) => {
    let v = value.replace(/\D/g, ''); // Remove tudo que não é número
    if (v.length <= 11) {
      // Máscara de CPF: 000.000.000-00
      v = v.replace(/(\d{3})(\d)/, '$1.$2');
      v = v.replace(/(\d{3})(\d)/, '$1.$2');
      v = v.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    } else {
      // Máscara de CNPJ: 00.000.000/0000-00
      v = v.replace(/^(\d{2})(\d)/, '$1.$2');
      v = v.replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3');
      v = v.replace(/\.(\d{3})(\d)/, '.$1/$2');
      v = v.replace(/(\d{4})(\d)/, '$1-$2');
    }
    return v.substring(0, 18); // Limita ao tamanho máximo de CNPJ
  };

  // --- HANDLERS PARA ATUALIZAR O ESTADO COM A MÁSCARA ---
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, whatsapp: formatPhone(e.target.value) });
  };

  const handleDocumentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, document: formatDocument(e.target.value) });
  };

  const handleGeneratePix = async () => {
    setLoading(true);
    try {
      // Remove a formatação antes de enviar para a API (opcional, mas recomendado)
      const cleanData = {
        ...formData,
        whatsapp: formData.whatsapp.replace(/\D/g, ''),
        document: formData.document.replace(/\D/g, '')
      };
      
      const data = await subscriptionService.createPixSubscription(cleanData);
      setPixData(data);
      setStep('success');
    } catch (error) {
      alert("Erro ao gerar pagamento. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-dark-900 border border-dark-700 p-6 rounded-2xl w-full max-w-md shadow-2xl relative">
        <button onClick={onClose} className="absolute right-4 top-4 text-gray-400 hover:text-white"><X size={20} /></button>

        {/* STEP 1: Confirmar */}
        {step === 'confirm' && (
          <div className="text-center">
            <div className="w-16 h-16 bg-fire-500/10 text-fire-500 rounded-full flex items-center justify-center mx-auto mb-4">🔥</div>
            <h2 className="text-xl font-bold text-white mb-2">Plano Enterprise</h2>
            <p className="text-3xl font-bold text-fire-500 mb-6">R$ 39,90</p>
            <button onClick={() => setStep('method')} className="w-full bg-fire-500 text-white py-3 rounded-lg font-semibold">
              Confirmar Upgrade
            </button>
          </div>
        )}

        {/* STEP 2: Método */}
        {step === 'method' && (
          <div>
            <h2 className="text-lg font-bold text-white mb-4">Forma de Pagamento</h2>
            <div onClick={() => setStep('details')} className="border border-dark-700 p-4 rounded-xl flex items-center gap-4 cursor-pointer hover:border-fire-500 transition">
              <div className="p-2 bg-green-500/10 text-green-500 rounded-lg"><Smartphone size={24} /></div>
              <div><p className="font-semibold text-white">PIX</p></div>
            </div>
          </div>
        )}

        {/* STEP 3: Dados */}
        {step === 'details' && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-white">Dados do Assinante</h2>
            
            <input 
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})} 
              placeholder="Nome completo" 
              className="w-full bg-dark-800 border-dark-700 rounded-lg p-3 text-white focus:outline-none focus:border-fire-500 transition-colors" 
            />
            
            <input 
              value={formData.whatsapp}
              onChange={handlePhoneChange} 
              placeholder="WhatsApp (ex: (11) 99999-9999)" 
              maxLength={15}
              className="w-full bg-dark-800 border-dark-700 rounded-lg p-3 text-white focus:outline-none focus:border-fire-500 transition-colors" 
            />
            
            <input 
              value={formData.document}
              onChange={handleDocumentChange} 
              placeholder="CPF ou CNPJ" 
              maxLength={18}
              className="w-full bg-dark-800 border-dark-700 rounded-lg p-3 text-white focus:outline-none focus:border-fire-500 transition-colors" 
            />
            
            <button onClick={handleGeneratePix} disabled={loading || !formData.name || !formData.whatsapp || !formData.document} className="w-full bg-fire-500 text-white py-3 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-opacity">
              {loading ? "Gerando..." : "Gerar QR Code PIX"}
            </button>
          </div>
        )}

        {/* STEP 4: Success */}
        {step === 'success' && pixData && (
          <div className="text-center">
            <h2 className="text-lg font-bold text-white mb-4">PIX Gerado!</h2>
            <img src={`data:image/jpeg;base64,${pixData.qrCodeBase64}`} className="mx-auto mb-4" alt="QR Code" />
            <div className="bg-dark-800 p-3 rounded-lg text-xs text-gray-300 break-all mb-4">
              {pixData.pixCode}
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