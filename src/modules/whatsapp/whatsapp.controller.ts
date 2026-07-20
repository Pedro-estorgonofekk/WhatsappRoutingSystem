import { Controller, Get, Post, Body, Query, Res, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { WhatsappService } from './whatsapp.service';

@Controller('whatsapp')
export class WhatsappController {
  constructor(private readonly whatsappService: WhatsappService) {}

  //Rota pra validar o hook com a meta
  @Get('webhook')
  verifyWebhook(@Query() query: any, @Res() res: Response) {
    const mode = query["hub.mode"];
    const token = query["hub.verify_token"];
    const challenge = query["hub.challenge"];

    const verifyToken = process.env.TOKEN; 

    if (mode && token === verifyToken) {
      console.log("Deu boa");
      //Retornar o codigo de verificação
      return res.status(HttpStatus.OK).send(challenge);
    }
    
    return res.status(HttpStatus.FORBIDDEN).send("Token invalido");
  }

  //Rota pra receber as mensagens
  @Post("webhook")
  receiveMessage(@Body() payload: any, @Res() res: Response) {
    this.whatsappService.handleIncomingMessage(payload);
    //Responder com 200 apenas
    return res.status(HttpStatus.OK).send("EVENT_RECEIVED");
  }
}