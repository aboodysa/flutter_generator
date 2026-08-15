import { DatasourceModel } from "../types";
import { importsFromTypes, PkgContext } from "../dart";

/**
 * DataSourceGenerator — structural, deterministic, 0% LLM.
 * IR DatasourceModel → remote datasource with Dio calls per endpoint.
 */
export function generateDatasource(ds: DatasourceModel, ctx?: PkgContext): string {
  const methods = ds.endpoints
    .map((e) => {
      const method = e.method.toLowerCase();
      const dioCall = method === "get" ? `_dio.get('${e.path}')` : `_dio.${method}('${e.path}')`;
      return `  Future<${e.returns}> ${e.name}() async {\n    final res = await ${dioCall};\n    return res.data as ${e.returns};\n  }`;
    })
    .join("\n\n");

  const imports = importsFromTypes(ds.endpoints.map((e) => e.returns), ctx).join("\n");

  return `// [generated] generator=DataSourceGenerator template=datasource_remote.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:dio/dio.dart';
${imports}

class ${ds.name} {
  final Dio _dio;
  const ${ds.name}(this._dio);

${methods}
}
`;
}
