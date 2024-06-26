import { Controller, ParseUUIDPipe } from '@nestjs/common';
import { EventPattern, MessagePattern, Payload } from '@nestjs/microservices';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderPaginationDto } from './dto/order-pagination.dto';
import { ChangeOrderStatusDto, PaidOrderDto } from './dto';
import { OrderWithProducts } from './interfaces/order-with-products.interface';

@Controller()
export class OrdersController {
  constructor(private readonly ordersService: OrdersService
  ) {}

  @MessagePattern('createOrder')
  async create(@Payload() createOrderDto: CreateOrderDto) {
    const order: OrderWithProducts = await this.ordersService.create(createOrderDto);
    const paymentSession = await this.ordersService.createPaymentSession(order);
    return {order, paymentSession};
  }

  @MessagePattern('findAllOrders')
  async findAll(@Payload() paginationDto?: OrderPaginationDto) {
    return await this.ordersService.findAll(paginationDto);
  }

  @MessagePattern('findOneOrder')
  async findOne(@Payload('id', ParseUUIDPipe) id: string) {
    return await this.ordersService.findOne(id);
  }

  @MessagePattern('changeOrderStatus')
  async changeOrderStatus(
    @Payload() changeOrderStatusDto: ChangeOrderStatusDto
  ) {
     return await this.ordersService.changeOrderStatus(changeOrderStatusDto);    
  }

  @EventPattern('payment.succeeded')
  async paymentSucceeded(@Payload() paidOrderDto: PaidOrderDto) {
    return this.ordersService.paidOrder(paidOrderDto);
  }
}
