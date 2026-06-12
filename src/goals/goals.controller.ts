import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { GoalsService } from './goals.service';
import {
  CreateGoalDto, UpdateGoalDto, CreateContributionDto, UpdateContributionDto,
} from './goals.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Goals')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/v1/goals')
export class GoalsController {
  constructor(private goalsService: GoalsService) {}

  @Post()
  @ApiOperation({ summary: 'ایجاد هدف مالی' })
  create(@CurrentUser() user: { id: string }, @Body() dto: CreateGoalDto) {
    return { data: this.goalsService.create(user.id, dto) };
  }

  @Get()
  @ApiOperation({ summary: 'لیست اهداف' })
  findAll(@CurrentUser() user: { id: string }, @Query('status') status?: string) {
    return { data: this.goalsService.findAll(user.id, status) };
  }

  @Get(':id')
  @ApiOperation({ summary: 'جزئیات هدف' })
  findOne(@CurrentUser() user: { id: string }, @Param('id') id: string) {
    return { data: this.goalsService.findOne(user.id, id) };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'ویرایش هدف' })
  update(@CurrentUser() user: { id: string }, @Param('id') id: string, @Body() dto: UpdateGoalDto) {
    return { data: this.goalsService.update(user.id, id, dto) };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'حذف هدف' })
  remove(@CurrentUser() user: { id: string }, @Param('id') id: string) {
    return { data: this.goalsService.remove(user.id, id) };
  }

  @Get(':id/progress')
  @ApiOperation({ summary: 'پیشرفت هدف' })
  getProgress(@CurrentUser() user: { id: string }, @Param('id') id: string) {
    return { data: this.goalsService.getProgress(user.id, id) };
  }

  // Contributions
  @Post(':id/contributions')
  @ApiOperation({ summary: 'ثبت واریز به هدف' })
  addContribution(
    @CurrentUser() user: { id: string },
    @Param('id') id: string,
    @Body() dto: CreateContributionDto,
  ) {
    return { data: this.goalsService.addContribution(user.id, id, dto) };
  }

  @Get(':id/contributions')
  @ApiOperation({ summary: 'تاریخچه واریزها' })
  getContributions(@CurrentUser() user: { id: string }, @Param('id') id: string) {
    return { data: this.goalsService.getContributions(user.id, id) };
  }

  @Patch(':id/contributions/:contributionId')
  @ApiOperation({ summary: 'ویرایش واریز' })
  updateContribution(
    @CurrentUser() user: { id: string },
    @Param('id') id: string,
    @Param('contributionId') contributionId: string,
    @Body() dto: UpdateContributionDto,
  ) {
    return { data: this.goalsService.updateContribution(user.id, id, contributionId, dto) };
  }

  @Delete(':id/contributions/:contributionId')
  @ApiOperation({ summary: 'حذف واریز' })
  deleteContribution(
    @CurrentUser() user: { id: string },
    @Param('id') id: string,
    @Param('contributionId') contributionId: string,
  ) {
    return { data: this.goalsService.deleteContribution(user.id, id, contributionId) };
  }
}
