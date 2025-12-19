# Wedding Planning System

A complete digital wedding planning platform with budget management, pledge tracking, guest management, and vendor coordination.

## Features

### Core Functionalities

- **Multi-Tenant Architecture**: Each wedding is isolated with role-based access control
- **User Authentication**: Secure email/password authentication with Supabase
- **Wedding Registration**: Users can register their weddings with date and expected guest count
- **Subscription Ready**: Infrastructure built to support future subscription tiers

### Budget Management

- **Dynamic Budget System**: Automatically recalculates based on guest count
- **Guest-Dependent Items**: Items that scale with guest count (e.g., meals, drinks)
- **Budget Sections**:
  - Church & Ceremony
  - Groom & Bridal Items
  - Decorations & Venue
  - Food & Drinks
  - Entertainment
  - Media & Transport
  - Miscellaneous
  - Launch Event
- **Real-Time Calculations**: Automatic calculation of amounts, balances, and coverage percentages
- **Status Tracking**: Track payment status (pending, partial, covered)

### Pledge Management

- **Contributor Tracking**: Record pledges from family, friends, and supporters
- **Payment Tracking**: Track pledged amounts vs. actual payments
- **Contact Information**: Store phone numbers and emails for follow-up
- **Payment Methods**: Support for cash, mobile money, bank transfers, checks
- **Status Dashboard**: View total pledges, payments received, and outstanding amounts

### Dashboard Analytics

Real-time metrics including:
- Total Budget vs. Paid vs. Balance
- Budget coverage percentage
- Pledges vs. actual payments
- Cash at hand
- Budget per guest
- Outstanding payments and pledges

### Additional Modules

- **Guest Management**: Track RSVPs, dietary restrictions, and table assignments
- **Vendor Management**: Manage service providers and contracts
- **Agenda Management**: Plan committee meetings, launch events, and wedding day schedules
- **Settings**: Update wedding details and preferences

## Technology Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Icons**: Lucide React

## Database Schema

### Tables

1. **weddings**: Core wedding information
2. **wedding_members**: Committee members and collaborators
3. **budget_sections**: Budget category groupings
4. **budget_items**: Individual budget line items with guest-dependent calculations
5. **pledges**: Financial pledges and contributions
6. **payments**: Payment transaction records
7. **service_providers**: Vendor information and contracts
8. **agenda_items**: Meeting and event schedules
9. **guests**: Guest list with RSVP tracking
10. **subscriptions**: Subscription and billing history

### Security

- Row Level Security (RLS) enabled on all tables
- Users can only access weddings they own or are members of
- Role-based permissions (owner, admin, committee_member, viewer)

## Setup Instructions

### Prerequisites

- Node.js 18+ installed
- Supabase account
- Supabase project created

### Environment Setup

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Add your Supabase credentials to `.env`:
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

3. The database schema has been applied via migrations. Your tables are ready to use.

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Build for production:
   ```bash
   npm run build
   ```

## Usage

### First Time Setup

1. **Register**: Create an account and register your wedding
   - Provide bride and groom names
   - Set wedding date
   - Enter expected guest count

2. **Set Up Budget**: Navigate to Budget section
   - Budget sections are pre-created
   - Add budget items to each section
   - Mark items as guest-dependent if they scale with guest count

3. **Track Pledges**: Navigate to Pledges section
   - Add contributors and their pledged amounts
   - Record payments as they come in
   - Track outstanding balances

4. **Monitor Dashboard**: View real-time analytics
   - Overall budget status
   - Pledge fulfillment rates
   - Outstanding amounts

### Dynamic Guest Calculations

When you update the expected guest count:
1. Go to Budget Management
2. Update the "Expected Guests" field
3. All guest-dependent items automatically recalculate:
   - Quantity = Expected Guests × Guest Multiplier
   - Amount = New Quantity × Unit Cost
   - Balance updates accordingly

### Budget Item Types

**Regular Items**: Fixed quantity (e.g., venue rental, photographer)
- Set quantity manually
- Amount = Quantity × Unit Cost

**Guest-Dependent Items**: Scale with guest count (e.g., meals, drinks)
- Check "Guest Dependent" option
- Set multiplier per guest (usually 1.0)
- Quantity auto-calculates: Guests × Multiplier
- Perfect for catering, beverages, party favors, etc.

## Key Features Explained

### Multi-Tenancy

Each wedding operates independently:
- Data is isolated by wedding_id
- Users can potentially manage multiple weddings
- Committee members can be invited with specific roles

### Role-Based Access

- **Owner**: Full control over wedding data
- **Admin**: Can manage budget, pledges, and members
- **Committee Member**: Can view and contribute
- **Viewer**: Read-only access

### Subscription Infrastructure

Built-in support for future monetization:
- Free trial period (14 days default)
- Subscription status tracking
- Payment history
- Easy to integrate payment providers

## Future Enhancements

Planned features for future versions:
- Complete guest management with RSVP forms
- Vendor contract management
- Payment reminders and notifications
- Email/SMS integration
- Document storage
- Timeline and checklist
- Budget vs. actual reporting
- Export to PDF/Excel
- Mobile app
- Multi-language support

## Support

For issues or questions, please refer to the documentation or contact support.

## License

Proprietary - All rights reserved
