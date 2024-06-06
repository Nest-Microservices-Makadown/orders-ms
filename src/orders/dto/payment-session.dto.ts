import { Type } from "class-transformer";
import { ArrayMinSize, IsArray, IsNumber, IsPositive, IsString, Validate, ValidateNested } from "class-validator";


/**
 * structure required by the payment microservice
 */
export class PaymentSessionDto {

    @IsString()
    orderId: string;

    @IsString()
    currency: string; // usd, eur, etc.

    @IsArray()
    @ArrayMinSize(1)
    @ValidateNested({ each: true })
    @Type(() => PaymentSessionItemDto)
    items: PaymentSessionItemDto[];
}

export class PaymentSessionItemDto {
    @IsString()
    name: string;
    @IsNumber()
    @IsPositive()
    price: number;
    @IsNumber()
    @IsPositive()
    quantity: number;
}
