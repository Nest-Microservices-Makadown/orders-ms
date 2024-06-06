import { PartialType } from '@nestjs/mapped-types';
import { CreateOrderDto } from './create-order.dto';
import { OrderStatus } from '@prisma/client';
import { IsEnum, IsUUID } from 'class-validator';
import { OrderStatusList } from '../enum/order.enum';

export class ChangeOrderStatusDto {
  @IsUUID(4)
  id: string;
  @IsEnum(OrderStatusList, { message: `Order status must be one of these: ${OrderStatusList}` })
  status: OrderStatus;
}
