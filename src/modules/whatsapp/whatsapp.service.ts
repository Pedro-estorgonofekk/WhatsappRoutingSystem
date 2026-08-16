import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import { RoutingService } from '../routing/routing.service';

@Injectable()
export class WhatsappService {
  private readonly logger = new Logger(WhatsappService.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly routingService: RoutingService,
  ) {}

  async sendMessage(to: string, text: string) {
    const phoneNumberId =
      process.env.META_PHONE_NUMBER_ID ?? process.env.NUMBER_ID;
    const token = process.env.META_API_TOKEN;
    const url = `https://graph.facebook.com/v20.0/${phoneNumberId}/messages`;

    try {
      const response = await lastValueFrom(
        this.httpService.post(
          url,
          {
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to,
            type: 'text',
            text: { body: text },
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          },
        ),
      );
      this.logger.log(`Message sent to ${to}`);
      return response.data;
    } catch (error: any) {
      this.logger.error(
        'Failed to send WhatsApp message:',
        error?.response?.data || error?.message,
      );
    }
  }

  async handleWebhookPayload(payload: any) {
    const message = payload?.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
    if (!message || message.type !== 'text') return;

    const tenantId = process.env.DEFAULT_TENANT_ID;
    if (!tenantId) {
      this.logger.error('DEFAULT_TENANT_ID is required to route inbound messages.');
      return;
    }

    const customerPhone = message.from;
    const body = message.text?.body;
    this.logger.log(`Inbound message from ${customerPhone}`);

    const result = await this.routingService.routeInboundMessage({
      tenantId,
      customerPhone,
      body,
      externalId: message.id,
    });

    if (result.reply) {
      await this.sendMessage(customerPhone, result.reply);
      await this.routingService.recordAutomaticReply(result.conversation.id, result.reply);
    }
  }
}
