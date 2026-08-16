import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma/prisma.service';

@Controller('departments')
export class DepartmentsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  list(@Query('tenantId') tenantId: string) {
    return this.prisma.department.findMany({
      where: { tenantId },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
  }

  @Post()
  create(@Body() body: { name: string; tenantId: string; sortOrder?: number }) {
    return this.prisma.department.create({ data: body });
  }
}
