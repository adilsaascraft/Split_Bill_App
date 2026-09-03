# Migration notes — phases 1–3

The model changes in this pass are **additive at the schema level** but two
fields changed shape, so existing documents in a live database need a
one-time migration before the new API routes will work against old data:

1. **`Expense.date`** (string `'yyyy-MM-dd'`) → **`Expense.expenseDate`** (real `Date`) + **`Expense.billingPeriodId`** (ref).
   For each existing expense: parse `date` as an IST calendar day, convert
   to the UTC instant via `fromIST`, write it to `expenseDate`, then call
   `getOrCreateBillingPeriod(expenseDate)` to backfill `billingPeriodId`.

2. **`Expense.category`** (string enum) → **`Expense.categoryId`** (ref to new `Category` collection).
   Run a one-time seed of `DEFAULT_CATEGORIES` from `lib/models/Category.ts`,
   then map each expense's old category string to the matching `Category._id`.

3. **`User`** gains `status` (default `'active'` is safe for existing users),
   `joinedAt`/`leftAt`/etc. For every existing user, backfill one
   `UserMembership` row: `{ userId, startedAt: user.createdAt, endedAt: null, reason: 'joined' }`
   — otherwise the participation engine will see 0 days for everyone and
   every historical period will show zero fair shares.

I did not write this as an executable script yet since I don't have
access to your actual database to test it against — happy to write and
run it against a copy of your data, or you can run the three steps above
as a one-off Node script before deploying these routes.

## Also worth knowing

- `PUT /api/expenses` still exists for backward compatibility with the old
  frontend contract (`{ id, ...fields }` in the body), but the *shape* of
  those fields changed (`categoryId` instead of `category`, `expenseDate`
  instead of `date`). The frontend forms need updating to match — that's
  next up.
- `npm install` was run and `npx vitest run` passes (13/13) and `npx tsc
  --noEmit` is clean except for `components/AddExpenseForm.tsx`, which
  still imports the old `ExpenseSchema`/`ExpenseInput` names — expected,
  since frontend wiring is the next phase.
