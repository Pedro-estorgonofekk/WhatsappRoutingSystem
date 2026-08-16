import { Module } from '@nestjs/common';
import { RoutingModule } from '../routing/routing.module';
import { ConversationsController } from './conversations.controller';
import { WhatsappModule } from '../whatsapp/whatsapp.module';

@Module({
  imports: [RoutingModule, WhatsappModule],
  controllers: [ConversationsController],
})
export class ConversationsModule {}
