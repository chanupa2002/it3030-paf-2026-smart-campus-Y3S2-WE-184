# UniNode

Smart Campus Operations Hub is our paf module project

## Supabase PostgreSQL setup (backend)

### 1) Use these connection values

- Host: `aws-1-ap-northeast-1.pooler.supabase.com`
- Port: `5432`
- Database: `postgres`
- User: `postgres.bmbzkvvedompxxonjdoi`

### 2) Configure `backend/.env`

Set your values in `backend/.env`:

```env
DB_URL=jdbc:postgresql://aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres?sslmode=require
DB_USER=postgres.bmbzkvvedompxxonjdoi
DB_PASSWORD=<YOUR_SUPABASE_DB_PASSWORD>
DB_POOL_MAX=10
DB_POOL_MIN_IDLE=1
```

### 3) Start backend

```powershell
cd backend
mvn spring-boot:run
```

### Notes

- Do not commit real DB passwords.
- A starter migration file exists at:
  `backend/src/main/resources/db/migration/V1__init.sql`
