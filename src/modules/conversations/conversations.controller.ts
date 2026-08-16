import {
  BadGatewayException,
  Body,
  Controller,
  ForbiddenException,
  NotFoundException,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ConversationStatus, MessageDirection } from '@prisma/client';
import { PrismaService } from '../../infrastructure/database/prisma/prisma.service';
import { RoutingService } from '../routing/routing.service';
import { WhatsappService } from '../whatsapp/whatsapp.service';

@Controller('conversations')
export class ConversationsController {
  constructor(
    private readonly routingService: RoutingService,
    private readonly prisma: PrismaService,
    private readonly whatsappService: WhatsappService,
  ) {}

  @Patch(':id/close')
  close(@Param('id') id: string) {
    return this.routingService.closeConversation(id);
  }

  @Post(':id/messages')
  async reply(
    @Param('id') id: string,
    @Body() body: { attendantId: string; body: string },
  ) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id },
    });
    if (!conversation) throw new NotFoundException('Conversation not found.');
    if (conversation.status !== ConversationStatus.OPEN) {
      throw new ForbiddenException('This conversation is closed.');
    }
    if (conversation.attendantId !== body.attendantId) {
      throw new ForbiddenException('This conversation is not assigned to this attendant.');
    }

    const sent = await this.whatsappService.sendMessage(
      conversation.customerPhone,
      body.body,
    );
    if (!sent) throw new BadGatewayException('WhatsApp could not send the message.');

    return this.prisma.message.create({
      data: {
        conversationId: conversation.id,
        direction: MessageDirection.OUTBOUND,
        body: body.body,
        externalId: sent.messages?.[0]?.id,
      },
    });
  }
}
