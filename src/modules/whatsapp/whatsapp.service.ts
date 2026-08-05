import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class WhatsappService {
  private readonly logger = new Logger(WhatsappService.name);

  constructor(private readonly httpService: HttpService) {}

  // Envia mensagem de volta para a Meta
  async sendMessage(to: string, text: string) {
    const phoneNumberId = process.env.NUMBER_ID;
    const token = process.env.META_API_TOKEN;

    const url = `https://graph.facebook.com/v20.0/${phoneNumberId}/messages`;

    const body = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: to,
      type: 'text',
      text: { body: text },
    };

    const headers = {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };

    try {
      const response = await lastValueFrom(
        this.httpService.post(url, body, { headers }),
      );
      this.logger.log(`Mensagem enviada com sucesso para ${to}`);
      return response.data;
    } catch (error: any) {
      this.logger.error(
        'Erro ao enviar mensagem:',
        error?.response?.data || error?.message,
      );
    }
  }

  // Processa a mensagem recebida pelo Webhook
  async handleWebhookPayload(payload: any) {
    const entry = payload?.entry?.[0];
    const change = entry?.changes?.[0]?.value;
    const message = change?.messages?.[0];

    // Verifica se é uma mensagem de texto recebida
    if (message && message.type === 'text') {
      const from = message.from; // Número do remetente
      const textReceived = message.text?.body; // Texto que a pessoa enviou

      this.logger.log(`Mensagem recebida de [${from}]: "${textReceived}"`);

      // Responde automaticamente pro celular do usuário
      const responseText = `Alerta de possivel resenha, mensagem recebida: "${textReceived}"`;
      await this.sendMessage(from, responseText);
    }
  }
}