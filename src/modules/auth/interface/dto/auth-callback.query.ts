import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class AuthCallbackQueryDto {
  @IsString()
  @IsNotEmpty()
  code!: string;

  @IsString()
  @IsNotEmpty()
  state!: string;

  @IsString()
  @IsOptional()
  session_state?: string;

  @IsString()
  @IsOptional()
  iss?: string;
}
