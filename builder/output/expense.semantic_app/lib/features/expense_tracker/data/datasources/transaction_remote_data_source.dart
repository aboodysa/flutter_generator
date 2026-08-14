// [generated] generator=DataSourceGenerator template=datasource_remote.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:dio/dio.dart';


class TransactionRemoteDataSource {
  final Dio _dio;
  const TransactionRemoteDataSource(this._dio);

  Future<List<Map<String, dynamic>>> fetchTransactions() async {
    final res = await _dio.get('/transactions');
    return res.data as List<Map<String, dynamic>>;
  }
}
