import { IsEnum, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export enum CurrencyDisplay {
  RIAL = 'RIAL',
  TOMAN = 'TOMAN',
}

export class UpdateSettingsDto {
  @ApiPropertyOptional({ enum: CurrencyDisplay })
  @IsEnum(CurrencyDisplay, { message: 'نوع نمایش ارز معتبر نیست.' })
  currencyDisplay?: CurrencyDisplay;

  @ApiPropertyOptional({ example: 'Asia/Tehran' })
  @IsString()
  timezone?: string;
}
