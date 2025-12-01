# Admin Panel Setup Guide

## Overview

The Wedding Planner application now includes an admin panel that allows administrators to monitor all weddings and users in the system.

## Features

### Currency Support
- Users can select their preferred currency in Settings
- Supported currencies include:
  - USD ($), EUR (€), GBP (£)
  - African currencies: UGX, KES, TZS, ZAR, NGN, GHS
  - Asian currencies: INR (₹), JPY (¥), CNY (¥)
  - Others: AUD (A$), CAD (C$)
- All monetary displays throughout the app will use the selected currency

### Admin Dashboard
- View all registered weddings
- See total users and wedding statistics
- Monitor upcoming vs completed weddings
- View user email addresses associated with each wedding
- Track when weddings were created
- See days remaining until upcoming weddings

## Creating the First Admin User

To create your first admin user, you need to manually insert a record into the `admin_users` table.

### Step 1: Get Your User ID

1. Log into the application with your account
2. Open browser developer tools (F12)
3. Go to Application > Local Storage
4. Find the Supabase auth token and copy your user ID

**OR** run this query in Supabase SQL Editor:

```sql
SELECT id, email FROM auth.users;
```

### Step 2: Insert Admin Record

Run this SQL command in the Supabase SQL Editor, replacing `YOUR_USER_ID` and `YOUR_EMAIL` with your actual values:

```sql
INSERT INTO admin_users (user_id, email, role, is_active)
VALUES ('YOUR_USER_ID', 'YOUR_EMAIL', 'admin', true);
```

Example:

```sql
INSERT INTO admin_users (user_id, email, role, is_active)
VALUES ('e37181c5-7ee5-4060-9890-7b05525a09e6', 'admin@weddingplanner.com', 'admin', true);
```

### Step 3: Access Admin Panel

1. Refresh your browser
2. You should now see a "Admin Panel" menu item with a shield icon in the sidebar
3. Click it to access the admin dashboard

## Adding More Admins

Once you have admin access, you can add more administrators by inserting additional records:

```sql
INSERT INTO admin_users (user_id, email, role, is_active, created_by)
VALUES (
  'NEW_ADMIN_USER_ID',
  'newadmin@weddingplanner.com',
  'admin',
  true,
  'YOUR_ADMIN_USER_ID'
);
```

## Deactivating an Admin

To remove admin privileges from a user without deleting the record:

```sql
UPDATE admin_users
SET is_active = false
WHERE user_id = 'USER_ID_TO_DEACTIVATE';
```

## Admin Permissions

Admins have the following special permissions:

- ✅ View all weddings in the system
- ✅ View all wedding members
- ✅ Access admin dashboard statistics
- ✅ See user email addresses
- ❌ Cannot modify other users' weddings (view only)

## Security Notes

- Admin status is verified on every request
- Only active admins (`is_active = true`) can access the admin panel
- RLS policies ensure data security
- Admins cannot bypass ownership rules for data modification

## Troubleshooting

### "Access Denied" Message

If you see "Access Denied" after adding yourself as admin:

1. Clear your browser cache and reload
2. Verify the admin record was inserted correctly:
   ```sql
   SELECT * FROM admin_users WHERE user_id = 'YOUR_USER_ID';
   ```
3. Ensure `is_active` is `true`
4. Log out and log back in

### Admin Panel Not Showing

1. Check that you're logged in
2. Verify admin record exists and is active
3. Check browser console for errors
4. Try refreshing the page

## Future Enhancements

Planned features for the admin panel:

- Cost tracking per wedding
- Revenue analytics
- Subscription management
- User activity logs
- System-wide statistics and reports
