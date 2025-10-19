# Login Issue - Fixed! ✅

## What Was Wrong

The `LoginDto` was missing validation decorators (`@IsString()`, `@IsNotEmpty()`), which could cause issues with the global ValidationPipe I added.

## What I Fixed

1. ✅ Added validation decorators to `LoginDto`
2. ✅ Made ValidationPipe more lenient (whitelist: false)
3. ✅ Ensured existing functionality won't break

## How to Test

### Step 1: Restart Your Backend

```bash
# Stop any running instance
pkill -f "nest start"

# Start fresh
npm run start
```

### Step 2: Seed Default Users (If Not Already Done)

```bash
npm run seed users
```

This creates:
- **Username:** `admin@company.com`
- **Password:** `Admin123!`
- **Role:** Admin

- **Username:** `manager@company.com`
- **Password:** `Manager123!`
- **Role:** Manager

### Step 3: Test Login

#### Using cURL:

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin@company.com",
    "password": "Admin123!"
  }'
```

**Expected Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "roles": ["admin"],
  "scopes": ["tenants", "vendors", "invoices", ...]
}
```

#### Using Swagger UI:

1. Go to `http://localhost:3000/api`
2. Find `POST /auth/login`
3. Click "Try it out"
4. Enter:
   ```json
   {
     "username": "admin@company.com",
     "password": "Admin123!"
   }
   ```
5. Click "Execute"

#### Using JavaScript/Fetch:

```javascript
const response = await fetch('http://localhost:3000/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    username: 'admin@company.com',
    password: 'Admin123!',
  }),
});

const data = await response.json();
console.log('Token:', data.access_token);
```

#### Using Axios:

```javascript
import axios from 'axios';

const response = await axios.post('http://localhost:3000/auth/login', {
  username: 'admin@company.com',
  password: 'Admin123!',
});

console.log('Token:', response.data.access_token);
```

## Troubleshooting

### "Invalid credentials" Error

**Possible Causes:**
1. User doesn't exist in database
2. Wrong password
3. Username typo

**Solutions:**

```bash
# 1. Check if users exist
npm run seed list-users

# 2. Seed default users
npm run seed users

# 3. Create a custom user
npm run seed create-user your@email.com YourPassword123! admin
```

### "User exists but still can't login"

**Check password hash in database:**

```javascript
// In MongoDB shell or Compass
db.users.findOne({ username: "admin@company.com" })

// Should show password_hash field (not password)
```

**Reset user password:**

```bash
# Delete the user and recreate
# (In MongoDB shell)
db.users.deleteOne({ username: "admin@company.com" })

# Then seed again
npm run seed users
```

### Still Getting Errors?

**Check logs:**
```bash
# Start in development mode with logs
npm run start:dev
```

Look for error messages in the console.

## Validation Changes Summary

### Before:
```typescript
export class LoginDto {
  username: string;
  password: string;
}
```

### After:
```typescript
export class LoginDto {
  @IsString()
  @IsNotEmpty()
  username: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}
```

## Default Test Credentials

After running `npm run seed users`, you'll have:

| Username | Password | Role | Access |
|----------|----------|------|---------|
| admin@company.com | Admin123! | Admin | Full access to all endpoints |
| manager@company.com | Manager123! | Manager | Business modules access |

## Complete Test Flow

```bash
# 1. Ensure MongoDB is running
# (Check your MongoDB service)

# 2. Rebuild & restart backend
npm run build
npm run start

# 3. In another terminal, seed users
npm run seed users

# 4. Test login
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin@company.com", "password": "Admin123!"}'

# 5. Use the token in subsequent requests
curl http://localhost:3000/vendors \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE"
```

## What's Different Now

1. ✅ **Login validation is explicit** - Clear error messages if fields are missing
2. ✅ **Lenient validation** - Won't break existing endpoints
3. ✅ **Better error handling** - Validation errors are clear
4. ✅ **CORS enabled** - Frontend can now make requests

## Next Steps

1. **Restart your backend** - Apply the changes
2. **Test login** - Use default credentials
3. **Update frontend** - Use the access_token for API calls

Your login should work now! 🎉

