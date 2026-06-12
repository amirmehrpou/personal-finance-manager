import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEnum, IsInt, Min, MaxLength, IsOptional } from 'class-validator';

export enum AccountType {
  CASH = 'CASH',
  BANK_ACCOUNT = 'BANK_ACCOUNT',
  BANK_CARD = 'BANK_CARD',
  DIGITAL_WALLET = 'DIGITAL_WALLET',
}

export class CreateAccountDto {
  @ApiProperty({ example: 'حساب ملی' })
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiProperty({ enum: AccountType })
  @IsEnum(AccountType, { message: 'نوع حساب معتبر نیست.' })
  type: AccountType;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsInt({ message: 'موجودی اولیه باید عدد صحیح باشد.' })
  @Min(0)
  initialBalance?: number;
}

export class UpdateAccountDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({ enum: AccountType })
  @IsOptional()
  @IsEnum(AccountType)
  type?: AccountType;
}
