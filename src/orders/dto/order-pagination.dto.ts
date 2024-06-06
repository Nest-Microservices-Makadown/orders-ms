import { IsEnum, IsOptional } from "class-validator";
import { PaginationDto } from "../../common";
import { OrderStatusList } from "../enum/order.enum";
import { OrderStatus } from "@prisma/client";

export class OrderPaginationDto extends PaginationDto {
    @IsOptional()
    @IsEnum(OrderStatusList, { message: `Order status must be one of these: ${OrderStatusList}` })
    status: OrderStatus;
}
