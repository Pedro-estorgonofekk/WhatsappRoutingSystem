import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { AttendantStatus } from '@prisma/client';
import { PrismaService } from '../../infrastructure/database/prisma/prisma.service';
import { RoutingService } from '../routing/routing.service';

@Controller('attendants')
export class AttendantsController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly routingService: RoutingService,
  ) {}

  @Get()
  list(@Query('tenantId') tenantId: string) {
    return this.prisma.attendant.findMany({
      where: tenantId ? { tenantId } : undefined,
      include: { _count: { select: { conversations: { where: { status: 'OPEN' } } } } },
      orderBy: { createdAt: 'asc' },
    });
  }

  @Post()
  async create(
    @Body()
    body: { name: string; email: string; tenantId: string; departmentId?: string },
  ) {
    const attendant = await this.prisma.attendant.create({ data: body });
    if (attendant.status === AttendantStatus.ONLINE && attendant.departmentId) {
      await this.routingService.assignWaitingConversations(attendant.departmentId);
    }
    return attendant;
  }

  @Patch(':id/status')
  async setStatus(@Param('id') id: string, @Body('status') status: AttendantStatus) {
    const attendant = await this.prisma.attendant.update({ where: { id }, data: { status } });
    if (status === AttendantStatus.ONLINE && attendant.departmentId) {
      await this.routingService.assignWaitingConversations(attendant.departmentId);
    }
    return attendant;
  }

  @Get(':id/conversations')
  conversations(@Param('id') id: string) {
    return this.prisma.conversation.findMany({
      where: { attendantId: id, status: 'OPEN' },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
      orderBy: { updatedAt: 'desc' },
    });
  }
}
