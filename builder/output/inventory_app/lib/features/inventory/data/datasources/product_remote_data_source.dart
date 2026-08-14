// [generated] generator=DataSourceGenerator template=datasource_remote.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:dio/dio.dart';


class ProductRemoteDataSource {
  final Dio _dio;
  const ProductRemoteDataSource(this._dio);

  Future<List<Map<String, dynamic>>> fetchProducts() async {
    final res = await _dio.get('/products');
    return res.data as List<Map<String, dynamic>>;
  }
}
