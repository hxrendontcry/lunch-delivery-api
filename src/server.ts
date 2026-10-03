import http from 'http';
import dotenv from 'dotenv';
import { app } from './app';

dotenv.config();

// พอร์ตมาตรฐาน
const PORT = process.env.PORT || 3000;
const server = http.createServer(app);

server.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(` Server is running on: http://localhost:${PORT}`);
  console.log(` Documentation & Endpoints ready!`);
  console.log(`===============================================`);
});
