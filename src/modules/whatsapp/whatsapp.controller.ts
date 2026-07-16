import { Controller, Post, Body } from '@nestjs/common';
import { WhatsappService } from './whatsapp.service';

@Controller('whatsapp')
export class WhatsappController {
  constructor(private readonly whatsappService: WhatsappService) {}

  //http://localhost:3000/whatsapp/webhook
  @Post('webhook')
  receiveWebhook(@Body() payload: any) {
    return this.whatsappService.handleIncomingMessage(payload);
  }
}