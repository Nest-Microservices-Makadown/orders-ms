import { IsBoolean, IsEnum, IsNumber, IsOptional, IsPositive } from "class-validator";
import { OrderStatusList } from "./enum/order.enum";
import { OrderStatus } from "@prisma/client";

export class CreateOrderDto {
    @IsNumber()
    @IsPositive()
    totalAmount: number;
    
    @IsNumber()
    @IsPositive()
    totalItems: number;

    @IsEnum(OrderStatusList, { message: `The status must be one of the following: ${OrderStatusList}` })
    @IsOptional()
    status: OrderStatus = OrderStatus.PENDING;

    @IsBoolean()
    @IsOptional()
    paid: boolean = false;
}