# Recent Changes

## Bankroll Configuration Verified & Tested
- **Date**: September 6, 2026
- **Status**: ✅ VERIFIED & CLEANED UP
- **Description**: 
  - **Bankroll**: NGN1000 starting amount ✅
  - **Stake**: NGN10 per bet ✅
  - Tested history section with 10 dummy picks (now removed)
- **Confirmed Files**: 
  - `/src/lib/picks.functions.ts` - STARTING_BANKROLL = 1000 NGN, STAKE = 10 NGN
- **Testing**: 
  - Seeded 10 dummy picks to verify history UI works correctly
  - Tested with mix of WON, LOST, and PUSH statuses
  - Verified profit calculations working as expected
  - All dummy data removed and cleaned up
