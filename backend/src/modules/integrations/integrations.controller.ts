import { Request, Response } from 'express';
import { AuthRequest } from '../../middlewares/auth';

// Controller placeholder para futuras integrações
// Mercado Pago, Resend, WhatsApp API, etc.

export const getAvailableIntegrations = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Lista de integrações disponíveis (futuras)
    const integrations = [
      {
        id: 'mercado_pago',
        name: 'Mercado Pago',
        description: 'Processamento de pagamentos online',
        status: 'coming_soon',
        icon: 'credit-card',
      },
      {
        id: 'resend',
        name: 'Resend',
        description: 'Envio de e-mails transacionais',
        status: 'coming_soon',
        icon: 'mail',
      },
      {
        id: 'whatsapp',
        name: 'WhatsApp Business API',
        description: 'Envio de notificações via WhatsApp',
        status: 'coming_soon',
        icon: 'message-circle',
      },
      {
        id: 'nfe',
        name: 'Emissão de NF-e',
        description: 'Integração com emissores de nota fiscal',
        status: 'coming_soon',
        icon: 'file-text',
      },
    ];

    res.json(integrations);
  } catch (error) {
    console.error('Erro ao buscar integrações:', error);
    res.status(500).json({ error: 'Erro ao buscar integrações' });
  }
};

// Placeholder para integração com Mercado Pago
export const createMercadoPagoPreference = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // TODO: Implementar integração real com Mercado Pago
    res.status(501).json({ 
      error: 'Integração com Mercado Pago ainda não implementada',
      message: 'Esta funcionalidade estará disponível em breve.'
    });
  } catch (error) {
    console.error('Erro ao criar preferência:', error);
    res.status(500).json({ error: 'Erro ao criar preferência de pagamento' });
  }
};

// Placeholder para webhook do Mercado Pago
export const mercadoPagoWebhook = async (req: Request, res: Response): Promise<void> => {
  try {
    // TODO: Implementar webhook real
    console.log('Webhook recebido:', req.body);
    res.status(200).send('OK');
  } catch (error) {
    console.error('Erro no webhook:', error);
    res.status(500).json({ error: 'Erro ao processar webhook' });
  }
};

// Placeholder para envio de e-mail
export const sendEmail = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // TODO: Implementar integração real com Resend
    res.status(501).json({ 
      error: 'Integração com Resend ainda não implementada',
      message: 'Esta funcionalidade estará disponível em breve.'
    });
  } catch (error) {
    console.error('Erro ao enviar e-mail:', error);
    res.status(500).json({ error: 'Erro ao enviar e-mail' });
  }
};

// Placeholder para envio de WhatsApp
export const sendWhatsApp = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // TODO: Implementar integração real com WhatsApp API
    res.status(501).json({ 
      error: 'Integração com WhatsApp ainda não implementada',
      message: 'Esta funcionalidade estará disponível em breve.'
    });
  } catch (error) {
    console.error('Erro ao enviar WhatsApp:', error);
    res.status(500).json({ error: 'Erro ao enviar mensagem WhatsApp' });
  }
};
