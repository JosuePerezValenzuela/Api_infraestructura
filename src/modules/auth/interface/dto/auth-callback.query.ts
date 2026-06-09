import { IsNotEmpty, IsString } from 'class-validator';

export class AuthCallbackQueryDto {
  @IsString()
  @IsNotEmpty()
  code!: string;

  @IsString()
  @IsNotEmpty()
  state!: string;
}
