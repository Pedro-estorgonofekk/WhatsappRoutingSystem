import { Controller, Get, Post, Body, Query, Res, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { WhatsappService } from './whatsapp.service';

@Controller('whatsapp')
export class WhatsappController {
  constructor(private readonly whatsappService: WhatsappService) {}

  // Rota pra validar o hook com a Meta
  @Get('webhook')
  verifyWebhook(@Query() query: any, @Res() res: Response) {
    const mode = query["hub.mode"];
    const token = query["hub.verify_token"];
    const challenge = query["hub.challenge"];

    //Puxando do .env
    const verifyToken = process.env.WEBHOOK_VERIFY_TOKEN; 

    //Verificando se é subscribe e se a senha bate
    if (mode === 'subscribe' && token === verifyToken) {
      console.log("Deu boa");
      // Retornar o código de verificação
      return res.status(HttpStatus.OK).send(challenge);
    }
    
    console.log("Deu ruim")
    return res.status(HttpStatus.FORBIDDEN).send("Token invalido");
  }

  // Rota pra receber as mensagens
  @Post('webhook')
  async receiveWebhook(@Body() payload: any) {

    await this.whatsappService.handleWebhookPayload(payload);
    
    return { status: 'success' };
  }
}