import { Module } from '@nestjs/common';
import { AuthController } from './interface/auth.controller';
import { AuthService } from './application/auth.service';
import { AuthSessionStore } from './infrastructure/auth-session.store';
import { KeycloakClientService } from './infrastructure/keycloak-client.service';

@Module({
  controllers: [AuthController],
  providers: [AuthService, AuthSessionStore, KeycloakClientService],
})
export class AuthModule {}
