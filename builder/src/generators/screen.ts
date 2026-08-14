import { ScreenModel } from "../types";
import { GenContext } from "../dart";

/**
 * ScreenGenerator — structural, deterministic, 0% LLM (list + detail patterns).
 * IR ScreenModel → a BlocBuilder screen bound to a generated cubit/state.
 */
export function generateScreen(s: ScreenModel, ctx?: GenContext): string {
  const stateClass = `${s.state}State`; // s.state is the state NAME (e.g. "TransactionList")
  const cubit = `${s.state}Cubit`;
  const statusEnum = `${s.state}Status`;

  const body =
    s.type === "list"
      ? `            return ListView.builder(\n              itemCount: state.transactions.length,\n              itemBuilder: (_, i) => ListTile(title: Text(state.transactions[i].toString())),\n            );`
      : `            return Center(child: Text(state.toString()));`;

  const stateImport = ctx?.symbols.get(s.state)
    ? `import 'package:${ctx.pkg}/${ctx.symbols.get(s.state)}';`
    : `import '${s.state.toLowerCase()}.dart';`;
  const componentsImport = ctx ? `import 'package:${ctx.pkg}/core/components.dart';` : "import '../../core/components.dart';";

  return `// [generated] generator=ScreenGenerator template=screen_${s.type}.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
${componentsImport}
${stateImport}

class ${s.name} extends StatelessWidget {
  const ${s.name}({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('${s.name}')),
      body: BlocBuilder<${cubit}, ${stateClass}>(
        builder: (context, state) {
          if (state.status == ${statusEnum}.loading) return const LoadingState();
          if (state.status == ${statusEnum}.failure) return ErrorState(message: state.errorMessage);
${body}
        },
      ),
    );
  }
}
`;
}
