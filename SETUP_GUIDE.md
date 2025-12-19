# Wedding Planning System - Setup Guide

## Quick Start

### Step 1: Supabase Setup

1. **Create a Supabase Project**
   - Go to [supabase.com](https://supabase.com)
   - Create a new project
   - Wait for the database to be provisioned

2. **Get Your Credentials**
   - Go to Project Settings > API
   - Copy your `Project URL`
   - Copy your `anon/public` key

3. **Database Migration**
   - The migration has already been applied
   - Your database tables are ready with proper RLS policies

### Step 2: Local Environment Setup

1. **Clone and Install**
   ```bash
   npm install
   ```

2. **Configure Environment Variables**

   Create a `.env` file in the root directory:
   ```bash
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```

3. **Start Development Server**
   ```bash
   npm run dev
   ```

4. **Open in Browser**
   - Navigate to `http://localhost:5173`
   - You should see the registration/login page

### Step 3: First Wedding Setup

1. **Register an Account**
   - Click "Sign Up"
   - Enter your email and password
   - Fill in wedding details:
     - Bride's name
     - Groom's name
     - Wedding date
     - Expected number of guests
   - Click "Create Account & Start Planning"

2. **Explore the Dashboard**
   - You'll see the main dashboard with real-time metrics
   - All values start at zero

3. **Set Up Your Budget**
   - Click "Budget" in the sidebar
   - You'll see 8 pre-created budget sections
   - Click "Add Item" on any section
   - Fill in item details:
     - Item name (e.g., "Wedding Venue")
     - Quantity
     - Unit cost
     - Amount paid (if any)
   - For items that depend on guest count:
     - Check "Guest Dependent"
     - Set multiplier per guest (e.g., 1 for meals)

4. **Add Pledges**
   - Click "Pledges" in the sidebar
   - Click "Add Pledge"
   - Enter contributor information:
     - Name
     - Contact details (optional)
     - Amount pledged
     - Amount paid (if received)
     - Payment method
   - Track payments over time

5. **Monitor Progress**
   - Return to Dashboard
   - See real-time updates of:
     - Total budget vs. paid
     - Pledge fulfillment
     - Cash at hand
     - Outstanding amounts

## Database Schema Overview

### Main Tables Created

1. **weddings** - Your wedding information
2. **budget_sections** - 8 default sections for organizing budget
3. **budget_items** - Individual line items in your budget
4. **pledges** - Financial contributions from supporters
5. **payments** - Payment transaction history
6. **service_providers** - Vendor information (coming soon)
7. **agenda_items** - Event schedules (coming soon)
8. **guests** - Guest list and RSVPs (coming soon)
9. **wedding_members** - Team members who can access your wedding
10. **subscriptions** - Billing history (for future subscription feature)

### Security Features

All tables have Row Level Security (RLS) enabled:
- You can only see your own wedding data
- Team members you invite can access based on their role
- Data is completely isolated between weddings

## Key Concepts

### Guest-Dependent Budget Items

This is the most powerful feature for wedding planning:

**Example: Wedding Meals**
- Expected Guests: 500
- Guest Multiplier: 1 (one meal per guest)
- Unit Cost: $80,000
- **Auto-calculated Quantity**: 500 × 1 = 500
- **Auto-calculated Amount**: 500 × $80,000 = $40,000,000

**When you change expected guests to 600:**
- Quantity updates to: 600
- Amount updates to: $48,000,000
- Balance recalculates automatically

**Works for:**
- Food per person
- Drinks per person
- Party favors
- Seating
- Invitations
- Anything that scales with guest count

### Budget Status Tracking

Budget items automatically get status:
- **Pending**: Not yet paid
- **Partial**: Some payment made
- **Covered**: Fully paid

### Pledge Fulfillment

Track financial commitments:
- Record promises from family/friends
- Track actual payments
- Monitor outstanding amounts
- See fulfillment rates

## Troubleshooting

### Can't see any data?

Make sure you're logged in with the account that created the wedding.

### Database errors?

Verify your `.env` file has the correct Supabase credentials.

### Guest count not updating budget?

Only items marked as "Guest Dependent" will auto-update. Edit the item and check the "Guest Dependent" checkbox.

### Build errors?

Run:
```bash
npm install
npm run build
```

If errors persist, delete `node_modules` and `package-lock.json`, then reinstall.

## Production Deployment

### Build for Production

```bash
npm run build
```

This creates optimized files in the `dist/` directory.

### Deploy Options

**Recommended Platforms:**
- Vercel (easiest)
- Netlify
- AWS Amplify
- Cloudflare Pages

**Environment Variables:**
Make sure to set these in your hosting platform:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

## Next Steps

1. **Add more budget items** across all sections
2. **Record all pledges** from supporters
3. **Update guest count** as RSVPs come in
4. **Track payments** as they're received
5. **Invite team members** to help manage (coming soon)
6. **Complete vendor section** with service providers (coming soon)

## Tips for Best Results

1. **Start Early**: Set up your budget as soon as possible
2. **Be Detailed**: Break down costs into specific items
3. **Use Guest Dependencies**: Mark appropriate items to auto-scale
4. **Update Regularly**: Keep pledge and payment info current
5. **Check Dashboard Daily**: Monitor your progress
6. **Adjust Guest Count**: Update as you get more RSVPs

## Support

If you encounter any issues:
1. Check this guide first
2. Verify your Supabase connection
3. Check browser console for errors
4. Ensure you're using a modern browser

---

Happy planning! 🎉
