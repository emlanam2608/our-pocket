# House-Scoped Transactions Migration Guide

## Overview

This guide documents the process to migrate transactions and assets from root-level Firestore collections to house-scoped subcollections.

**Branch:** `feature/house-scoped-transactions`

**Commit:** 707905f

## Schema Changes

### Before
```
/transactions/{id}
/assets/{id}
/fcmTokens/{token}  ← unchanged
```

### After
```
/houses/{houseId}
  /members/{uid}
  /transactions/{id}  ← houseId field required
  /assets/{id}        ← houseId field required
/fcmTokens/{token}  ← unchanged
```

## Changes Made

### 1. TypeScript Types
- **File:** `src/lib/constants.ts`
- **Changes:**
  - Added `houseId: string` to `Transaction` interface
  - Added `houseId: string` to `AssetEntry` interface

### 2. Data Access Hooks
- **Files:** `src/hooks/useTransactions.ts`, `src/hooks/useAssets.ts`
- **Changes:**
  - Both hooks now require `houseId` as first parameter
  - Query paths changed from `collection(db, 'transactions')` to `collection(db, 'houses', houseId, 'transactions')`
  - All CRUD functions (`addTransaction`, `updateTransaction`, `deleteTransaction`, `addAssetEntry`, `updateAssetEntry`, `deleteAssetEntry`) require `houseId` parameter
  - Added early return if `houseId` is not provided (returns empty data)

### 3. Firestore Security Rules
- **File:** `firestore.rules`
- **Changes:**
  - Added helper function `isHouseMember(houseId)` to validate membership
  - Restructured all rules to use `houses/{houseId}/...` paths
  - All transaction/asset operations now require membership via `houses/{houseId}/members/{uid}`
  - Documents must include `houseId` field matching the collection path

### 4. Cloud Functions
- **File:** `functions/src/index.ts`
- **Changes:**
  - Updated `onTransactionCreated` trigger path from `transactions/{transactionId}` to `houses/{houseId}/transactions/{transactionId}`
  - Added new `migrateToHouse()` callable Cloud Function:
    - Safely migrates data from root collections to house subcollections
    - Supports dry-run mode (no database writes)
    - Batches documents in groups of 100
    - Skips already-migrated documents (idempotent)
    - Validates house exists and user has membership

### 5. Firestore Indexes
- **File:** `firestore.indexes.json`
- **Changes:**
  - Added composite index: `createdBy + timestamp` for transactions
  - Added composite index: `type + timestamp` for assets
  - Indexes support house-scoped collectionGroup queries

### 6. UI Components
- **Files:**
  - `src/app/page.tsx`
  - `src/components/transaction/TransactionForm.tsx`
  - `src/components/assets/AssetForm.tsx`
  - `src/components/assets/AssetsList.tsx`
  - `src/components/assets/FundsList.tsx`

- **Changes:**
  - Added `houseId` prop to all transaction/asset components
  - Main page now manages `currentHouseId` state with localStorage persistence
  - All hooks called with `houseId` parameter
  - All CRUD function calls include `houseId` as first argument

## Migration Steps

### Phase 1: Preparation (Before Deployment)

#### 1.1 Review Changes
```bash
git log --oneline feature/house-scoped-transactions -1
git diff main feature/house-scoped-transactions
```

#### 1.2 Build Verification
```bash
npm run build  # Should succeed with no errors
```

#### 1.3 Create Firestore Houses Collection
In Firebase Console, create the initial house document structure:

```javascript
// Create default house
db.collection('houses').doc('default-house').set({
  name: 'My House',
  owner: '{currentUserId}',
  createdAt: new Date(),
  updatedAt: new Date()
})

// Add members collection
db.collection('houses').doc('default-house').collection('members').doc('{currentUserId}').set({
  role: 'owner',
  addedAt: new Date()
})
```

Or use the Firebase Admin SDK:
```bash
# In functions directory:
npm run deploy  # Deploys new migrateToHouse function
```

### Phase 2: Firestore Configuration

#### 2.1 Deploy New Security Rules
```bash
firebase deploy --only firestore:rules
```

**Important:** This will only allow operations on house-scoped collections. After deployment:
- Old root-level collection operations will be blocked
- Ensure all users have entries in `houses/default-house/members/{uid}` before deployment

#### 2.2 Deploy Cloud Functions
```bash
cd functions
npm run deploy
cd ..
```

This deploys:
- Updated `onTransactionCreated` trigger (new path)
- New `migrateToHouse()` callable function

#### 2.3 Create Firestore Indexes
```bash
firebase deploy --only firestore:indexes
```

Wait for indexes to build (check Firebase Console → Firestore → Indexes).

### Phase 3: Data Migration

#### 3.1 Backup Current Data (Recommended)
Export current collections from Firebase Console:
- Firestore → Backup & Restore → Create Backup
- Or use Admin SDK to export JSON

#### 3.2 Run Dry-Run Migration
**Test first without making changes:**

Option A: From Firebase Console (Functions tab):
```
Function: migrateToHouse
Data: {
  "houseId": "default-house",
  "dryRun": true
}
```

Option B: From app (browser console):
```javascript
const migrate = firebase.functions().httpsCallable('migrateToHouse');
const result = await migrate({ 
  houseId: 'default-house', 
  dryRun: true 
});
console.log(result.data);
// Output example:
// {
//   success: true,
//   message: "Dry run completed",
//   transactionsMigrated: 150,
//   transactionsSkipped: 0,
//   assetsMigrated: 25,
//   assetsSkipped: 0,
//   dryRun: true
// }
```

**Verify the numbers match your expectations.**

#### 3.3 Run Actual Migration
When satisfied with dry-run results:

```javascript
const result = await migrate({ 
  houseId: 'default-house', 
  dryRun: false  // ← Important: set to false
});
console.log('Migration complete:', result.data);
```

**This will:**
- Copy all documents from `/transactions` to `/houses/default-house/transactions`
- Copy all documents from `/assets` to `/houses/default-house/assets`
- Add `houseId` field to each migrated document
- Skip any already-migrated documents

### Phase 4: Client Deployment

#### 4.1 Switch to Feature Branch (Optional)
```bash
git checkout feature/house-scoped-transactions
```

#### 4.2 Deploy Frontend
```bash
npm run build
# Then deploy via your CI/CD (Vercel, Firebase Hosting, etc.)
```

#### 4.3 Verify in Production
- Create a new transaction
- Verify it appears in the app
- Check Firestore console: should be at `/houses/default-house/transactions/{id}`
- Should NOT appear in old `/transactions` collection

### Phase 5: Cleanup (Optional, After Verification)

#### 5.1 Read-Only Mode for Old Collections (Safe Period)
Keep old collections for 1-2 weeks in read-only mode:
```
match /transactions/{docId} {
  allow read: if request.auth != null;  // Read-only
  allow write: if false;  // Blocked
}
```

#### 5.2 Delete Old Collections (Final Step)
After confirming all data is migrated and working properly:
```bash
firebase firestore:delete transactions --recursive
firebase firestore:delete assets --recursive
```

Or via Firebase Console → Firestore → Collections → Delete

## Rollback Plan

### If Something Goes Wrong

#### 1. Revert Firebase Rules
```bash
git checkout main firestore.rules
firebase deploy --only firestore:rules
```

#### 2. Revert Cloud Functions
```bash
# Remove the migrateToHouse function from functions/src/index.ts
# or redeploy from main branch
git checkout main functions/src/index.ts
cd functions
npm run deploy
cd ..
```

#### 3. Restore from Backup
If data was corrupted:
- Use Firebase Console → Backup & Restore → Restore Backup
- Or manually restore exported JSON

#### 4. Revert App
```bash
git checkout main src/
npm run build
# Deploy the reverted app
```

## Verification Checklist

After migration is complete, verify:

- [ ] Dry-run migration shows correct document counts
- [ ] Actual migration completes without errors
- [ ] Firebase Console shows documents in `/houses/default-house/transactions` and `assets`
- [ ] App loads successfully (no errors in console)
- [ ] Creating new transaction goes to house subcollection
- [ ] Editing existing transaction works
- [ ] Deleting transactions/assets works
- [ ] Asset forms work correctly
- [ ] House selector persists in localStorage
- [ ] All transactions/assets visible for the current house
- [ ] Security rules prevent access from non-members (test with another account if possible)

## Important Notes

### Membership Validation
The new security rules check `houses/{houseId}/members/{uid}` for access.

**Before deploying rules, ensure:**
1. At least one user document exists in `houses/default-house/members/`
2. That user is the one testing the app

### houseId Field
All migrated documents will have `houseId` field added automatically by the migration function.

**Do NOT manually edit this field** — it must match the subcollection path.

### Batching
The migration function batches operations in groups of 100 documents.

**For large datasets (>10,000 documents):**
- Migration may take several minutes
- Use `dryRun: true` first to estimate time
- Ensure Cloud Function memory/timeout is sufficient (default: 512MB, 540 seconds)

### Multi-House Support
Current implementation uses `"default-house"` for all users.

**To support multiple houses:**
1. Add house creation/management UI
2. Store `currentHouseId` in user profile instead of localStorage
3. Add house switcher in header
4. Extend rules to support house invitations

## Timeline

**Recommended timeline:**
- T+0: Prepare (backup, review code)
- T+1: Deploy rules & functions
- T+2: Run dry-run migration (verify numbers)
- T+3: Run actual migration
- T+4: Deploy app to production
- T+5-7: Monitor for issues
- T+14: Delete old collections (if everything stable)

## Support

If you encounter issues during migration:

1. Check Firebase Console logs for function errors
2. Verify Firestore rules in the Rules Simulator
3. Check browser console for app errors
4. Review document structure in Firestore (should have `houseId` field)
5. Confirm user has entry in `houses/{houseId}/members/{uid}`

---

**Status:** ✅ Code ready for deployment
**Branch:** `feature/house-scoped-transactions`
**Build:** ✅ Verified successful
