// [generated] generator=PersistenceGenerator template=persistence_sql_drift.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
// Drift schema for Transaction (SQL persistence, §5.2-F2). Schema-only — see file header
// docs in persistence.ts for why no @DriftDatabase/part-file is emitted here. Relational fields deferred (not yet FK/junction-modeled): category, items, attachments.
import 'package:drift/drift.dart';

class TransactionTable extends Table {
  TextColumn get id => text()();
  RealColumn get amount => real()();
  DateTimeColumn get date => dateTime()();
  TextColumn get merchant => text().nullable()();
  TextColumn get paymentMethod => text()(); // stores PaymentMethod.name
  TextColumn get note => text().nullable()();

  @override
  Set<Column> get primaryKey => {id};
}
