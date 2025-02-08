## API Endpoints

### Test Connection
GET /api/test

### Verify Phone
POST /api/verify-phone
Body: { "phone": "0812345678" }

### Record Points
POST /api/record-points
Body: { "phone": "0812345678", "count": 5 }

## Environment Variables
- DATABASE_URL: PostgreSQL connection string
- PORT: Server port (default: 3000)
- SECRET_KEY: Session secret key

## Development
```bash
npm install
npm run dev

## ขั้นตอนการ Push to GitHub:
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/garbage-points-api.git
git push -u origin main