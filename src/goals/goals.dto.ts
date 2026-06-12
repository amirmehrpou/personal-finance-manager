import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString, IsInt, IsPositive, IsOptional, IsDateString,
  IsEnum, MaxLength, Min,
} from 'class-validator';

export enum GoalStatus {
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  PAUSED = 'PAUSED',
  CANCELLED = 'CANCELLED',
}

export class CreateGoalDto {
  @ApiProperty({ example: 'خرید خودرو' })
  @IsString()
  @MaxLength(200)
  title: string;

  @ApiProperty({ example: 'خودرو' })
  @IsString()
  @MaxLength(100)
  category: string;

  @ApiProperty({ example: 500000000 })
  @IsInt()
  @IsPositive({ message: 'مبلغ هدف باید بیشتر از صفر باشد.' })
  targetAmount: number;

  @ApiPropertyOptional({ example: '2026-12-01' })
  @IsOptional()
  @IsDateString()
  targetDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}

export class UpdateGoalDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @IsPositive()
  targetAmount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  targetDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;

  @ApiPropertyOptional({ enum: GoalStatus })
  @IsOptional()
  @IsEnum(GoalStatus)
  status?: GoalStatus;
}

export class CreateContributionDto {
  @ApiProperty({ example: 5000000 })
  @IsInt()
  @IsPositive({ message: 'مبلغ واریز باید بیشتر از صفر باشد.' })
  amount: number;

  @ApiProperty({ example: '2026-06-01' })
  @IsDateString()
  contributionDate: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}

export class UpdateContributionDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @IsPositive()
  amount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  contributionDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}
