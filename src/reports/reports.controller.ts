import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/v1/reports')
export class ReportsController {
  constructor(private reportsService: ReportsService) {}

  @Get('expenses')
  @ApiOperation({ summary: 'گزارش هزینه‌ها بر اساس بازه تاریخ' })
  @ApiQuery({ name: 'dateFrom', required: true, example: '2026-06-01' })
  @ApiQuery({ name: 'dateTo', required: true, example: '2026-06-30' })
  getExpenses(
    @CurrentUser() user: { id: string },
    @Query('dateFrom') dateFrom: string,
    @Query('dateTo') dateTo: string,
  ) {
    return { data: this.reportsService.getExpensesReport(user.id, dateFrom, dateTo) };
  }

  @Get('monthly')
  @ApiOperation({ summary: 'گزارش ماهانه' })
  @ApiQuery({ name: 'year', required: true, example: 2026 })
  @ApiQuery({ name: 'month', required: true, example: 6 })
  getMonthly(
    @CurrentUser() user: { id: string },
    @Query('year') year: string,
    @Query('month') month: string,
  ) {
    return { data: this.reportsService.getMonthlyReport(user.id, Number(year), Number(month)) };
  }

  @Get('comparison')
  @ApiOperation({ summary: 'مقایسه با ماه قبل' })
  @ApiQuery({ name: 'year', required: true, example: 2026 })
  @ApiQuery({ name: 'month', required: true, example: 6 })
  getComparison(
    @CurrentUser() user: { id: string },
    @Query('year') year: string,
    @Query('month') month: string,
  ) {
    return { data: this.reportsService.getComparisonReport(user.id, Number(year), Number(month)) };
  }
}
