import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SettingsService } from './settings.service';
import { UpdateSettingsDto } from './settings.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Settings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/v1/settings')
export class SettingsController {
  constructor(private settingsService: SettingsService) {}

  @Get()
  @ApiOperation({ summary: 'دریافت تنظیمات کاربر' })
  getSettings(@CurrentUser() user: { id: string }) {
    return { data: this.settingsService.getSettings(user.id) };
  }

  @Patch()
  @ApiOperation({ summary: 'به‌روزرسانی تنظیمات' })
  updateSettings(
    @CurrentUser() user: { id: string },
    @Body() dto: UpdateSettingsDto,
  ) {
    return { data: this.settingsService.updateSettings(user.id, dto) };
  }
}
