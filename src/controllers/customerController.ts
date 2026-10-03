import { Router, Request, Response } from 'express';
import { conn } from '../dbconnect';
import { CustomerInput } from '../models/customer';

export const router = Router();

// สูตร Haversine หาฟังก์ชันระยะทางในหน่วยกิโลเมตร (SQL Expression)
const getDistanceSql = (lat: number, lng: number) => `
  (6371 * ACOS(
    COS(RADIANS(${lat})) * COS(RADIANS(latitude)) *
    COS(RADIANS(longitude) - RADIANS(${lng})) +
    SIN(RADIANS(${lat})) * SIN(RADIANS(latitude))
  ))
`;

/**
 * 1. ดึงข้อมูลลูกค้าทั้งหมด (พร้อมรองรับการค้นหาจากส่วนหนึ่งของชื่อหรือนามสกุล)
 * GET /customers
 * GET /customers?search=สมชาย
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { search } = req.query;

    if (search && typeof search === 'string') {
      const keyword = `%${search}%`;
      const [rows] = await conn.query(
        'SELECT * FROM customers WHERE first_name LIKE ? OR last_name LIKE ? ORDER BY id DESC',
        [keyword, keyword]
      );
      return res.status(200).json({
        total: (rows as any[]).length,
        data: rows,
      });
    }

    const [rows] = await conn.query('SELECT * FROM customers ORDER BY id DESC');
    return res.status(200).json({
      total: (rows as any[]).length,
      data: rows,
    });
  } catch (error) {
    console.error('Error fetching customers:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * 2. ค้นหาลูกค้าทั้งหมดในระยะ X กิโลเมตร จากพิกัดที่กำหนด (โจทย์: 1 กิโลเมตร)
 * GET /customers/nearby?lat=16.2468&lng=103.2523&radius=1
 */
router.get('/nearby', async (req: Request, res: Response) => {
  try {
    const lat = parseFloat(req.query.lat as string);
    const lng = parseFloat(req.query.lng as string);
    const radius = parseFloat((req.query.radius as string) || '1'); // ค่าเริ่มต้น 1 กิโลเมตร

    if (isNaN(lat) || isNaN(lng)) {
      return res.status(400).json({
        error: 'กรุณาระบุพิกัด lat และ lng ให้ถูกต้อง เช่น ?lat=16.2468&lng=103.2523',
      });
    }

    const distanceFormula = getDistanceSql(lat, lng);
    const sql = `
      SELECT *, ROUND(${distanceFormula}, 3) AS distance_km
      FROM customers
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
    console.error('Error finding nearby customers:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * 3. ดึงข้อมูลลูกค้ารายคนด้วย ID
 * GET /customers/:id
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const [rows] = await conn.query('SELECT * FROM customers WHERE id = ?', [id]);
    const customers = rows as any[];

    if (customers.length === 0) {
      return res.status(404).json({ error: 'ไม่พบข้อมูลลูกค้ารหัสนี้' });
    }

    return res.status(200).json(customers[0]);
  } catch (error) {
    console.error('Error fetching customer by id:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * 4. เพิ่มข้อมูลลูกค้าใหม่
 * POST /customers
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const customer: CustomerInput = req.body;

    if (!customer.first_name || !customer.last_name || !customer.phone || customer.latitude == null || customer.longitude == null) {
      return res.status(400).json({
        error: 'ข้อมูลไม่ครบถ้วน กรุณากรอก first_name, last_name, phone, latitude, longitude',
      });
    }

    const sql = `
      INSERT INTO customers (first_name, last_name, phone, address, latitude, longitude)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    const [result] = await conn.query(sql, [
      customer.first_name,
      customer.last_name,
      customer.phone,
      customer.address || '',
      customer.latitude,
      customer.longitude,
    ]);

    const insertResult = result as any;
    return res.status(201).json({
      message: 'เพิ่มข้อมูลลูกค้าสำเร็จ',
      inserted_id: insertResult.insertId,
      affected_rows: insertResult.affectedRows,
    });
  } catch (error: any) {
    console.error('Error creating customer:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'เบอร์โทรศัพท์นี้มีในระบบแล้ว' });
    }
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * 5. แก้ไขข้อมูลลูกค้า
 * PUT /customers/:id
 */
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const customer: CustomerInput = req.body;

    if (!customer.first_name || !customer.last_name || !customer.phone || customer.latitude == null || customer.longitude == null) {
      return res.status(400).json({
        error: 'ข้อมูลไม่ครบถ้วน กรุณากรอก first_name, last_name, phone, latitude, longitude',
      });
    }

    const sql = `
      UPDATE customers
      SET first_name = ?, last_name = ?, phone = ?, address = ?, latitude = ?, longitude = ?
      WHERE id = ?
    `;

    const [result] = await conn.query(sql, [
      customer.first_name,
      customer.last_name,
      customer.phone,
      customer.address || '',
      customer.latitude,
      customer.longitude,
      id,
    ]);

    const updateResult = result as any;
    if (updateResult.affectedRows === 0) {
      return res.status(404).json({ error: 'ไม่พบข้อมูลลูกค้ารหัสนี้' });
    }

    return res.status(200).json({
      message: 'แก้ไขข้อมูลลูกค้าสำเร็จ',
      affected_rows: updateResult.affectedRows,
    });
  } catch (error: any) {
    console.error('Error updating customer:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'เบอร์โทรศัพท์นี้ซ้ำกับลูกค้าท่านอื่น' });
    }
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * 6. ลบข้อมูลลูกค้า
 * DELETE /customers/:id
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const [result] = await conn.query('DELETE FROM customers WHERE id = ?', [id]);
    const deleteResult = result as any;

    if (deleteResult.affectedRows === 0) {
      return res.status(404).json({ error: 'ไม่พบข้อมูลลูกค้ารหัสนี้' });
    }

    return res.status(200).json({
      message: 'ลบข้อมูลลูกค้าสำเร็จ',
      affected_rows: deleteResult.affectedRows,
    });
  } catch (error) {
    console.error('Error deleting customer:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});
