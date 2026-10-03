import express from 'express';
import cors from 'cors';
import { router as customerRouter } from './controllers/customerController';
import { router as orderRouter } from './controllers/orderController';

export const app = express();

// Middleware พื้นฐาน
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// เส้นทางหลัก / Status check
app.get('/', (req, res) => {
  res.json({
    project: 'ระบบจัดเส้นทางและแบ่งงานไรเดอร์อัจฉริยะ (ส่งด่วนมื้อเที่ยง) - Web API',
    status: 'online',
    version: '1.0.0',
    endpoints: {
      customers: '/customers',
      orders: '/orders',
    },
  });
});

// Routing
app.use('/customers', customerRouter);
app.use('/orders', orderRouter);
