import { OrderStatus } from "@prisma/client";
import { Type } from "class-transformer";
import { IsEnum, IsOptional, IsPositive } from "class-validator";
import { OrderStatusList } from "src/orders/dto";

export class PaginationDto {
    @IsPositive()
    @IsOptional()
    @Type(() => Number)
    page?: number = 1;
    @IsPositive()
    @IsOptional()
    @Type(() => Number)
    limit?: number = 5;
}
