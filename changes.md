# Recent Changes

## Cron Jobs Removed (Vercel Paid Feature)
- **Date**: September 6, 2026
- **Status**: ✅ REMOVED
- **Description**: Removed all cron job functionality as it requires Vercel Pro ($20/month)
- **Files Deleted**:
  - `/api/cron/generate-pick.ts` - Daily pick generation (was scheduled 6 AM UTC)
  - `/api/cron/settle-games.ts` - Game settlement every 2 hours
  - `/src/integrations/supabase/cron-auth.ts` - Cron authentication helper
- **Files Modified**:
  - `/vercel.json` - Removed `crons` configuration array
  - `/.env` - Removed `CRON_SECRET` environment variable
  - `/api/picks/generate.ts` - Removed cron secret verification
  - `/api/picks/settle.ts` - Removed cron secret verification
- **Notes**: These endpoints are now manual-only. Can be called directly via HTTP POST if needed for testing/admin purposes.

## Bankroll Configuration Verified & Tested
- **Date**: September 6, 2026
- **Status**: ✅ VERIFIED & CLEANED UP
- **Description**: 
  - **Bankroll**: NGN1000 starting amount ✅
  - **Stake**: NGN10 per bet ✅
  - Tested history section with 10 dummy picks (now removed)
- **Confirmed Files**: 
  - `/src/lib/picks.functions.ts` - STARTING_BANKROLL = 1000 NGN, STAKE = 10 NGN

## Mobile Responsive & Collapsible Sidebar Implementation
- **Date**: September 6, 2026
- **Status**: ✅ COMPLETED & FIXED
- **Description**: 
  - Implemented fully responsive mobile design
  - Added collapsible sidebar with hamburger menu
  - Sidebar auto-closes on mobile when navigating
  - Smooth CSS animations (300ms transitions)
  - Mobile overlay backdrop behind sidebar
- **Bug Fixed**:
  - ❌ Was importing `useMobile` (non-existent)
  - ✅ Fixed to import `useIsMobile` (correct export from hook)
- **Files Modified**:
  - `/src/routes/dashboard.tsx` - Fixed import, added responsive layout
  - `/src/routes/dashboard/index.tsx` - Applied responsive design
  - `/src/hooks/use-mobile.tsx` - Confirmed export is `useIsMobile`
- **Responsive Breakpoints**:
  - **Mobile (< 768px)**: Single column, hamburger menu, sidebar hidden
  - **Tablet/Desktop (≥ 768px)**: Multi-column, sidebar always visible
- **Features**:
  - ✅ Collapsible sidebar with smooth slide animation
  - ✅ Hamburger menu (mobile only)
  - ✅ Auto-close sidebar on route change
  - ✅ Semi-transparent overlay backdrop
  - ✅ Responsive typography and spacing
  - ✅ Responsive grid layout
  - ✅ Mobile header bar
  - ✅ Text truncation for long content
