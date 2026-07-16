import { Injectable } from '@nestjs/common';

@Injectable()
export class WhatsappService {
  handleIncomingMessage(payload: any) {
    console.log("Alerta possivel resenha");
    console.log(JSON.stringify(payload, null, 2));
    
    return {status: 'success', message: 'Message received'};
  }
}