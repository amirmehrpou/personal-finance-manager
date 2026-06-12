import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsString,
  MinLength,
  MaxLength,
} from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail({}, { message: 'ایمیل معتبر نیست.' })
  email: string;

  @ApiProperty({ example: 'password123', minLength: 8 })
  @IsString()
  @MinLength(8, { message: 'رمز عبور باید حداقل ۸ کاراکتر باشد.' })
  password: string;

  @ApiProperty({ example: 'علی' })
  @IsString()
  @MinLength(2, { message: 'نام باید حداقل ۲ کاراکتر باشد.' })
  @MaxLength(50, { message: 'نام نباید بیشتر از ۵۰ کاراکتر باشد.' })
  firstName: string;
}

export class LoginDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail({}, { message: 'ایمیل معتبر نیست.' })
  email: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  @MinLength(1, { message: 'رمز عبور الزامی است.' })
  password: string;
}
