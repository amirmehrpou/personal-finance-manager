import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional, MaxLength } from 'class-validator';

export enum CategoryType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE',
}

export class CreateCategoryDto {
  @ApiProperty({ example: 'رستوران' })
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiProperty({ enum: CategoryType })
  @IsEnum(CategoryType, { message: 'نوع دسته‌بندی معتبر نیست.' })
  type: CategoryType;

  @ApiPropertyOptional({ example: '🍽️' })
  @IsOptional()
  @IsString()
  icon?: string;
}

export class UpdateCategoryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  icon?: string;
}
