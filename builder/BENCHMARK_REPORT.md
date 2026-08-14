# Benchmark — generated Rasheed replica vs original

Generated from `builder/samples/rasheed.ir.json` (IR extracted from the real domain), compared against the original at `/Users/username/Documents/cto/Rasheed/rasheedapp`.

## Domain layer (entities) — 100%
61/61 fields across 4 entities, all types exact.

## Data layer (repository contract) — 100% (was 0%)
Faithful signatures after the lossy-CRUD fix:
- `Stream<TransactionsPage> watchTransactions(TransactionQuery query, {required String userId, String? languageCode, bool localOnly = false})`
- `Future<TransactionEntity> getSimpleExpense/getDetailedExpense(...)` (named params + defaults)
- `Future<TransactionFeedbackEntity> submitTransactionFeedback(...)`

Plus generated `TransactionQuery` (13 fields, `toQueryParams()` with wire-param map) and `TransactionsPage` wrapper.

## Presentation layer (state) — 100% (was 89%)
enum 5/5, state fields 9/9 (added `filter: TransactionFilter`).

## Root cause of the earlier gaps
The repository IR was **lossy** (forced operations into a `kind: list|get|create|update|delete` CRUD taxonomy), which dropped delivery mode (Stream vs Future), query objects, and named params. Fixed by making `OperationModel` faithful (`{name, returns, params}`) and adding `queries[]` + `wrappers[]` to the IR.

## Remaining (not yet benchmarked)
- Repository **implementation** (cache-through) — `RepositoryImplGenerator` not built.
- Screen/UI layer — `ScreenGenerator` not built.
- Entity `static empty()` sentinel + `fromJson` on entity (multi-alias).
- Value objects — real code uses raw `double` (no `Money`); faithful IR correctly omits them.

Run: `npm run bench`
