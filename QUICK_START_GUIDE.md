# 🚀 Quick Start Guide: Role-Based Registration System

## What's New?

Your app now has a complete **role-based registration and admin control system** with three user types:
- **ליצן** (Clown)
- **רכז פעילות** (Activity Coordinator)  
- **מנהל מערכת** (System Admin)

---

## 🎯 Quick Test Flow

### 1️⃣ Test Clown Registration
1. Open app → "עוד לא רשום? צור חשבון חדש"
2. Choose **ליצן** role
3. Fill out form (any test data)
4. After signup, user is **pending approval**
5. User tries to login → **BLOCKED** (pending users can't login)

### 2️⃣ Test Activity Coordinator Registration
1. Open app → "עוד לא רשום? צור חשבון חדש"
2. Choose **רכז פעילות** role
3. Fill out form
4. After signup, coordinator is **pending approval**
5. Cannot login yet

### 3️⃣ Test Admin Registration (Secret!)
1. Open app → "עוד לא רשום? צור חשבון חדש"
2. Choose **מנהל מערכת** role
3. **Enter admin code: `1234`** ← Required!
4. Fill out form
5. After signup, admin is **auto-approved**
6. **Admin can login immediately** ✅

### 4️⃣ Test Admin Dashboard
1. Login as admin (use test admin details if available)
2. Navigate to **ניהול** (Admin tab)
3. See **Pending Clowns** tab → Shows clowns waiting approval
4. Click **אישור** to approve a clown
5. Approved clown can now login!

---

## 🔑 Test Credentials

### Admin User (Pre-existing)
- **Phone**: 0529250237
- **Name**: עמוס סגרון
- **Password**: 112233
- **Role**: Admin
- **Status**: Auto-approved

### Admin Code (for new admin registration)
- **Code**: `1234`
- **Used**: During registration for admin role
- **Attempts**: 3 before lockout

---

## 📊 User Status Flow

```
┌─────────────────────┐
│  User Registration  │
└──────────┬──────────┘
           ↓
    ┌──────────────┐
    │ Choose Role  │
    └──┬───┬────┬──┘
       │   │    │
   ┌───▼┐┌─▼──┐┌▼───┐
   │Clown││Coord││Admin│
   └───┬┘└─┬──┘└┬───┘
       │   │    │
   ┌───▼───▼──┐ │
   │ Pending  │ │
   │Approval  │ │
  ┌▼──────────▼─▼─────┐
  │  Admin Reviews    │
  │  Dashboard       │
  └──┬────────────┬───┘
     ↓            ↓
   ✅             ❌
  Approve        Reject
     ↓            ↓
  Active       Blocked
```

---

## ✨ Key Features Implemented

### ✅ Role Selection Screen
- Clean UI with 3 role options
- Each role has description
- Checkmark on selection

### ✅ Admin Code Verification  
- Special screen for admin registration
- Code: `1234` (changeable)
- 3-attempt limit with lockout

### ✅ Activity Filtering
- **Admins**: See ALL activities
- **Coordinators**: See all activities  
- **Clowns**: See ONLY approved activities

### ✅ Admin Dashboard
- **Pending Clowns Tab**
  - Approve/Reject clowns
  - Shows registration date
  - Shows preferred area
  
- **Pending Activities Tab**  
  - View pending activities
  - Framework for approve/reject (can enhance)

### ✅ Data Model Updates
- User has: `approvalStatus`, `approvedBy`, `approvedAt`, `registrationDate`
- Activity has: `approvalStatus`, `approvedBy`, `approvedAt`, `rejectionReason`

---

## 🔧 How to Test Each Role

### Clown Flow
```
1. Signup as ليצן
   ↓
2. Get pending status (check Firestore)
   ↓
3. Admin approves in dashboard
   ↓
4. Clown can login
   ↓
5. Clown sees only approved activities
```

### Coordinator Flow
```
1. Signup as רכז פעילו��
   ↓
2. Get pending status
   ↓
3. Admin approves in dashboard
   ↓
4. Coordinator can login
   ↓
5. Coordinator can create activities (pending status)
   ↓
6. Admin approves activity in dashboard
   ↓
7. Activity visible to clowns
```

### Admin Flow
```
1. Signup as מנהל מערכת
   ↓
2. Enter admin code: 1234
   ↓
3. Get auto-approved status
   ↓
4. Admin can login immediately
   ↓
5. Can access admin dashboard
   ↓
6. Can approve/reject other users
```

---

## 🐛 Testing Checklist

- [ ] Clown signup → pending status
- [ ] Coordinator signup → pending status  
- [ ] Admin signup (with code) → approved immediately
- [ ] Wrong admin code → error message + attempt counter
- [ ] Admin dashboard accessible only to admins
- [ ] Pending clowns listed in dashboard
- [ ] Can approve clown → moves to users collection
- [ ] Approved clown can login
- [ ] Rejected clown cannot login
- [ ] Clown sees only approved activities
- [ ] Admin sees all activities
- [ ] Coordinator sees all activities

---

## 📝 Firestore Collections

After testing, check your Firestore:

### `users` Collection
- ID: User's Auth UID
- Fields: name, role, approvalStatus, approvedBy, approvedAt, etc.

### `pending_clowns` Collection  
- ID: Auto-generated
- Contains: Users waiting for approval
- Fields: name, phone, email, role, etc.

### `activities` Collection
- ID: Auto-generated
- Fields: title, institution, approvalStatus, approvedBy, etc.

---

## 🚀 Next Steps After Testing

1. **Change Admin Code**
   - File: `app/(auth)/admin-code.tsx`, line 7
   - Change `ADMIN_CODE` from `1234` to secure value
   - Move to Firebase Remote Config for production

2. **Update Firestore Rules**
   - Add rules to enforce role-based access
   - Only admins can read pending_clowns
   - Only owners can update their activities

3. **Enable All Features**
   - Complete activity approval buttons
   - Add rejection reason field
   - Add email notifications

4. **Testing in Production**
   - Deploy to TestFlight/Google Play
   - Create test accounts for all 3 roles
   - Verify approval workflow works end-to-end

---

## 💡 Pro Tips

1. **Speed up testing** - Create multiple test accounts and admin-approve them quickly
2. **Check logs** - Look at browser console and Firestore logs if issues occur
3. **Use Firestore console** - View pending_clowns and users collections in real-time
4. **Test on both iOS & Android** - Admin dashboard works on both
5. **Keep admin code safe** - Don't commit to version control, use env variables

---

## ⚡ Troubleshooting

### Admin Dashboard Not Showing
- **Check**: Is user's role = `admin` in Firestore?
- **Check**: Is user's approvalStatus = `approved`?
- **Fix**: Manually update Firestore document

### Pending Clowns Not Showing
- **Check**: Did clown complete registration?
- **Check**: Is clown in `pending_clowns` collection?
- **Fix**: Refresh dashboard or restart app

### Admin Code Not Working
- **Check**: Did you enter code correctly? (default: `1234`)
- **Check**: Did you exceed 3 attempts?
- **Fix**: Wait or restart app to reset attempt counter

### Can't Login After Approval
- **Check**: Is user's approvalStatus = `approved` in Firestore?
- **Check**: Is user in `users` collection (not `pending_clowns`)?
- **Fix**: Manually update Firestore or re-approve user

---

## 📞 Support

For issues or questions:
1. Check `ROLE_BASED_REGISTRATION_COMPLETE.md` for detailed docs
2. Check `ADMIN_DOCUMENTATION.md` for admin features
3. Review Firestore console for data issues
4. Check browser console for error messages

---

**✅ Ready to test? Go to Login screen and click "צור חשבון חדש"!**
