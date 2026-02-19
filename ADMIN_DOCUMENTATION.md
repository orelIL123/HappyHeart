# 👨‍💼 Admin Dashboard & Controls

## Overview
Admin dashboard provides centralized management of users and activities. Only users with `role === 'admin'` can access these features.

## Accessing the Admin Dashboard

**Navigation Path**: `app/(tabs)/admin.tsx`

The admin dashboard is accessible through the tabs navigation and only displays for authorized admins.

---

## 🎛️ Admin Features

### 1. Pending Clowns Management

#### View Pending Clowns
- See all clowns awaiting approval
- Display includes:
  - Name
  - Phone number
  - Registration date
  - Preferred area

#### Approve Clown
- Click "אישור" (Approve) button
- Clown is moved from `pending_clowns` collection to `users` collection
- Clown status becomes `approved`
- Clown can now login and access the app

#### Reject Clown
- Click "דחייה" (Reject) button
- Confirmation dialog appears
- Clown record is deleted from `pending_clowns`
- Clown cannot access the app

### 2. Pending Activities Management

#### View Pending Activities
- See all activities awaiting approval
- Display includes:
  - Activity title
  - Institution name
  - Location
  - Description
  - Required number of clowns
  - Activity time

#### Activity Status Indicators
- 🟡 **Pending**: Activity awaiting admin review
- 🟢 **Approved**: Activity is live and visible to clowns
- 🔴 **Rejected**: Activity was rejected and not visible

#### Approve Activity
*(Coming soon - button framework in place)*
- Activity becomes visible to clowns
- Clowns can join the activity
- Organizer is notified of approval

#### Reject Activity
*(Coming soon - button framework in place)*
- Activity is marked as rejected
- Activity not visible to clowns
- Organizer is notified of rejection with reason

---

## 📊 Role-Based Activity Visibility

### Admin View
- ✅ See ALL activities (pending, approved, rejected)
- ✅ Manage pending items
- ✅ Access admin controls

### Coordinator/Organizer View
- ✅ See ALL activities (their own and others')
- ❌ Cannot access admin dashboard
- ❌ Cannot approve other organizers' activities

### Clown View
- ✅ See ONLY approved activities
- ❌ Cannot see pending or rejected activities
- ❌ Cannot access admin features

---

## 🔐 Admin-Only Endpoints

The following operations require `role === 'admin'`:

1. **Approve Clown**
   - `firebaseService.approveClown(clown)`
   - Moves user from pending_clowns to users collection

2. **Reject Clown**
   - `firebaseService.rejectClown(clownId)`
   - Deletes user from pending_clowns collection

3. **Approve Activity**
   - `firebaseService.approveActivity(activityId, adminId)`
   - Sets `approvalStatus: 'approved'`
   - Records admin approval

4. **Reject Activity**
   - `firebaseService.rejectActivity(activityId, adminId, reason)`
   - Sets `approvalStatus: 'rejected'`
   - Records rejection reason

---

## 📋 Admin Dashboard Layout

```
┌─────────────────────────────────────┐
│  Header: "ניהול מערכת"               │
├─────────────────────────────────────┤
│ [👥 ליצנים (5)]  [📋 פעילויות (3)]  │  ← Tabs with counts
├─────────────────────────────────────┤
│                                     │
│  ┌──────────────────────────────┐  │
│  │ ליצן: שם                    │  │
│  │ 050-1234567                 │  │
│  │ 📍 אזור מועדף: מרכז        │  │
│  │ [אישור] [דחייה]              │  │
│  └────────���─────────────────────┘  │
│                                     │
│  (More cards...)                    │
│                                     │
└─────────────────────────────────────┘
```

---

## 🔔 Admin Notifications

When items require approval:
1. Admin sees count in tab badge
2. Dashboard loads pending items
3. Admin can process them one by one

---

## 🛡️ Security Measures

1. **Role Verification**
   - Dashboard checks `currentUser.role === 'admin'`
   - Shows error screen if not admin

2. **Firestore Rules**
   - Only admins can read `pending_clowns`
   - Only admins can update activity `approvalStatus`
   - Prevents unauthorized access at database level

3. **Audit Trail**
   - `approvedBy` field records which admin approved
   - `approvedAt` field records when approval happened
   - `rejectionReason` field records why item was rejected

---

## 🚀 Advanced Admin Features (Future)

These features are planned for future releases:

1. **Bulk Operations**
   - Approve/reject multiple items at once
   - Export activity reports

2. **User Management**
   - Change user roles
   - Suspend/enable accounts
   - View user activity history

3. **Activity Management**
   - Edit activity details
   - Change activity status
   - Cancel activities with reason

4. **Analytics**
   - Admin dashboard stats
   - Activity completion rates
   - User engagement metrics

5. **Notifications**
   - Send admin messages to users
   - Mass notifications for events
   - Scheduled announcements

---

## 📝 Admin Checklist

When onboarding a new admin:

- [ ] Confirm admin has correct role in Firestore
- [ ] Confirm admin code was used during registration
- [ ] Test admin can access dashboard
- [ ] Test admin can approve clowns
- [ ] Test admin can view pending activities
- [ ] Confirm other users cannot access admin features
- [ ] Set up admin code rotation schedule
- [ ] Document admin in system notes

---

## 🐛 Troubleshooting

### Dashboard Not Loading
- Check user role is `admin` in Firestore
- Check Firestore Rules allow admin access
- Check browser console for errors

### Cannot Approve Clown
- Verify clown is in `pending_clowns` collection
- Check Firestore Rules for write permissions
- Verify admin has correct role

### Pending Items Count Wrong
- Wait a moment for real-time sync
- Refresh the page
- Check Firestore filter logic

### Admin Code Not Working
- Check exact admin code (default: `1234`)
- Verify code is entered correctly
- Check attempt limit (3 tries, then lockout)

---

## 📞 Admin Support

For admin-related issues:
1. Check the admin dashboard error messages
2. Review Firestore console for data issues
3. Verify user roles and permissions
4. Check admin code is correct
5. Review audit trail (approvedBy, approvedAt fields)
