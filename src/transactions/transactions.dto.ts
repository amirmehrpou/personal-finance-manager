import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString, IsEnum, IsInt, IsPositive, IsUUID,
  IsDateString, IsOptional, MaxLength, IsIn, Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum TransactionType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE',
}

export class CreateTransactionDto {
  @ApiProperty({ enum: TransactionType })
  @IsEnum(TransactionType, { message: 'نوع تراکنش معتبر نیست.' })
  type: TransactionType;

  @ApiProperty({ example: 'خرید نان' })
  @IsString()
  @MaxLength(200)
  title: string;

  @ApiProperty({ example: 500000 })
  @IsInt({ message: 'مبلغ باید عدد صحیح باشد.' })
  @IsPositive({ message: 'مبلغ باید بیشتر از صفر باشد.' })
  amount: number;

  @ApiProperty()
  @IsUUID('4', { message: 'شناسه حساب معتبر نیست.' })
  accountId: string;

  @ApiProperty()
  @IsUUID('4', { message: 'شناسه دسته‌بندی معتبر نیست.' })
  categoryId: string;

  @ApiProperty({ example: '2026-06-01' })
  @IsDateString({}, { message: 'تاریخ معتبر نیست.' })
  transactionDate: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}

export class UpdateTransactionDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @IsPositive()
  amount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('4')
  accountId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('4')
  categoryId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  transactionDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}

export class TransactionQueryDto {
  @IsOptional() @Type(() => Number) page?: number = 1;
  @IsOptional() @Type(() => Number) limit?: number = 20;
  @IsOptional() search?: string;
  @IsOptional() type?: string;
  @IsOptional() categoryId?: string;
  @IsOptional() accountId?: string;
  @IsOptional() dateFrom?: string;
  @IsOptional() dateTo?: string;
  @IsOptional() @Type(() => Number) minAmount?: number;
  @IsOptional() @Type(() => Number) maxAmount?: number;
  @IsOptional() sortBy?: string = 'transactionDate';
  @IsOptional() sortOrder?: string = 'desc';
}
