import { Module } from '@nestjs/common';
import { AttendantsController } from './attendants.controller';
import { RoutingModule } from '../routing/routing.module';

@Module({
  imports: [RoutingModule],
  controllers: [AttendantsController],
})
export class AttendantsModule {}
