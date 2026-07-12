import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { TenantsModule } from './tenants/tenants.module';
import { AttendantsModule } from './attendants/attendants.module';
import { ConversationsModule } from './conversations/conversations.module';
import { MessagesModule } from './messages/messages.module';
import { SessionsModule } from './sessions/sessions.module';
import { RoutingModule } from './routing/routing.module';
import { WhatsappModule } from './whatsapp/whatsapp.module';
import { NotificationsModule } from './notifications/notifications.module';
import { HealthModule } from './health/health.module';
import { PrismaModule } from './infrastructure/database/prisma/prisma.module';
import { RedisModule } from './infrastructure/redis/redis.module';
import { QueueModule } from './infrastructure/queue/queue.module';
import { LoggerService } from './infrastructure/logger/logger.service';

@Module({
  imports: [AuthModule, TenantsModule, AttendantsModule, ConversationsModule, MessagesModule, SessionsModule, RoutingModule, WhatsappModule, NotificationsModule, HealthModule, PrismaModule, RedisModule, QueueModule],
  controllers: [AppController],
  providers: [AppService, LoggerService],
})
export class AppModule {}
