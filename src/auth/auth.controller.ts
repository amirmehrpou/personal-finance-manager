import { Controller, Post, Get, Body, UseGuards, HttpCode } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto } from './auth.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Auth')
@Controller('api/v1/auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'ثبت‌نام کاربر جدید' })
  @ApiResponse({ status: 201, description: 'کاربر با موفقیت ثبت شد.' })
  @ApiResponse({ status: 409, description: 'ایمیل تکراری است.' })
  async register(@Body() dto: RegisterDto) {
    return { data: await this.authService.register(dto) };
  }

  @Post('login')
  @HttpCode(200)
  @ApiOperation({ summary: 'ورود به سیستم' })
  @ApiResponse({ status: 200, description: 'ورود موفق.' })
  @ApiResponse({ status: 401, description: 'اطلاعات نادرست.' })
  async login(@Body() dto: LoginDto) {
    return { data: await this.authService.login(dto) };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'اطلاعات کاربر جاری' })
  @ApiResponse({ status: 200, description: 'اطلاعات کاربر.' })
  getMe(@CurrentUser() user: { id: string }) {
    return { data: this.authService.getMe(user.id) };
  }
}
