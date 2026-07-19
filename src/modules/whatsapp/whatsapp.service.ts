import { Injectable } from '@nestjs/common';

@Injectable()
export class WhatsappService {
  handleIncomingMessage(payload: any) {

    try {
      //Vê se é do whatszap
      if (payload.object === "whatsapp_business_account") {
        const entry = payload.entry?.[0];
        const changes = entry?.changes?.[0];
        const value = changes?.value;
        const message = value?.messages?.[0];
        const contact = value?.contacts?.[0];

        //Vê se foi uma mensagem
        if (message) {
          console.log("Mensagem:");
          console.log(`De: ${contact?.profile?.name} (${message.from})`);
          console.log(`Tipo: ${message.type}`);
          console.log(`Texto: ${message.text?.body}\n`);
        }
      }
    } catch (error) {
      console.error("Erro ao processar webhook da Meta:", error);
    }
  }
}