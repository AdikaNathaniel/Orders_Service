import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { UserRepository } from 'src/shared/repositories/user.repository';
import { ProductRepository } from 'src/shared/repositories/product.respository';
import { OrdersRepository } from 'src/shared/repositories/order.repository';
import { APP_GUARD } from '@nestjs/core';
import { RolesGuard } from 'src/shared/middleware/roles.guard';
import config from 'config';
import { Products, ProductSchema } from 'src/shared/schema/products';
import { License, LicenseSchema } from 'src/shared/schema/license';
import { Orders, OrderSchema } from 'src/shared/schema/orders';
import { Users, UserSchema } from 'src/shared/schema/users';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthMiddleware } from 'src/shared/middleware/auth';
import Stripe from 'stripe';

@Module({
  controllers: [OrdersController],
  providers: [
    OrdersService,
    UserRepository,
    ProductRepository,
    OrdersRepository,
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    {
      provide: 'STRIPE_CLIENT',
      useFactory: () => {
        return new Stripe(config.get('stripe.secret_key'), {
          apiVersion: '2024-12-18.acacia',
        });
      },
    },
  ],
  imports: [
    MongooseModule.forFeature([{ name: Products.name, schema: ProductSchema }]),
    MongooseModule.forFeature([{ name: License.name, schema: LicenseSchema }]),
    MongooseModule.forFeature([{ name: Users.name, schema: UserSchema }]),
    MongooseModule.forFeature([{ name: Orders.name, schema: OrderSchema }]),
  ],
})
export class OrdersModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuthMiddleware)
      .exclude({
        path: `${config.get('appPrefix')}/orders/webhook`,
        method: RequestMethod.POST,
      })
      .forRoutes(OrdersController);
  }
}