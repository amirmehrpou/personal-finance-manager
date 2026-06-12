import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto, UpdateTransactionDto, TransactionQueryDto } from './transactions.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Transactions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/v1/transactions')
export class TransactionsController {
  constructor(private transactionsService: TransactionsService) {}

  @Post()
  @ApiOperation({ summary: 'ثبت تراکنش جدید' })
  create(@CurrentUser() user: { id: string }, @Body() dto: CreateTransactionDto) {
    return { data: this.transactionsService.create(user.id, dto) };
  }

  @Get()
  @ApiOperation({ summary: 'لیست تراکنش‌ها' })
  findAll(@CurrentUser() user: { id: string }, @Query() query: TransactionQueryDto) {
    return this.transactionsService.findAll(user.id, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'جزئیات تراکنش' })
  findOne(@CurrentUser() user: { id: string }, @Param('id') id: string) {
    return { data: this.transactionsService.findOne(user.id, id) };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'ویرایش تراکنش' })
  update(
    @CurrentUser() user: { id: string },
    @Param('id') id: string,
    @Body() dto: UpdateTransactionDto,
  ) {
    return { data: this.transactionsService.update(user.id, id, dto) };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'حذف نرم تراکنش' })
  remove(@CurrentUser() user: { id: string }, @Param('id') id: string) {
    return { data: this.transactionsService.softDelete(user.id, id) };
  }

  @Post(':id/restore')
  @ApiOperation({ summary: 'بازیابی تراکنش حذف‌شده' })
  restore(@CurrentUser() user: { id: string }, @Param('id') id: string) {
    return { data: this.transactionsService.restore(user.id, id) };
  }
}
