// แก้ไขส่วนตรวจสอบการล็อกอิน
app.post('/login', async (req, res) => {
    const { email, password } = req.body;
  
    try {
      // ตรวจสอบข้อมูลผู้ใช้จากฐานข้อมูล
      const result = await client.query('SELECT * FROM users WHERE email = $1 AND password = $2', [email, password]);
  
      if (result.rows.length > 0) {
        // เก็บข้อมูลผู้ใช้ใน session
        req.session.user = { 
          id: result.rows[0].id, 
          username: result.rows[0].username, 
          email,
          phone: result.rows[0].phone 
        };
        res.redirect('/home');
      } else {
        // กรณีล็อกอินไม่สำเร็จ
        res.render('login', { 
          error: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง',
          email: email // ส่งค่ากลับไปแสดงในฟอร์ม
        });
      }
    } catch (err) {
      console.error('Error during login:', err);
      res.render('login', { 
        error: 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง',
        email: email
      });
    }
  });