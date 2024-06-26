import { Injectable, OnModuleInit, Logger, HttpStatus, Query, Inject } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderStatus, PrismaClient } from '@prisma/client';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { OrderPaginationDto } from './dto/order-pagination.dto';
import { ChangeOrderStatusDto, PaidOrderDto } from './dto';
import { NATS_SERVICE } from 'src/config';
import { catchError, firstValueFrom } from 'rxjs';
import { OrderWithProducts } from './interfaces/order-with-products.interface';
import { PaymentSessionDto } from './dto/payment-session.dto';

@Injectable()
export class OrdersService extends PrismaClient implements OnModuleInit {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    @Inject(NATS_SERVICE)
    private readonly natsClient: ClientProxy) {
    super();
  }

  async onModuleInit() {
    await this.$connect();
    this.logger.log('Orders in Postgres Database ready');
  }

  async create(createOrderDto: CreateOrderDto) {
    try {
      const ids = createOrderDto.items.map(item => item.productId);
      // 1. confirm products exist
      const products = await firstValueFrom(
        this.natsClient.send('validate-products', ids)
      );

      // 2. Estimate values based on products and quantity
      const totalAmount = createOrderDto.items
        .reduce((acc, orderItem) => {
          const price = products.find(prod => prod.id === orderItem.productId).price;
          return acc + price * orderItem.quantity;
        }, 0);

      const totalItems = createOrderDto.items
        .reduce((acc, orderItem) => {
          return acc + orderItem.quantity;
        }, 0);

      // 3. Create a database transaction
      const order = await this.order.create({
        data: {
          totalAmount,
          totalItems,
          OrderItem: {
            createMany: {
              data: createOrderDto.items.map(orderItem => ({
                productId: orderItem.productId,
                price: products.find(prod => prod.id === orderItem.productId).price,
                quantity: orderItem.quantity,
              }))
            }
          }
        },
        include: {
          OrderItem: {
            select: {
              price: true,
              quantity: true,
              productId: true
            }
          }
        },
      });

      // 4. return the created order, also adding the product name for each order item
      return {
        ...order,
        OrderItem: createOrderDto.items.map(orderItem => ({
          ...orderItem,
          productName: products.find(prod => prod.id === orderItem.productId).name
        }))
      };
    } catch (error) {
      throw new RpcException(error);
    }
  }

  async createPaymentSession(order: OrderWithProducts) {
    try {
      let payload: PaymentSessionDto;
      // convert order to dto structure required by the payment microservice
      payload = {
        orderId: order.id,
        currency: 'mxn',
        items: order.OrderItem.map(item => ({
          name: item.productName,
          quantity: item.quantity,
          price: item.price
        }))
      };
      const paymentSession = await firstValueFrom(
          this.natsClient.send('create.payment.session', 
            payload));

      return paymentSession;
    } catch (error) {
      throw new RpcException(error);
    }
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
    // 1. Try to retrieve order along with order details
    const order = await this.order.findFirst({
      where: { id },
      include: {
        OrderItem: {
          select: {
            price: true,
            quantity: true,
            productId: true
          }
        }
      }
    })

    // This commented line show in case you want to pick specific fields from order + order items
    /*const order = await this.order.findFirst({
      where: { id },
      select: {
        id: true,
        totalAmount: true,
        totalItems: true,
        status: true,
        paid: true,
        paidAt: true,
        OrderItem: {
          select: {
            price: true,
            quantity: true,
            productId: true
          }
        }
      }
    });*/

    if (!order) {
      throw new RpcException({
        message: `Order #${id} not found`,
        status: HttpStatus.BAD_REQUEST
      });
    }

    try {
      // 2. Create an id array from order items
      const ids = order.OrderItem.map(orderItem => orderItem.productId);
      // 3. Validate products exist by calling the products microservice
      const products = await firstValueFrom(
        this.natsClient.send('validate-products', ids)
      );
      // 4. Add product name to each order item
      return {
        ...order,
        OrderItem: order.OrderItem.map(orderItem => ({
          ...orderItem,
          productName: products.find(prod => prod.id === orderItem.productId).name
        }))
      };

    } catch (error) {
      throw new RpcException(error);
    }
  }

  async changeOrderStatus(changeOrderStatusDto: ChangeOrderStatusDto) {
    const { id, status } = changeOrderStatusDto;

    // just to trigger validation
    const currentOrder = await this.findOne(id);

    if (currentOrder.status === status) {
      return currentOrder;
    }

    return await this.order.update({
      where: { id },
      data: { status }
    });
  }

  async paidOrder(paidOrderDto: PaidOrderDto) {
    const { stripePaymentId, orderId, receiptUrl } = paidOrderDto;

    const order = await this.findOne(orderId);

    if (!order) {
      this.logger.log(`Order does not exist.`);
      throw new RpcException({
        message: `Order #${orderId} not found`,
        status: HttpStatus.BAD_REQUEST
      });
    }

    if (order.paid) {
      this.logger.log(`Order #${orderId} is already paid. No further action required.`);
      return order;
    }

    const paidOrder = await this.order.update({
      where: { id: orderId },
      data: { status: OrderStatus.PAID, 
              paid: true,
              stripeChargeId: stripePaymentId,
              // put here the related entity
              OrderReceipt: {
                create: {
                  receiptUrl
                }
              }
            }
    });

    return paidOrder;
  }
}
