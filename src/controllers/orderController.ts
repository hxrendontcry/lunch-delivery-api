import { Router, Request, Response } from 'express';
import { conn } from '../dbconnect';
import { OrderInput } from '../models/order';

export const router = Router();

// สูตร Haversine หาระยะทางตามพิกัดของลูกค้าที่ผูกกับคำสั่งซื้อ
const getDistanceSql = (lat: number, lng: number) => `
  (6371 * ACOS(
    COS(RADIANS(${lat})) * COS(RADIANS(c.latitude)) *
    COS(RADIANS(c.longitude) - RADIANS(${lng})) +
    SIN(RADIANS(${lat})) * SIN(RADIANS(c.latitude))
  ))
`;

// รายชื่อและพิกัดจำลองรอบๆ บริเวณ ม.มหาสารคาม (หรือพิกัดใจกลางเมือง)
const MOCK_CUSTOMERS_SEED = [
  { first_name: 'สมชาย', last_name: 'สายลุย', phone: '0810010001', address: 'หอพักกัลปพฤกษ์ ห้อง 201', lat: 16.2465, lng: 103.2520 },
  { first_name: 'สมหญิง', last_name: 'รักเรียน', phone: '0810010002', address: 'คอนโดพาร์ควิว ชั้น 3', lat: 16.2480, lng: 103.2545 },
  { first_name: 'อนันต์', last_name: 'มีทรัพย์', phone: '0810010003', address: 'คณะวิทยาการสารสนเทศ', lat: 16.2450, lng: 103.2510 },
  { first_name: 'กิตติศักดิ์', last_name: 'แซ่ลิ้ม', phone: '0810010004', address: 'อาคารวิทยบริการ มมส', lat: 16.2435, lng: 103.2530 },
  { first_name: 'จิราพร', last_name: 'บุญมี', phone: '0810010005', address: 'หอพักหญิงสายทิพย์', lat: 16.2495, lng: 103.2505 },
  { first_name: 'ธนากร', last_name: 'แก้วตา', phone: '0810010006', address: 'คณะวิศวกรรมศาสตร์', lat: 16.2420, lng: 103.2490 },
  { first_name: 'ปวีณา', last_name: 'พุ่มพวง', phone: '0810010007', address: 'ศูนย์อาหาร มมส ริมคลอง', lat: 16.2470, lng: 103.2560 },
  { first_name: 'วรพจน์', last_name: 'เจริญสุข', phone: '0810010008', address: 'หอพักอินเตอร์พาร์ค', lat: 16.2510, lng: 103.2535 },
  { first_name: 'นภาพร', last_name: 'สว่างจิตต์', phone: '0810010009', address: 'หมู่บ้านศุภาลัยการ์เด้น', lat: 16.2400, lng: 103.2475 },
  { first_name: 'พิเชษฐ์', last_name: 'มั่นคง', phone: '0810010010', address: 'ตึกคณะพยาบาลศาสตร์', lat: 16.2445, lng: 103.2570 },
  { first_name: 'กมลวรรณ', last_name: 'วงค์อินทร์', phone: '0810010011', address: 'หอพักชื่นใจ 2', lat: 16.2525, lng: 103.2515 },
  { first_name: 'ชัชชัย', last_name: 'ศรีสมร', phone: '0810010012', address: 'คณะมนุษยศาสตร์', lat: 16.2460, lng: 103.2485 },
  { first_name: 'ดาริน', last_name: 'รัตนาภรณ์', phone: '0810010013', address: 'สำนักวิทยบริการ อาคาร B', lat: 16.2438, lng: 103.2542 },
  { first_name: 'ธีรเดช', last_name: 'วงศ์สวัสดิ์', phone: '0810010014', address: 'อาคารพลศึกษา มมส', lat: 16.2415, lng: 103.2525 },
  { first_name: 'บุษบา', last_name: 'เสาวรส', phone: '0810010015', address: 'หอพักพูลทรัพย์ คลองถม', lat: 16.2540, lng: 103.2550 },
  { first_name: 'พงศกร', last_name: 'แสงจันทร์', phone: '0810010016', address: 'คณะสาธารณสุขศาสตร์', lat: 16.2455, lng: 103.2580 },
  { first_name: 'ภานุพงศ์', last_name: 'ทองแท้', phone: '0810010017', address: 'หอพักแสนสุข ซอย 5', lat: 16.2485, lng: 103.2465 },
  { first_name: 'มลฤดี', last_name: 'ไชยสุวรรณ', phone: '0810010018', address: 'หอพักสบายใจอินน์', lat: 16.2505, lng: 103.2575 },
  { first_name: 'รังสิมันต์', last_name: 'ส่องสว่าง', phone: '0810010019', address: 'คณะการบัญชีและการจัดการ', lat: 16.2472, lng: 103.2498 },
  { first_name: 'ลลิตา', last_name: 'ดวงดารา', phone: '0810010020', address: 'สำนักงานอธิการบดี', lat: 16.2463, lng: 103.2533 },
  { first_name: 'วิชัย', last_name: 'ชัยชนะ', phone: '0810010021', address: 'หอพักบ้านสวนรมย์รื่น', lat: 16.2530, lng: 103.2480 },
  { first_name: 'ศิริพร', last_name: 'ยอดมงคล', phone: '0810010022', address: 'คณะวิทยาศาสตร์ SC1', lat: 16.2440, lng: 103.2500 },
  { first_name: 'สมเกียรติ', last_name: 'ชื่นชม', phone: '0810010023', address: 'หอพักวิมานดิน 3', lat: 16.2555, lng: 103.2525 },
  { first_name: 'สุภาพร', last_name: 'เลิศล้ำ', phone: '0810010024', address: 'หอพักกรีนวิลล์ มอมหาสารคาม', lat: 16.2395, lng: 103.2555 },
  { first_name: 'อดิศร', last_name: 'สุขใจ', phone: '0810010025', address: 'คณะศึกษาศาสตร์', lat: 16.2428, lng: 103.2518 }
];

/**
 * 1. แสดงรายการสั่งซื้อทั้งหมด (พร้อมข้อมูลลูกค้า และรองรับตัวกรอง)
 * GET /orders
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const sql = `
      SELECT 
        o.id,
        o.customer_id,
        o.box_count,
        o.note,
        o.status,
        o.is_simulated,
        o.order_time,
        c.first_name,
        c.last_name,
        c.phone,
        c.address,
        c.latitude,
        c.longitude
      FROM orders o
      JOIN customers c ON o.customer_id = c.id
      ORDER BY o.id DESC
    `;
    const [rows] = await conn.query(sql);
    return res.status(200).json({
      total: (rows as any[]).length,
      data: rows,
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * 2. แสดงรายการสั่งซื้อทั้งหมดในระยะ X กิโลเมตร จากพิกัดที่กำหนด (โจทย์: 2 กิโลเมตร)
 * GET /orders/nearby?lat=16.2468&lng=103.2523&radius=2
 */
router.get('/nearby', async (req: Request, res: Response) => {
  try {
    const lat = parseFloat(req.query.lat as string);
    const lng = parseFloat(req.query.lng as string);
    const radius = parseFloat((req.query.radius as string) || '2'); // ค่าเริ่มต้น 2 กิโลเมตร

    if (isNaN(lat) || isNaN(lng)) {
      return res.status(400).json({
        error: 'กรุณาระบุพิกัด lat และ lng ให้ถูกต้อง เช่น ?lat=16.2468&lng=103.2523',
      });
    }

    const distanceFormula = getDistanceSql(lat, lng);
    const sql = `
      SELECT 
        o.id,
        o.customer_id,
        o.box_count,
        o.note,
        o.status,
        o.is_simulated,
        o.order_time,
        c.first_name,
        c.last_name,
        c.phone,
        c.address,
        c.latitude,
        c.longitude,
        ROUND(${distanceFormula}, 3) AS distance_km
      FROM orders o
      JOIN customers c ON o.customer_id = c.id
      HAVING distance_km <= ?
      ORDER BY distance_km ASC
    `;

    const [rows] = await conn.query(sql, [radius]);
    return res.status(200).json({
      center: { latitude: lat, longitude: lng },
      radius_km: radius,
      total: (rows as any[]).length,
      data: rows,
    });
  } catch (error) {
    console.error('Error fetching nearby orders:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * 3. ดึงข้อมูลรายการสั่งซื้อรายคำสั่งซื้อด้วย ID
 * GET /orders/:id
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const sql = `
      SELECT 
        o.id,
        o.customer_id,
        o.box_count,
        o.note,
        o.status,
        o.is_simulated,
        o.order_time,
        c.first_name,
        c.last_name,
        c.phone,
        c.address,
        c.latitude,
        c.longitude
      FROM orders o
      JOIN customers c ON o.customer_id = c.id
      WHERE o.id = ?
    `;
    const [rows] = await conn.query(sql, [id]);
    const orders = rows as any[];

    if (orders.length === 0) {
      return res.status(404).json({ error: 'ไม่พบรายการสั่งซื้อรหัสนี้' });
    }

    return res.status(200).json(orders[0]);
  } catch (error) {
    console.error('Error fetching order by id:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * 4. เพิ่มรายการสั่งซื้อใหม่
 * POST /orders
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const order: OrderInput = req.body;

    if (!order.customer_id || !order.box_count) {
      return res.status(400).json({
        error: 'กรุณากรอก customer_id และ box_count',
      });
    }

    if (order.box_count <= 0 || order.box_count > 10) {
      return res.status(400).json({
        error: 'จำนวนกล่องต้องอยู่ระหว่าง 1 ถึง 10 กล่อง (ตามเงื่อนไขของร้าน)',
      });
    }

    // ตรวจสอบว่ามีลูกค้าคนนี้จริงหรือไม่
    const [checkCust] = await conn.query('SELECT id FROM customers WHERE id = ?', [order.customer_id]);
    if ((checkCust as any[]).length === 0) {
      return res.status(404).json({ error: 'ไม่พบรหัสลูกค้าที่ระบุ' });
    }

    const sql = `
      INSERT INTO orders (customer_id, box_count, note, status, is_simulated)
      VALUES (?, ?, ?, 'pending', 0)
    `;

    const [result] = await conn.query(sql, [
      order.customer_id,
      order.box_count,
      order.note || '',
    ]);

    const insertResult = result as any;
    return res.status(201).json({
      message: 'เพิ่มรายการสั่งซื้อสำเร็จ',
      inserted_id: insertResult.insertId,
      affected_rows: insertResult.affectedRows,
    });
  } catch (error) {
    console.error('Error creating order:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * 5. แก้ไขรายการสั่งซื้อ (แก้ไขจำนวนกล่อง/หมายเหตุ ตามโจทย์ข้อ 3.1.3)
 * PUT /orders/:id
 */
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const { box_count, note, status } = req.body;

    if (box_count !== undefined && (box_count <= 0 || box_count > 10)) {
      return res.status(400).json({
        error: 'จำนวนกล่องต้องอยู่ระหว่าง 1 ถึง 10 กล่อง',
      });
    }

    // ดึงข้อมูลเดิมมาอัปเดต
    const [existing] = await conn.query('SELECT * FROM orders WHERE id = ?', [id]);
    const current = (existing as any[])[0];

    if (!current) {
      return res.status(404).json({ error: 'ไม่พบรายการสั่งซื้อรหัสนี้' });
    }

    const newBoxCount = box_count !== undefined ? box_count : current.box_count;
    const newNote = note !== undefined ? note : current.note;
    const newStatus = status !== undefined ? status : current.status;

    const sql = `
      UPDATE orders
      SET box_count = ?, note = ?, status = ?
      WHERE id = ?
    `;

    const [result] = await conn.query(sql, [newBoxCount, newNote, newStatus, id]);
    const updateResult = result as any;

    return res.status(200).json({
      message: 'แก้ไขรายการสั่งซื้อสำเร็จ',
      affected_rows: updateResult.affectedRows,
    });
  } catch (error) {
    console.error('Error updating order:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * 6. ลบรายการสั่งซื้อรายอัน
 * DELETE /orders/:id
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const [result] = await conn.query('DELETE FROM orders WHERE id = ?', [id]);
    const deleteResult = result as any;

    if (deleteResult.affectedRows === 0) {
      return res.status(404).json({ error: 'ไม่พบรายการสั่งซื้อรหัสนี้' });
    }

    return res.status(200).json({
      message: 'ลบรายการสั่งซื้อสำเร็จ',
      affected_rows: deleteResult.affectedRows,
    });
  } catch (error) {
    console.error('Error deleting order:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * 7. จำลองรายการสั่งซื้อ 20-30 รายการ พร้อมข้อมูลลูกค้าครบถ้วน (โจทย์ข้อ 3.1)
 * POST /orders/simulate
 * body (optional): { count: 25 }
 */
router.post('/simulate', async (req: Request, res: Response) => {
  try {
    const targetCount = parseInt(req.body.count || '25', 10);
    const count = Math.min(Math.max(targetCount, 20), 30); // บังคับให้อยู่ระหว่าง 20-30 ตามโจทย์

    // 1. เพิ่มลูกค้าตัวอย่างเข้าไปถ้ายังไม่มี
    const customerIds: number[] = [];
    for (const item of MOCK_CUSTOMERS_SEED) {
      const [existing] = await conn.query('SELECT id FROM customers WHERE phone = ?', [item.phone]);
      const rows = existing as any[];
      if (rows.length > 0) {
        customerIds.push(rows[0].id);
      } else {
        const [inserted] = await conn.query(
          'INSERT INTO customers (first_name, last_name, phone, address, latitude, longitude) VALUES (?, ?, ?, ?, ?, ?)',
          [item.first_name, item.last_name, item.phone, item.address, item.lat, item.lng]
        );
        customerIds.push((inserted as any).insertId);
      }
    }

    // 2. สร้างออเดอร์จำลอง (แต่ละออเดอร์ 1-3 กล่อง ตามเนื้อเรื่อง Project.md)
    let createdCount = 0;
    const notes = ['ขอน้ำปลาพริกเพิ่ม', 'ไข่ดาวไม่สุก', 'ไม่ใส่ผักโรย', 'เผ็ดน้อย', 'ขอช้อนส้อมด้วย', 'วางไว้ที่ป้อมยาม', 'โทรบอกก่อนถึง 5 นาที'];

    for (let i = 0; i < count; i++) {
      const custId = customerIds[i % customerIds.length];
      const boxCount = Math.floor(Math.random() * 3) + 1; // 1 ถึง 3 กล่อง
      const note = notes[i % notes.length];

      await conn.query(
        'INSERT INTO orders (customer_id, box_count, note, status, is_simulated) VALUES (?, ?, ?, ?, ?)',
        [custId, boxCount, note, 'pending', 1]
      );
      createdCount++;
    }

    return res.status(201).json({
      message: `จำลองรายการสั่งซื้อสำเร็จจำนวน ${createdCount} รายการ`,
      simulated_count: createdCount,
    });
  } catch (error) {
    console.error('Error simulating orders:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * 8. ล้าง (ลบทั้งหมด) รายการสั่งซื้อที่จำลองทั้งหมด (โจทย์ข้อ 3.2)
 * DELETE /orders/simulate/all
 */
router.delete('/simulate/all', async (req: Request, res: Response) => {
  try {
    const [result] = await conn.query('DELETE FROM orders WHERE is_simulated = 1');
    const deleteResult = result as any;

    return res.status(200).json({
      message: 'ล้างรายการสั่งซื้อที่จำลองทั้งหมดเรียบร้อยแล้ว',
      deleted_count: deleteResult.affectedRows,
    });
  } catch (error) {
    console.error('Error clearing simulated orders:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});
