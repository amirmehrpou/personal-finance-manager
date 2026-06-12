import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsUUID, IsInt, IsPositive, IsDateString, IsOptional, IsString, MaxLength,
} from 'class-validator';

export class CreateTransferDto {
  @ApiProperty()
  @IsUUID('4')
  sourceAccountId: string;

  @ApiProperty()
  @IsUUID('4')
  destinationAccountId: string;

  @ApiProperty({ example: 1000000 })
  @IsInt()
  @IsPositive({ message: 'مبلغ باید بیشتر از صفر باشد.' })
  amount: number;

  @ApiProperty({ example: '2026-06-01' })
  @IsDateString()
  transferDate: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}

export class UpdateTransferDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @IsPositive()
  amount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  transferDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}
