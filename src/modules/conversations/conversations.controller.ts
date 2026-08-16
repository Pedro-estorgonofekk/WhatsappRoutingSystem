import { Controller, Param, Patch } from '@nestjs/common';
import { RoutingService } from '../routing/routing.service';

@Controller('conversations')
export class ConversationsController {
  constructor(private readonly routingService: RoutingService) {}

  @Patch(':id/close')
  close(@Param('id') id: string) {
    return this.routingService.closeConversation(id);
  }
}