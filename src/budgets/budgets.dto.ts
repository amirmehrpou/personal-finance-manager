import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsUUID, IsInt, IsPositive, IsOptional, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateBudgetDto {
  @ApiProperty()
  @IsUUID('4')
  categoryId: string;

  @ApiProperty({ example: 2026 })
  @IsInt()
  @Min(2000)
  @Max(2100)
  year: number;

  @ApiProperty({ example: 6 })
  @IsInt()
  @Min(1)
  @Max(12)
  month: number;

  @ApiProperty({ example: 5000000 })
  @IsInt()
  @IsPositive({ message: 'سقف بودجه باید بیشتر از صفر باشد.' })
  limitAmount: number;
}

export class UpdateBudgetDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @IsPositive()
  limitAmount?: number;
}
