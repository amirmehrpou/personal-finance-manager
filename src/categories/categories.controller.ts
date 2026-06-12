import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto, UpdateCategoryDto } from './categories.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Categories')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/v1/categories')
export class CategoriesController {
  constructor(private categoriesService: CategoriesService) {}

  @Post()
  @ApiOperation({ summary: 'ایجاد دسته‌بندی' })
  create(@CurrentUser() user: { id: string }, @Body() dto: CreateCategoryDto) {
    return { data: this.categoriesService.create(user.id, dto) };
  }

  @Get()
  @ApiOperation({ summary: 'لیست دسته‌بندی‌ها' })
  @ApiQuery({ name: 'type', required: false, enum: ['INCOME', 'EXPENSE'] })
  findAll(@CurrentUser() user: { id: string }, @Query('type') type?: string) {
    return { data: this.categoriesService.findAll(user.id, type) };
  }

  @Get(':id')
  @ApiOperation({ summary: 'جزئیات دسته‌بندی' })
  findOne(@CurrentUser() user: { id: string }, @Param('id') id: string) {
    return { data: this.categoriesService.findOne(user.id, id) };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'ویرایش دسته‌بندی' })
  update(
    @CurrentUser() user: { id: string },
    @Param('id') id: string,
    @Body() dto: UpdateCategoryDto,
  ) {
    return { data: this.categoriesService.update(user.id, id, dto) };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'غیرفعال‌کردن دسته‌بندی' })
  remove(@CurrentUser() user: { id: string }, @Param('id') id: string) {
    return { data: this.categoriesService.remove(user.id, id) };
  }
}
