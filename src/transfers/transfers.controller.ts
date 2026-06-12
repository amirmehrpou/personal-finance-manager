import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TransfersService } from './transfers.service';
import { CreateTransferDto, UpdateTransferDto } from './transfers.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Transfers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/v1/transfers')
export class TransfersController {
  constructor(private transfersService: TransfersService) {}

  @Post()
  @ApiOperation({ summary: 'انتقال وجه' })
  create(@CurrentUser() user: { id: string }, @Body() dto: CreateTransferDto) {
    return { data: this.transfersService.create(user.id, dto) };
  }

  @Get()
  @ApiOperation({ summary: 'لیست انتقال‌ها' })
  findAll(
    @CurrentUser() user: { id: string },
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.transfersService.findAll(user.id, Number(page) || 1, Number(limit) || 20);
  }

  @Get(':id')
  @ApiOperation({ summary: 'جزئیات انتقال' })
  findOne(@CurrentUser() user: { id: string }, @Param('id') id: string) {
    return { data: this.transfersService.findOne(user.id, id) };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'ویرایش انتقال' })
  update(
    @CurrentUser() user: { id: string },
    @Param('id') id: string,
    @Body() dto: UpdateTransferDto,
  ) {
    return { data: this.transfersService.update(user.id, id, dto) };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'حذف انتقال' })
  remove(@CurrentUser() user: { id: string }, @Param('id') id: string) {
    return { data: this.transfersService.softDelete(user.id, id) };
  }
}
