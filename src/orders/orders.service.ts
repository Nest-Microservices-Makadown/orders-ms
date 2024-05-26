import { Injectable, OnModuleInit, Logger, HttpStatus, Query } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { PrismaClient } from '@prisma/client';
import { RpcException } from '@nestjs/microservices';
import { OrderPaginationDto } from './dto/order-pagination.dto';
import { ChangeOrderStatusDto } from './dto';

@Injectable()
export class OrdersService extends PrismaClient implements OnModuleInit {
  private readonly logger = new Logger(OrdersService.name);

  async onModuleInit() {
    await this.$connect();
    this.logger.log('Orders in Postgres Database ready');
  }

  create(createOrderDto: CreateOrderDto) {
    return this.order.create({
      data: createOrderDto,
    });
  }

  async findAll(paginationDto: OrderPaginationDto) {
    this.logger.log('Receiving paginationDto: ' + JSON.stringify(paginationDto));
    const { limit, page } = paginationDto;
    const total =
      await this.order.count({
        where: { status: paginationDto.status }
      });

    const lastPage = Math.ceil(total / limit);
    const data =
      await this.order.findMany({
        skip: (page - 1) * limit,
        take: limit,
        where: { status: paginationDto.status }
      });

    return {
      data,
      meta: {
        total,
        page,
        lastPage
      }
    }
  }

  async findOne(id: string) {
    const order = await this.order.findFirst({ where: { id } });
    if (!order) {
      throw new RpcException({
        message: `Order #${id} not found`,
        status: HttpStatus.BAD_REQUEST
      });
    }
    return order;
  }

  async changeOrderStatus(changeOrderStatusDto: ChangeOrderStatusDto) {
    const { id, status } = changeOrderStatusDto;
    
    // just to trigger validation
    const currentOrder = await this.findOne(id);

    if ( currentOrder.status === status ) {
      return currentOrder;
    }

    return await this.order.update({
      where: { id },
      data: { status }
    });
  }
}
