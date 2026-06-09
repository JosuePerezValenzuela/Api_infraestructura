import { Controller, Get, Query, Req, Res } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { AuthService } from '../application/auth.service';
import { AuthCallbackQueryDto } from './dto/auth-callback.query';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly config: ConfigService,
  ) {}

  @Get('login')
  @ApiOperation({ summary: 'Redirige al login de Keycloak' })
  async login(@Res() res: Response) {
    const { redirectUrl } = await this.authService.login();
    return res.redirect(302, redirectUrl);
  }

  @Get('callback')
  @ApiOperation({ summary: 'Procesa el callback de Keycloak' })
  async callback(@Query() query: AuthCallbackQueryDto, @Res() res: Response) {
    const result = await this.authService.callback(query.code, query.state);
    res.cookie(result.cookie.name, result.cookie.value, result.cookie.options);
    return res.redirect(302, result.redirectUrl);
  }

  @Get('me')
  @ApiOperation({ summary: 'Devuelve el usuario autenticado actual' })
  @ApiOkResponse({ description: 'Usuario autenticado' })
  async me(@Req() req: Request) {
    return {
      authenticated: true,
      user: await this.authService.me(this.readCookie(req, this.cookieName())),
    };
  }

  @Get('logout')
  @ApiOperation({ summary: 'Cierra la sesión local y de Keycloak' })
  async logout(@Req() req: Request, @Res() res: Response) {
    const result = await this.authService.logout(
      this.readCookie(req, this.cookieName()),
    );
    res.clearCookie(result.cookie.name, result.cookie.options);
    return res.redirect(302, result.redirectUrl);
  }

  private cookieName(): string {
    return this.config.get<string>('SESSION_COOKIE_NAME') ?? 'siss_session';
  }

  private readCookie(req: Request, name: string): string | undefined {
    const cookieHeader = req.headers.cookie;
    if (!cookieHeader) {
      return undefined;
    }

    const entries = cookieHeader.split(';');
    for (const entry of entries) {
      const [rawKey, ...rawValue] = entry.trim().split('=');
      if (rawKey === name) {
        return rawValue.join('=');
      }
    }

    return undefined;
  }
}
