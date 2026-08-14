import { FormModel, FormFieldModel } from "../types";
import { GenContext } from "../dart";

export function generateForm(form: FormModel, ctx?: GenContext): string {
  const controllerDecls = form.fields
    .map((f) => `  final _${f.name} = TextEditingController();`)
    .join("\n");

  const dispose = form.fields
    .map((f) => `    _${f.name}.dispose();`)
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
      return `        TextField(\n          controller: _${f.name},\n          keyboardType: ${keyboard},\n          decoration: InputDecoration(labelText: '${f.name}', errorText: ${f.name}Error),\n        ),`;
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
