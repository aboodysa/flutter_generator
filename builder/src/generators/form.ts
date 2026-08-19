import { FormModel, FormFieldModel } from "../types";
import { PkgContext } from "../dart";

export function generateForm(form: FormModel, ctx?: PkgContext): string {
  const controllerDecls = form.fields
    .map((f) => `  final _${f.name} = TextEditingController();`)
    .join("\n");

  // RCA-002-ALL: same gesture-bound FocusNode.requestFocus() bypass crud_form.ts/screen.ts wire
  // for their own text-input fields (never autofocus — see crud_form.ts's own doc comment for the
  // full RCA). Every field this legacy generator renders (text/email/number/date) is a real
  // keyboard-invoking TextField — unlike crud_form.ts's DateTime, this generator never gives
  // "date" a read-only date-picker treatment, so it needs the bypass too.
  const focusNodeDecls = form.fields
    .map((f) => `  final _${f.name}Focus = FocusNode();`)
    .join("\n");

  const dispose = form.fields
    .map((f) => `    _${f.name}.dispose();\n    _${f.name}Focus.dispose();`)
    .join("\n");

  const validatorDecls = form.fields
    .map((f) => {
      const req = f.required ? `Validators.required(_${f.name}.text) ?? ` : "";
      const typeCheck = f.type === "email" ? `Validators.email(_${f.name}.text)` : f.type === "number" ? `(double.tryParse(_${f.name}.text) == null ? 'invalid number' : null)` : "null";
      return `  String? get ${f.name}Error => ${req}${typeCheck};`;
    })
    .join("\n");

  const fieldWidgets = form.fields
    .map((f) => {
      const keyboard = f.type === "number" ? "TextInputType.number" : f.type === "email" ? "TextInputType.emailAddress" : "TextInputType.text";
      return `        TextField(\n          controller: _${f.name},\n          focusNode: _${f.name}Focus,\n          onTap: () => _${f.name}Focus.requestFocus(),\n          keyboardType: ${keyboard},\n          decoration: InputDecoration(labelText: '${f.name}', errorText: ${f.name}Error),\n        ),`;
    })
    .join("\n");

  const validatorImport = ctx ? `import 'package:${ctx.pkg}/core/validator.dart';` : `import 'validator.dart';`;
  const componentsImport = ctx ? `import 'package:${ctx.pkg}/core/components.dart';` : `import 'components.dart';`;

  return `// [generated] generator=FormGenerator template=form.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:flutter/material.dart';
${validatorImport}
${componentsImport}

class ${form.name} extends StatefulWidget {
  const ${form.name}({super.key});
  @override
  State<${form.name}> createState() => _${form.name}State();
}

class _${form.name}State extends State<${form.name}> {
${controllerDecls}
${focusNodeDecls}

${validatorDecls}

  @override
  void dispose() {
${dispose}
    super.dispose();
  }

  bool get isValid => [${form.fields.map((f) => `${f.name}Error`).join(", ")}].every((e) => e == null);

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
${fieldWidgets}
        const SizedBox(height: 16),
        PrimaryButton(label: 'Submit', onPressed: isValid ? () {} : null),
      ],
    );
  }
}
`;
}
