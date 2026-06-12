import {
  Controller, Get, Post, Patch, Delete, Body, Param, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AccountsService } from './accounts.service';
import { CreateAccountDto, UpdateAccountDto } from './accounts.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Accounts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/v1/accounts')
export class AccountsController {
  constructor(private accountsService: AccountsService) {}

  @Post()
  @ApiOperation({ summary: 'ایجاد حساب جدید' })
  create(@CurrentUser() user: { id: string }, @Body() dto: CreateAccountDto) {
    return { data: this.accountsService.create(user.id, dto) };
  }

  @Get()
  @ApiOperation({ summary: 'لیست حساب‌ها' })
  findAll(@CurrentUser() user: { id: string }) {
    return { data: this.accountsService.findAll(user.id) };
  }

  @Get(':id')
  @ApiOperation({ summary: 'جزئیات حساب' })
  findOne(@CurrentUser() user: { id: string }, @Param('id') id: string) {
    return { data: this.accountsService.findOne(user.id, id) };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'ویرایش حساب' })
  update(
    @CurrentUser() user: { id: string },
    @Param('id') id: string,
    @Body() dto: UpdateAccountDto,
  ) {
    return { data: this.accountsService.update(user.id, id, dto) };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'غیرفعال‌کردن حساب' })
  remove(@CurrentUser() user: { id: string }, @Param('id') id: string) {
    return { data: this.accountsService.remove(user.id, id) };
  }
}
