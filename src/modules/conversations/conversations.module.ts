import { Module } from '@nestjs/common';
import { RoutingModule } from '../routing/routing.module';
import { ConversationsController } from './conversations.controller';

@Module({
  imports: [RoutingModule],
  controllers: [ConversationsController],
})
export class ConversationsModule {}
