# Credit Limit Trigger Refactoring

## Goal Description
The `place_order` procedure currently performs a manual credit limit check after creating an order. This logic is redundant because a trigger `trg_check_credit_limit_before_order` already exists. However, the current trigger only fires on `INSERT`, while the order total is calculated and set via an `UPDATE` statement later in the transaction.

This plan aims to:
1.  Update the trigger to fire on `UPDATE` of the `total_amount` column.
2.  Remove the redundant procedural code from `placed_order`.

## Proposed Changes

### Backend SQL Requirements

#### [MODIFY] [03_triggers_and_audit.sql](file:///e:/Supply-Chainsystem/backend/sql_requirements/03_triggers_and_audit.sql)
- Update `check_credit_limit` function to handle `NEW.total_amount` updates correctly (if it's an update, we should exclude the OLD amount if needed, but `v_current_debt` query sums *other* unpaid orders, so `NEW.total_amount` is just the current order's new total).
- Change `trg_check_credit_limit_before_order` to fire `BEFORE INSERT OR UPDATE` on `orders`.
- Add condition `WHEN (NEW.total_amount IS DISTINCT FROM OLD.total_amount)` to the update trigger to avoid unnecessary checks.

#### [MODIFY] [02_procedures_transactional.sql](file:///e:/Supply-Chainsystem/backend/sql_requirements/02_procedures_transactional.sql)
- Remove the manual credit limit check block (lines ~89-104) from the `place_order` procedure.

## Verification Plan

### Manual Verification
1.  **Direct SQL Test**:
    - Since we don't have a live app interface for this specific edge case easily accessible, we will verify by inspecting the code logic.
    - We can simulate the flow mentally:
        - `INSERT INTO orders` (Total = NULL/0) -> Trigger runs (OK).
        - `UPDATE orders SET total_amount = X` -> Trigger runs. Checks (Existing Debt + X) > Limit. Raises Exception if true.
    - If the user desires, we can create a temporary SQL script to test this behavior, but code inspection is primary for this refactor.
