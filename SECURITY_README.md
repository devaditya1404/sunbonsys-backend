# 🔐 Sunbonsys Secure Authentication System

## 🚨 IMPORTANT - Quick Setup Guide

### Step 1: Install Backend Dependencies

```bash
cd sunbonsys-backend
npm install
```

### Step 2: Create Initial Admin User

```bash
node setup-admin.js
```

**Default credentials (change after first login!):**
- Email: `admin@sunbonsys.in`
- Password: `SunbonSys2024!Secure`

### Step 3: Start Backend Server

```bash
npm start
```

### Step 4: Update .env for Production (Render)

On Render.com, set these environment variables:
- `JWT_SECRET` = (use the long secret from .env file)
- `ADMIN_EMAIL` = admin@sunbonsys.in  
- `ADMIN_PASSWORD` = SunbonSys2024!Secure
- `FRONTEND_URL` = https://sunbonsys.in
- `NODE_ENV` = production

---

## ✅ Security Features Implemented

### Backend (`server.js`)
✅ JWT token authentication  
✅ Bcrypt password hashing (10 rounds)  
✅ Rate limiting (5 attempts per 15 min)  
✅ Protected `/contacts` endpoint  
✅ Protected `/export` endpoint  
✅ Secure `/auth/login` endpoint  
✅ Admin users table with hashed passwords  

### Frontend
✅ JWT token storage  
✅ Token expiration checking  
✅ Automatic logout on token expiry  
✅ Secure API calls with Authorization headers  
✅ Protected routes via `ProtectedRoute` component  

---

## 🔒 How It Works

### 1. Login Flow

```
User enters email + password
     ↓
POST /auth/login with credentials
     ↓
Backend verifies password with bcrypt
     ↓
If valid: Generate JWT token (24h expiry)
     ↓
Frontend stores token in localStorage
     ↓
User redirected to /admin
```

### 2. Protected Routes

```
User tries to access /admin or /contacts
     ↓
Frontend checks JWT token validity
     ↓
If valid: Include "Authorization: Bearer TOKEN" header
     ↓
Backend verifies JWT signature
     ↓
If valid: Return data
If invalid: Return 401/403 error → Redirect to login
```

---

## 📁 Files Created/Modified

### Backend
- ✅ `.env` - Environment variables (JWT secret, admin credentials)
- ✅ `setup-admin.js` - Script to create initial admin user
- ✅ `.gitignore` - Protect sensitive files
- ✅ `server.js` - Added JWT auth, bcrypt, rate limiting
- ✅ `package.json` - Added security dependencies

### Frontend
- ✅ `src/services/auth.js` - Authentication service
- ✅ `.env` - API URL configuration
- ✅ `src/pages/Login.jsx` - JWT-based login
- ✅ `src/components/ProtectedRoute.jsx` - JWT validation
- ✅ `src/pages/Admin.jsx` - Secured API calls

---

## 🧪 Testing Checklist

### After Deployment:

1. **Test Login with Correct Credentials**
   - Go to `/login`
   - Enter: `admin@sunbonsys.in` / `SunbonSys2024!Secure`
   - Should redirect to `/admin`

2. **Test Login with Wrong Password**
   - Try wrong password
   - Should show error message
   - Should NOT grant access

3. **Test Protected Endpoints**
   - Try accessing `https://your-backend.com/contacts` without token
   - Should return **401 Unauthorized**

4. **Test Token Expiration**
   - Login successfully
   - Wait 24 hours (or manually delete token from localStorage)
   - Try accessing `/admin`
   - Should redirect to `/login`

5. **Test Rate Limiting**
   - Try logging in with wrong password 6 times
   - 6th attempt should be blocked with "Too many attempts" error

6. **Test Excel Export**
   - Login successfully
   - Click "Download Excel" button
   - Should download leads.xlsx with JWT authorization

---

## 🔑 Admin Credentials

**Email**: `admin@sunbonsys.in`  
**Password**: `SunbonSys2024!Secure`

⚠️ **CHANGE THESE IMMEDIATELY AFTER FIRST LOGIN!**

To change password, you'll need to:
1. Run `setup-admin.js` again with new credentials in `.env`
2. OR manually hash new password and update database

---

## 🚀 Deployment Notes

### Render.com Backend

1. Push code to GitHub
2. Set environment variables in Render dashboard:
   - `JWT_SECRET`
   - `ADMIN_EMAIL`
   - `ADMIN_PASSWORD`
   - `FRONTEND_URL`
   - `NODE_ENV=production`

3. Deploy!

4. After first deployment, SSH into Render and run:
   ```bash
   node setup-admin.js
   ```

### Frontend (Vercel/Netlify)

1. Set environment variable:
   - `VITE_API_URL=https://your-backend.onrender.com`

2. Build and deploy!

---

## 🆘 Troubleshooting

### "Invalid or expired token" error
- Token may have expired (24h limit)
- Logout and login again

### "Access denied" error  
- JWT_SECRET not set in .env
- Check backend logs for JWT authentication status

### Can't login
- Make sure setup-admin.js was run
- Check if admin user exists in database
- Verify credentials in .env match login attempt

### Rate limit hit
- Wait 15 minutes
- Or restart backend server to reset counter

---

## 📊 Security Improvements Over Previous Version

| Feature | Before | After |
|---------|--------|-------|
| Password | Hardcoded in frontend | Bcrypt hashed in DB |
| Auth Method | localStorage "admin_auth" | JWT tokens |
| Protected Endpoints | None (public) | All admin routes |
| Rate Limiting | None | 5 attempts / 15 min |
| Token Expiry | Never | 24 hours |
| Backend Validation | None | JWT signature verification |

---

## 🎯 Next Steps (Future Enhancements)

1. **Password Reset Flow** - Email-based recovery
2. **Refresh Tokens** - Auto-extend sessions
3. **2FA/MFA** - Google Authenticator integration
4. **Audit Logging** - Track all admin actions
5. **Multiple Admin Roles** - Super admin, viewer, editor
6. **Session Management** - Force logout from all devices

---

**🔐 Your backend is now secure!** 

All critical endpoints are protected with JWT authentication, passwords are hashed with bcrypt, and rate limiting prevents brute force attacks.
