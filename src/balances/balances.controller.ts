import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { BalancesService } from './balances.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Balances')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/v1')
export class BalancesController {
  constructor(private balancesService: BalancesService) {}

  @Get('balances')
  @ApiOperation({ summary: 'موجودی کل و همه حساب‌ها' })
  getAllBalances(
    @CurrentUser() user: { id: string },
    @Query('includeInactive') includeInactive?: string,
  ) {
    return { data: this.balancesService.getAllBalances(user.id, includeInactive !== 'false') };
  }

  @Get('accounts/:id/balance')
  @ApiOperation({ summary: 'موجودی یک حساب' })
  getAccountBalance(@CurrentUser() user: { id: string }, @Param('id') id: string) {
    const result = this.balancesService.getAccountBalance(user.id, id);
    return { data: result };
  }
}
