import { Injectable, Logger } from '@nestjs/common';
import {
  Conversation,
  ConversationStage,
  ConversationStatus,
  MessageDirection,
} from '@prisma/client';
import { PrismaService } from '../../infrastructure/database/prisma/prisma.service';

type InboundMessage = {
  tenantId: string;
  customerPhone: string;
  body: string;
  externalId?: string;
};

export type RoutingResult = {
  conversation: Conversation;
  reply?: string;
};

@Injectable()
export class RoutingService {
  private readonly logger = new Logger(RoutingService.name);

  constructor(private readonly prisma: PrismaService) {}

  async routeInboundMessage(message: InboundMessage): Promise<RoutingResult> {
    return this.prisma.$transaction(async (tx) => {
      if (message.externalId) {
        const duplicate = await tx.message.findUnique({
          where: { externalId: message.externalId },
          include: { conversation: true },
        });
        if (duplicate) return { conversation: duplicate.conversation };
      }

      let conversation = await tx.conversation.findUnique({
        where: {
          tenantId_customerPhone: {
            tenantId: message.tenantId,
            customerPhone: message.customerPhone,
          },
        },
      });

      if (!conversation) {
        conversation = await tx.conversation.create({
          data: { tenantId: message.tenantId, customerPhone: message.customerPhone },
        });
      }

      if (conversation.status === ConversationStatus.CLOSED) {
        conversation = await tx.conversation.update({
          where: { id: conversation.id },
          data: {
            status: ConversationStatus.OPEN,
            stage: ConversationStage.MENU,
            attendantId: null,
            departmentId: null,
          },
        });
      }

      await tx.message.create({
        data: {
          conversationId: conversation.id,
          direction: MessageDirection.INBOUND,
          body: message.body,
          externalId: message.externalId,
        },
      });

      if (conversation.stage === ConversationStage.ASSIGNED) {
        return { conversation };
      }

      if (conversation.stage === ConversationStage.WAITING) {
        return {
          conversation,
          reply: 'Você continua na fila de atendimento. Aguarde um momento, por favor.',
        };
      }

      if (conversation.stage === ConversationStage.MENU) {
        const departments = await tx.department.findMany({
          where: { tenantId: message.tenantId },
          orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
        });
        const selectedIndex = this.parseChoice(message.body);
        const selected = selectedIndex ? departments[selectedIndex - 1] : undefined;

        if (!selected) {
          return { conversation, reply: this.departmentMenu(departments) };
        }

        conversation = await tx.conversation.update({
          where: { id: conversation.id },
          data: { departmentId: selected.id, stage: ConversationStage.SELECTING_ATTENDANT },
        });
        const attendants = await this.onlineAttendants(tx, selected.id);
        return {
          conversation,
          reply: this.attendantMenu(selected.name, attendants.map((attendant) => attendant.name)),
        };
      }

      const attendants = await this.onlineAttendants(tx, conversation.departmentId!);
      const choice = this.parseChoice(message.body);
      const isWaitingChoice = message.body.trim() === '0';
      let selected = choice && choice > 0 ? attendants[choice - 1] : undefined;

      if (isWaitingChoice) {
        selected = attendants[0];
        if (!selected) {
          conversation = await tx.conversation.update({
            where: { id: conversation.id },
            data: { stage: ConversationStage.WAITING },
          });
          return {
            conversation,
            reply: 'Todos os atendentes estão ocupados no momento. Você entrou na fila e será atendido assim que alguém estiver disponível.',
          };
        }
      }

      if (!selected) {
        return {
          conversation,
          reply: this.attendantMenu('this department', attendants.map((attendant) => attendant.name)),
        };
      }

      conversation = await tx.conversation.update({
        where: { id: conversation.id },
        data: { attendantId: selected.id, stage: ConversationStage.ASSIGNED },
      });
      this.logger.log(`Assigned conversation ${conversation.id} to attendant ${selected.id}`);
      return {
        conversation,
        reply: `Aguarde um momento. ${selected.name} irá lhe atender.`,
      };
    });
  }

  async recordAutomaticReply(conversationId: string, body: string) {
    return this.prisma.message.create({
      data: { conversationId, direction: MessageDirection.OUTBOUND, body },
    });
  }

  async closeConversation(id: string) {
    return this.prisma.conversation.update({
      where: { id },
      data: { status: ConversationStatus.CLOSED, attendantId: null },
    });
  }

  async assignWaitingConversations(departmentId: string) {
    return this.prisma.$transaction(async (tx) => {
      const assigned: Conversation[] = [];
      const waiting = await tx.conversation.findMany({
        where: {
          departmentId,
          status: ConversationStatus.OPEN,
          stage: ConversationStage.WAITING,
        },
        orderBy: { createdAt: 'asc' },
      });

      for (const conversation of waiting) {
        const attendants = await this.onlineAttendants(tx, departmentId);
        const selected = attendants[0];
        if (!selected) break;

        assigned.push(
          await tx.conversation.update({
            where: { id: conversation.id },
            data: { attendantId: selected.id, stage: ConversationStage.ASSIGNED },
          }),
        );
      }
      return assigned;
    });
  }

  private async onlineAttendants(tx: any, departmentId: string) {
    const attendants = await tx.attendant.findMany({
      where: { departmentId, status: 'ONLINE' },
      include: {
        _count: {
          select: { conversations: { where: { status: ConversationStatus.OPEN } } },
        },
      },
    });
    return attendants.sort(
      (a, b) =>
        a._count.conversations - b._count.conversations ||
        a.createdAt.getTime() - b.createdAt.getTime(),
    );
  }

  private parseChoice(value: string) {
    const parsed = Number.parseInt(value.trim(), 10);
    return Number.isInteger(parsed) ? parsed : undefined;
  }

  private departmentMenu(departments: { name: string }[]) {
    if (!departments.length) {
      return 'No momento não há departamentos disponíveis. Por favor, tente novamente mais tarde.';
    }
    const choices = departments.map((department, index) => `${index + 1}. ${department.name}`);
    return `Olá! Seja bem-vindo(a).\n\nDigite o número do departamento que deseja falar:\n\n${choices.join('\n')}`;
  }

  private attendantMenu(departmentName: string, attendantNames: string[]) {
    if (!attendantNames.length) {
      return `Não há atendentes online em ${departmentName}.\n\n0. Entrar na fila de atendimento`;
    }
    const choices = attendantNames.map((name, index) => `${index + 1}. ${name}`);
    return `Perfeito. Escolha um atendente de ${departmentName} ou aguarde o atendimento:\n\n${choices.join('\n')}\n\n0. Aguardar o próximo atendente disponível`;
  }
}
