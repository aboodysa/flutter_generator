import { RepositoryImplModel } from "../types";
import { GenContext } from "../dart";

/**
 * RepositoryImplGenerator — structural, deterministic, 0% LLM.
 * IR RepositoryImplModel → implements the contract, delegates to a datasource.
 * (Business logic / mapping is a [user] region — generated scaffold once.)
 */
export function generateRepositoryImpl(ri: RepositoryImplModel, ctx?: GenContext): string {
  const imp = (n: string) => (ctx?.symbols.get(n) ? `import 'package:${ctx!.pkg}/${ctx!.symbols.get(n)}';` : `import '${n.toLowerCase()}.dart';`);

  return `// [generated] generator=RepositoryImplGenerator template=repository_impl.v1 class=structural ownership=scaffold
// Do not hand-edit this file; regenerate from IR. The [user] region below is user-owned.
${imp(ri.contract)}
${imp(ri.datasource)}

class ${ri.name} implements ${ri.contract} {
  final ${ri.datasource} datasource;
  const ${ri.name}(this.datasource);

  // [user] region:user — implement each ${ri.contract} method by delegating to datasource + mapping DTO → entity.
  @override
  // noSuchMethod to satisfy the interface until [user] regions are filled:
  dynamic noSuchMethod(Invocation invocation) => super.noSuchMethod(invocation);
}
`;
}
