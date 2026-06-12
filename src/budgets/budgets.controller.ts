import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { BudgetsService } from './budgets.service';
import { CreateBudgetDto, UpdateBudgetDto } from './budgets.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Budgets')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/v1/budgets')
export class BudgetsController {
  constructor(private budgetsService: BudgetsService) {}

  @Post()
  @ApiOperation({ summary: 'ایجاد بودجه' })
  create(@CurrentUser() user: { id: string }, @Body() dto: CreateBudgetDto) {
    return { data: this.budgetsService.create(user.id, dto) };
  }

  @Get()
  @ApiOperation({ summary: 'لیست بودجه‌ها' })
  findAll(
    @CurrentUser() user: { id: string },
    @Query('year') year?: number,
    @Query('month') month?: number,
  ) {
    return { data: this.budgetsService.findAll(user.id, Number(year) || undefined, Number(month) || undefined) };
  }

  @Get(':id')
  @ApiOperation({ summary: 'جزئیات بودجه' })
  findOne(@CurrentUser() user: { id: string }, @Param('id') id: string) {
    return { data: this.budgetsService.findOne(user.id, id) };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'ویرایش بودجه' })
  update(@CurrentUser() user: { id: string }, @Param('id') id: string, @Body() dto: UpdateBudgetDto) {
    return { data: this.budgetsService.update(user.id, id, dto) };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'حذف بودجه' })
  remove(@CurrentUser() user: { id: string }, @Param('id') id: string) {
    return { data: this.budgetsService.remove(user.id, id) };
  }
}
