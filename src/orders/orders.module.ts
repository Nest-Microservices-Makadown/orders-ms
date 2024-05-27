import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { PRODUCT_SERVICE, envs } from 'src/config';
import { ClientsModule, Transport } from '@nestjs/microservices';

@Module({
  controllers: [OrdersController],
  providers: [OrdersService],
  imports: [
    ClientsModule.register([
      {
        name: PRODUCT_SERVICE,
        transport: Transport.TCP,
        options: {          
          host: envs.PRODUCTS_MS_HOST,
          port: envs.PRODUCTS_MS_PORT
        }
      }
    ]),
  ]
})
export class OrdersModule {}
