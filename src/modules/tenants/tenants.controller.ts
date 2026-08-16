import { Body, Controller, Get, Post } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma/prisma.service';

@Controller('tenants')
export class TenantsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  list() {
    return this.prisma.tenant.findMany({ orderBy: { createdAt: 'asc' } });
  }

  @Post()
  create(@Body('name') name: string) {
    return this.prisma.tenant.create({ data: { name } })
  }
}
