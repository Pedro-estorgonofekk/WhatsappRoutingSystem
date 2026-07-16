import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './infrastructure/database/prisma/prisma.module';
import { RedisModule } from './infrastructure/redis/redis.module';
import { QueueModule } from './infrastructure/queue/queue.module';
import { TenantsModule } from './modules/tenants/tenants.module';
import { AuthModule } from './modules/auth/auth.module';
import { AttendantsModule } from './modules/attendants/attendants.module';
import { ConversationsModule } from './modules/conversations/conversations.module';
import { MessagesModule } from './modules/messages/messages.module';
import { SessionsModule } from './modules/sessions/sessions.module';
import { WhatsappModule } from './modules/whatsapp/whatsapp.module';
import { RoutingModule } from './modules/routing/routing.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { HealthModule } from './modules/health/health.module';
import { WhatsappController } from './modules/whatsapp/whatsapp.controller';
import { WhatsappService } from './modules/whatsapp/whatsapp.service';


@Module({
  imports: [PrismaModule, RedisModule, QueueModule, TenantsModule, AuthModule, AttendantsModule, ConversationsModule, MessagesModule, SessionsModule, WhatsappModule, RoutingModule, NotificationsModule, HealthModule],
  controllers: [AppController, WhatsappController],
  providers: [AppService, WhatsappService],
})
export class AppModule {}
