require('dotenv').config();
const express = require('express');
const session = require('express-session');
const { Client } = require('pg'); // สำหรับเชื่อมต่อกับฐานข้อมูล PostgreSQL ของ Supabase
const app = express();
const path = require('path');
// ส่วนเพิ่มเติมสำหรับหา IP Address
const os = require('os');

// ตั้งค่าการใช้ ejs สำหรับแสดงผลหน้าเว็บ
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));

// ใช้ express-session สำหรับจัดการ session
app.use(session({
  secret: process.env.SECRET_KEY,  // ใช้ค่า secret จาก .env
  resave: false,
  saveUninitialized: true,
}));

// ใช้ express.json และ express.urlencoded สำหรับการรับค่าจากฟอร์ม
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files (เช่น Bootstrap, images)
app.use(express.static(path.join(__dirname, 'public')));

// ตั้งค่าการเชื่อมต่อกับฐานข้อมูล Supabase
const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

client.connect()
  .then(() => console.log('Connected to the database'))
  .catch((err) => console.error('Database connection error', err.stack));

  function getServerIP() {
    const networkInterfaces = os.networkInterfaces();
    let serverIP = 'localhost';
    
    // วนหา IP Address ที่ไม่ใช่ localhost
    Object.keys(networkInterfaces).forEach((interfaceName) => {
      networkInterfaces[interfaceName].forEach((interface) => {
        // เลือก IPv4 ที่ไม่ใช่ localhost
        if (interface.family === 'IPv4' && !interface.internal) {
          serverIP = interface.address;
        }
      });
    });
    
    return serverIP;
  }
// หน้า Login
app.get('/login', (req, res) => {
  res.render('login');
});

// หน้า Register (สร้างบัญชี)
app.get('/register', (req, res) => {
  res.render('register');
});

// หน้า Home (หลังจากล็อกอินแล้ว)
app.get('/home', (req, res) => {
  if (req.session.user) {
    res.render('home', { user: req.session.user });
  } else {
    res.redirect('/login');
  }
});

// เพิ่มการสมัครสมาชิก
app.post('/register', async (req, res) => {
  const { username, fullname, lastname, email, password, phone } = req.body;

  try {
    // ตรวจสอบว่า email หรือ username หรือ phone ซ้ำกับที่มีในฐานข้อมูลหรือไม่
    const emailResult = await client.query('SELECT * FROM users WHERE email = $1', [email]);
    const usernameResult = await client.query('SELECT * FROM users WHERE username = $1', [username]);
    const phoneResult = await client.query('SELECT * FROM users WHERE phone = $1', [phone]);

    if (emailResult.rows.length > 0) {
      return res.render('register', { alertMessage: 'Email already exists' });
    }

    if (usernameResult.rows.length > 0) {
      return res.render('register', { alertMessage: 'Username already exists' });
    }

    if (phoneResult.rows.length > 0) {
      return res.render('register', { alertMessage: 'Phone number already exists' });
    }

    // เพิ่มข้อมูลผู้ใช้ใหม่ลงในฐานข้อมูล
    const insertQuery = 'INSERT INTO users (username, fullname, lastname, email, password, phone) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *';
    const newUser = await client.query(insertQuery, [username, fullname, lastname, email, password, phone]);

    // เก็บข้อมูลผู้ใช้ใน session
    req.session.user = { id: newUser.rows[0].id, username, fullname, lastname, email, phone };
    res.redirect('/home');
  } catch (err) {
    console.error(err);
    res.send('Error registering user');
  }
});




// ตรวจสอบการล็อกอิน
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // ตรวจสอบข้อมูลผู้ใช้จากฐานข้อมูล
    const result = await client.query('SELECT * FROM users WHERE email = $1 AND password = $2', [email, password]);

    if (result.rows.length > 0) {
      // เก็บข้อมูลผู้ใช้ใน session
      req.session.user = { id: result.rows[0].id, username: result.rows[0].username, email, phone: result.rows[0].phone };
      res.redirect('/home');
    } else {
      res.send('Invalid login');
    }
  } catch (err) {
    console.error(err);
    res.send('Error logging in');
  }
});

// เพิ่มฟังก์ชันการล็อกเอาท์
app.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.redirect('/home');
    }
    res.redirect('/login');
  });
});

// ตรวจสอบเบอร์โทรศัพท์ว่าอยู่ในฐานข้อมูลหรือไม่
app.post('/check-phone', async (req, res) => {
  const { phone } = req.body;

  try {
    // ค้นหาเบอร์โทรศัพท์ในฐานข้อมูล
    const result = await client.query('SELECT * FROM users WHERE phone = $1', [phone]);

    if (result.rows.length > 0) {
      // ถ้าพบเบอร์โทรศัพท์นี้ในฐานข้อมูล
      res.json({ exists: true });
    } else {
      // ถ้าไม่พบเบอร์โทรศัพท์ในฐานข้อมูล
      res.json({ exists: false });
    }
  } catch (err) {
    console.error(err);
    res.status(500).send('Error checking phone number');
  }
});

// เพิ่ม API endpoints สำหรับ ESP32
app.post('/api/verify-phone', async (req, res) => {
  const { phone } = req.body;

  try {
    // ค้นหาเบอร์โทรศัพท์ในฐานข้อมูล
    const result = await client.query('SELECT id, username, phone FROM users WHERE phone = $1', [phone]);

    if (result.rows.length > 0) {
      // ถ้าพบผู้ใช้
      const user = result.rows[0];
      res.json({
        status: "success",
        userName: user.username,
        phone: user.phone
      });
    } else {
      // ถ้าไม่พบผู้ใช้
      res.json({
        status: "error",
        message: "Phone number not found"
      });
    }
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({
      status: "error",
      message: "Server error"
    });
  }
});

app.post('/api/record-points', async (req, res) => {
  const { phone, count } = req.body;

  try {
    // หาผู้ใช้จากเบอร์โทรศัพท์
    const userResult = await client.query('SELECT id, username, points, garbageitem FROM users WHERE phone = $1', [phone]);
    
    if (userResult.rows.length === 0) {
      return res.json({
        status: "error",
        message: "User not found"
      });
    }

    const user = userResult.rows[0];
    const itemCount = parseInt(count);
    const pointsEarned = itemCount * 2; // คูณ 2 เพื่อคำนวณคะแนน

    // เริ่ม Transaction
    await client.query('BEGIN');

    try {
      // อัพเดตคะแนนและจำนวนขยะของผู้ใช้
      const updateUser = `
        UPDATE users 
        SET points = COALESCE(points, 0) + $1,
            garbageitem = COALESCE(garbageitem, 0) + $2
        WHERE id = $3 
        RETURNING points, garbageitem
      `;
      const updateResult = await client.query(updateUser, [pointsEarned, itemCount, user.id]);

      // บันทึกประวัติการทำรายการ
      const insertHistory = `
        INSERT INTO transaction_history (user_id, items_count, points_earned)
        VALUES ($1, $2, $3)
      `;
      await client.query(insertHistory, [user.id, itemCount, pointsEarned]);

      // Commit transaction
      await client.query('COMMIT');

      res.json({
        status: "success",
        points: pointsEarned,
        totalPoints: updateResult.rows[0].points,
        itemsReceived: itemCount,
        totalItems: updateResult.rows[0].garbageitem
      });

    } catch (err) {
      // Rollback ในกรณีที่เกิดข้อผิดพลาด
      await client.query('ROLLBACK');
      throw err;
    }

  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({
      status: "error",
      message: "Server error"
    });
  }
});

// เพิ่ม endpoint สำหรับทดสอบการเชื่อมต่อ
app.get('/api/test', (req, res) => {
  res.json({
    status: "success",
    message: "API is working"
  });
});

const port = process.env.PORT || 3000;
const serverIP = getServerIP();

app.listen(port, () => {
  console.log('\n=== Server Information ===');
  console.log(`Server is running on:`);
  console.log(`- Local: http://localhost:${port}`);
  console.log(`- Network: http://${serverIP}:${port}`);
  console.log('\nAPI Endpoints for Postman testing:');
  console.log(`1. Test Connection:`);
  console.log(`   GET http://${serverIP}:${port}/api/test`);
  console.log('\n2. Verify Phone:');
  console.log(`   POST http://${serverIP}:${port}/api/verify-phone`);
  console.log('   Body (JSON): { "phone": "0812345678" }');
  console.log('\n3. Record Points:');
  console.log(`   POST http://${serverIP}:${port}/api/record-points`);
  console.log('   Body (JSON): { "phone": "0812345678", "count": 5 }');
  console.log('\n=======================');
});
