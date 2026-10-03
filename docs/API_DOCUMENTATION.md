# คู่มือการใช้งาน Web API (HW-5)
## ระบบจัดเส้นทางและแบ่งงานไรเดอร์อัจฉริยะ (ส่งด่วนมื้อเที่ยง)

---

### 1. ข้อมูลสมาชิกกลุ่ม
- ชื่อ-นามสกุล: ..................................................... รหัสนิสิต: .......................................
- ชื่อ-นามสกุล: ..................................................... รหัสนิสิต: .......................................
- ชื่อ-นามสกุล: ..................................................... รหัสนิสิต: .......................................

---

### 2. ER Diagram (ออกแบบสำหรับ erdplus.com)

```
[ Customer ] 1 ------------------- N [ Order ]
--------------------                 -----------------
- id (PK)                            - id (PK)
- first_name                         - customer_id (FK -> Customer.id)
- last_name                          - box_count
- phone                              - note
- address                            - status
- latitude                           - is_simulated
- longitude                          - order_time
- created_at
- updated_at
```

**คำอธิบายความสัมพันธ์:**
- **Customer (1) : Order (N)** ลูกค้า 1 คน สามารถมีรายการสั่งซื้อได้หลายรายการ (`customer_id` ทำหน้าที่เป็น Foreign Key ชี้ไปที่ `Customer.id`)

---

### 3. รายละเอียดเส้นทาง API (API Endpoints)

Base URL: `http://localhost:3000` (หรือ URL ที่ Deploy บน Cloud Server เช่น Render)

---

#### หมวดที่ 1: จัดการข้อมูลลูกค้า (Customers)

##### 1.1 แสดงรายชื่อลูกค้าทั้งหมด
- **Method:** `GET`
- **URL:** `/customers`
- **Response:** `200 OK`
```json
{
  "total": 25,
  "data": [
    {
      "id": 1,
      "first_name": "สมชาย",
      "last_name": "สายลุย",
      "phone": "0810010001",
      "address": "หอพักกัลปพฤกษ์ ห้อง 201",
      "latitude": "16.2465000",
      "longitude": "103.2520000"
    }
  ]
}
```

##### 1.2 ค้นหาจากส่วนหนึ่งของชื่อ หรือ นามสกุล
- **Method:** `GET`
- **URL:** `/customers?search=สม`
- **Query Params:** `search` (คำค้นหา)
- **Response:** `200 OK`

##### 1.3 ค้นหาลูกค้าทั้งหมดในระยะ 1 กิโลเมตร จากพิกัดที่กำหนด
- **Method:** `GET`
- **URL:** `/customers/nearby?lat=16.2465&lng=103.2520&radius=1`
- **Query Params:**
  - `lat`: พิกัดละติจูด (จำเป็น)
  - `lng`: พิกัดลองจิจูด (จำเป็น)
  - `radius`: รัศมีกิโลเมตร (ดีฟอลต์ = 1)
- **Response:** `200 OK` (เรียงตามระยะทางจากใกล้ไปไกล และมีคอลัมน์ `distance_km` คำนวณด้วยสูตร Haversine)

##### 1.4 ดึงข้อมูลลูกค้ารายคน
- **Method:** `GET`
- **URL:** `/customers/:id`
- **Response:** `200 OK` หรือ `404 Not Found`

##### 1.5 เพิ่มข้อมูลลูกค้าใหม่
- **Method:** `POST`
- **URL:** `/customers`
- **Headers:** `Content-Type: application/json`
- **Body:**
```json
{
  "first_name": "กานต์",
  "last_name": "ใจดี",
  "phone": "0899999999",
  "address": "หอพักริมมอ",
  "latitude": 16.2455,
  "longitude": 103.2505
}
```
- **Response:** `201 Created`

##### 1.6 แก้ไขข้อมูลลูกค้า
- **Method:** `PUT`
- **URL:** `/customers/:id`
- **Body:** (ส่งข้อมูลที่ต้องการอัปเดต)
- **Response:** `200 OK`

##### 1.7 ลบข้อมูลลูกค้า
- **Method:** `DELETE`
- **URL:** `/customers/:id`
- **Response:** `200 OK`

---

#### หมวดที่ 2: จัดการรายการสั่งซื้อ (Orders)

##### 2.1 จำลองรายการสั่งซื้อ 20–30 รายการ (โจทย์ข้อ 3.1)
- **Method:** `POST`
- **URL:** `/orders/simulate`
- **Body (ไม่บังคับ):**
```json
{
  "count": 25
}
```
- **Response:** `201 Created`
```json
{
  "message": "จำลองรายการสั่งซื้อสำเร็จจำนวน 25 รายการ",
  "simulated_count": 25
}
```

##### 2.2 ล้าง (ลบทั้งหมด) รายการสั่งซื้อที่จำลอง (โจทย์ข้อ 3.2)
- **Method:** `DELETE`
- **URL:** `/orders/simulate/all`
- **Response:** `200 OK`
```json
{
  "message": "ล้างรายการสั่งซื้อที่จำลองทั้งหมดเรียบร้อยแล้ว",
  "deleted_count": 25
}
```

##### 2.3 แสดงรายการสั่งซื้อทั้งหมดในระยะ 2 กิโลเมตร จากพิกัดที่กำหนด (โจทย์ข้อ 3.3)
- **Method:** `GET`
- **URL:** `/orders/nearby?lat=16.2465&lng=103.2520&radius=2`
- **Query Params:**
  - `lat`: พิกัดละติจูด
  - `lng`: พิกัดลองจิจูด
  - `radius`: รัศมีกิโลเมตร (ดีฟอลต์ = 2)
- **Response:** `200 OK` (JOIN ข้อมูลลูกค้า ชื่อ เบอร์โทร พิกัด และระยะทาง `distance_km`)

##### 2.4 แสดงรายการสั่งซื้อทั้งหมด
- **Method:** `GET`
- **URL:** `/orders`
- **Response:** `200 OK`

##### 2.5 เพิ่มรายการสั่งซื้อใหม่
- **Method:** `POST`
- **URL:** `/orders`
- **Body:**
```json
{
  "customer_id": 1,
  "box_count": 2,
  "note": "ไข่ดาวสุกๆ"
}
```
- **Response:** `201 Created`

##### 2.6 แก้ไขจำนวนกล่อง/ข้อมูลรายการสั่งซื้อ (โจทย์ข้อ 3.1.3)
- **Method:** `PUT`
- **URL:** `/orders/:id`
- **Body:**
```json
{
  "box_count": 3,
  "note": "เปลี่ยนเป็น 3 กล่อง"
}
```
- **Response:** `200 OK`

##### 2.7 ลบรายการสั่งซื้อรายคำสั่งซื้อ
- **Method:** `DELETE`
- **URL:** `/orders/:id`
- **Response:** `200 OK`

---

### 4. คำแนะนำการ Deploy บน Render (Server ฟรี)
1. นำโค้ดขึ้น GitHub repository (สร้าง New Repository)
2. ไปที่ [render.com](https://render.com/) -> New Web Service -> เลือก Repository
3. ตั้งค่า:
   - **Environment:** Node
   - **Build Command:** `npm install && npx tsc`
   - **Start Command:** `node dist/server.js`
   - **Environment Variables:**
     - `DB_HOST`: โฮสต์ MySQL บน Cloud (เช่น aiven.io หรือ TiDB Cloud ฟรี)
     - `DB_USER`: user
     - `DB_PASSWORD`: password
     - `DB_NAME`: lunch_delivery
     - `DB_PORT`: port
