// [generated] generator=StateGenerator template=state_enum_status.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:rasheed_replica_expense/core/money.dart';
import 'package:rasheed_replica_expense/features/expense/domain/entities/payment_method.dart';
import 'package:rasheed_replica_expense/features/expense/domain/entities/transaction_entity.dart';
import 'package:rasheed_replica_expense/features/expense/domain/entities/transaction_filter.dart';

enum AllExpensesStatus { initial, loading, refreshing, success, failure }

class AllExpensesState extends Equatable {
  final AllExpensesStatus status;
  final List<TransactionEntity> transactionEntitys;
  final String? errorMessage;
  final List<TransactionEntity> visibleTransactions;
  final bool isFromCache;
  final String searchQuery;
  final String accountCode;
  final int limit;
  final TransactionFilter filter;

  const AllExpensesState({
    this.status = AllExpensesStatus.initial,
    this.transactionEntitys = const [],
    this.errorMessage,
    this.visibleTransactions = const [],
    this.isFromCache = false,
    this.searchQuery = '',
    this.accountCode = '',
    this.limit = 50,
    this.filter = const TransactionFilter(),
  });

  AllExpensesState copyWith({
    AllExpensesStatus? status,
    List<TransactionEntity>? transactionEntitys,
    String? errorMessage,
    List<TransactionEntity>? visibleTransactions,
    bool? isFromCache,
    String? searchQuery,
    String? accountCode,
    int? limit,
    TransactionFilter? filter,
  }) => AllExpensesState(
    status: status ?? this.status,
    transactionEntitys: transactionEntitys ?? this.transactionEntitys,
    errorMessage: errorMessage,
    visibleTransactions: visibleTransactions ?? this.visibleTransactions,
    isFromCache: isFromCache ?? this.isFromCache,
    searchQuery: searchQuery ?? this.searchQuery,
    accountCode: accountCode ?? this.accountCode,
    limit: limit ?? this.limit,
    filter: filter ?? this.filter,
  );

  @override
  List<Object?> get props => [status, transactionEntitys, errorMessage, visibleTransactions, isFromCache, searchQuery, accountCode, limit, filter];
}

class AllExpensesCubit extends Cubit<AllExpensesState> {

  AllExpensesCubit() : super(const AllExpensesState());

  Future<void> load() async {
    emit(state.copyWith(status: AllExpensesStatus.loading));
    try {
      // [user] region:user — replace with real repository call.
      // Deterministic demo data so the app renders rows out of the box:
      emit(state.copyWith(status: AllExpensesStatus.success, transactionEntitys: [TransactionEntity(id: 'x', accountId: 'x', userId: 'x', amount: Money(minorUnits: 0, currency: 'SAR'), transactionDateTime: DateTime(2024), transactionType: 'x', captureMethod: 'x', isDigitalReceipt: false, createdAt: DateTime(2024)), TransactionEntity(id: 'transaction-entity-1', accountId: 'Sample item 1', cycleId: 'Sample item 1', userId: 'Sample item 1', categoryId: 1, merchantId: 'Sample item 1', merchant: 'Sample TransactionEntity 1', branchName: 'Sample item 1', amount: Money(minorUnits: 15000, currency: 'SAR'), vatAmount: Money(minorUnits: 15000, currency: 'SAR'), discountAmount: Money(minorUnits: 15000, currency: 'SAR'), totalQty: 150.0, invoiceNumber: 'Sample item 1', taxNumber: 'Sample item 1', terminalCode: 'Sample item 1', commercialRegisterNumber: 'Sample item 1', paymentMethod: PaymentMethod.values.first, paymentMethodMap: 'Sample item 1', cashierName: 'Sample item 1', salesName: 'Sample item 1', customerName: 'Sample item 1', customerPhone: 'Sample item 1', transactionDateTime: DateTime(2025), notes: 'Sample item 1', qrCode: 'Sample item 1', subtotal: Money(minorUnits: 15000, currency: 'SAR'), taxableAmount: Money(minorUnits: 15000, currency: 'SAR'), totalSavings: Money(minorUnits: 15000, currency: 'SAR'), usedCredit: Money(minorUnits: 15000, currency: 'SAR'), netPayable: Money(minorUnits: 15000, currency: 'SAR'), transactionType: 'Sample item 1', captureMethod: 'Sample item 1', isDigitalReceipt: false, createdAt: DateTime(2025), categoryName: 'Sample item 1', sectionCode: 'Sample item 1', sectionIconIndex: 1, categoryIconAsset: 'Sample item 1', categoryColorHex: 'Sample item 1', captureMethodIconAsset: 'Sample item 1', attachments: const [], items: const [], payments: const [], hasFeedback: false, nfcTransactionCode: 'Sample item 1', isLongReceipt: false), TransactionEntity(id: 'transaction-entity-2', accountId: 'Sample item 2', cycleId: 'Sample item 2', userId: 'Sample item 2', categoryId: 2, merchantId: 'Sample item 2', merchant: 'Sample TransactionEntity 2', branchName: 'Sample item 2', amount: Money(minorUnits: 25000, currency: 'SAR'), vatAmount: Money(minorUnits: 25000, currency: 'SAR'), discountAmount: Money(minorUnits: 25000, currency: 'SAR'), totalQty: 250.0, invoiceNumber: 'Sample item 2', taxNumber: 'Sample item 2', terminalCode: 'Sample item 2', commercialRegisterNumber: 'Sample item 2', paymentMethod: PaymentMethod.values.first, paymentMethodMap: 'Sample item 2', cashierName: 'Sample item 2', salesName: 'Sample item 2', customerName: 'Sample item 2', customerPhone: 'Sample item 2', transactionDateTime: DateTime(2025), notes: 'Sample item 2', qrCode: 'Sample item 2', subtotal: Money(minorUnits: 25000, currency: 'SAR'), taxableAmount: Money(minorUnits: 25000, currency: 'SAR'), totalSavings: Money(minorUnits: 25000, currency: 'SAR'), usedCredit: Money(minorUnits: 25000, currency: 'SAR'), netPayable: Money(minorUnits: 25000, currency: 'SAR'), transactionType: 'Sample item 2', captureMethod: 'Sample item 2', isDigitalReceipt: false, createdAt: DateTime(2025), categoryName: 'Sample item 2', sectionCode: 'Sample item 2', sectionIconIndex: 2, categoryIconAsset: 'Sample item 2', categoryColorHex: 'Sample item 2', captureMethodIconAsset: 'Sample item 2', attachments: const [], items: const [], payments: const [], hasFeedback: false, nfcTransactionCode: 'Sample item 2', isLongReceipt: false)]));
    } catch (e) {
      emit(state.copyWith(status: AllExpensesStatus.failure, errorMessage: e.toString()));
    }
  }
}
