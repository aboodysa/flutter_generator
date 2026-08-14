export type PrimitiveType =
  | "String"
  | "int"
  | "double"
  | "bool"
  | "DateTime"
  | "enum"
  | "List"
  | "reference";

export interface Field {
  name: string;
  type: PrimitiveType;
  of?: string; // item type for List, or referenced entity name for reference
  enumValues?: string[];
  required?: boolean;
  nullable?: boolean;
  default?: string | number | boolean | null;
  semanticType?: string;
}

export interface EntityModel {
  name: string;
  identity?: { field: string };
  fields: Field[];
  equality?: "identity" | "full" | "none";
  immutability?: boolean;
}

export interface EnumModel {
  name: string;
  values: string[];
}

export type Invariant =
  | { kind: "min"; value: number }
  | { kind: "max"; value: number }
  | { kind: "nonEmpty" }
  | { kind: "regex"; value: string };

export interface ValueObjectModel {
  name: string;
  baseType: "String" | "int" | "double" | "DateTime";
  invariants?: Invariant[];
}

export interface FeatureModel {
  name: string;
  entities: EntityModel[];
  enums?: EnumModel[];
  valueObjects?: ValueObjectModel[];
  repositories?: RepositoryModel[];
  models?: ModelModel[];
  states?: StateModel[];
  queries?: QueryModel[];
  wrappers?: WrapperModel[];
  useCases?: UseCaseModel[];
  datasources?: DatasourceModel[];
  repositoryImpls?: RepositoryImplModel[];
  screens?: ScreenModel[];
  stateMachines?: StateMachineModel[];
  forms?: FormModel[];
  businessRules?: RuleModel[];
}

export type OperationKind = "list" | "get" | "create" | "update" | "delete";

// Faithful operation signature: arbitrary return type + params (positional/named).
export interface OperationParam {
  name: string;
  type: string; // Dart type (e.g. "String", "int", "TransactionQuery")
  required?: boolean; // for named params
  default?: string; // Dart default expr (e.g. "1", "50", "false")
  named?: boolean; // default true (named); false = positional
}

export interface OperationModel {
  name: string;
  returns: string; // Dart return type (e.g. "Future<TransactionEntity>", "Stream<TransactionsPage>", "Future<void>")
  params: OperationParam[];
}

export interface RepositoryModel {
  name: string;
  operations: OperationModel[];
}

// A "data class" field (plain class, no identity).
export interface DataField {
  name: string;
  type: string; // Dart type
  default?: string; // Dart default expr
}

export interface QueryModel {
  name: string; // e.g. TransactionQuery
  fields: DataField[];
  paramMap?: Record<string, string>; // field -> wire param name (for toQueryParams, v3.3)
}

export interface WrapperModel {
  name: string; // e.g. TransactionsPage
  fields: DataField[];
}

export interface UseCaseModel {
  name: string; // e.g. ListTransactions
  repository: string; // repository contract name
  operation: string; // repository operation to call
  paramType: string; // input type (Dart) e.g. "TransactionFilter" or "NoParams"
  returnType: string; // output type (Dart) e.g. "List<Transaction>"
}

export interface DatasourceModel {
  name: string; // e.g. TransactionRemoteDataSource
  endpoints: EndpointModel[];
}

export interface EndpointModel {
  name: string; // e.g. fetchTransactions
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  path: string; // e.g. "/transactions"
  returns: string; // Dart type returned (DTO) e.g. "List<Map<String, dynamic>>"
}

export interface RepositoryImplModel {
  name: string; // e.g. TransactionRepositoryImpl
  contract: string; // repository contract name it implements
  datasource: string; // datasource name it uses
}

export interface ScreenModel {
  name: string; // e.g. TransactionListScreen
  entity: string; // entity shown
  type: "list" | "detail";
  state: string; // state/cubit name
}

export interface TransitionModel {
  from: string;
  event: string;
  to: string;
  guard?: string; // guard rule name (business rule ref)
}

export interface StateMachineModel {
  name: string; // e.g. Order
  states: string[];
  events: string[];
  transitions: TransitionModel[];
}

export interface FormFieldModel {
  name: string;
  type: "text" | "email" | "number" | "date";
  required?: boolean;
}

export interface FormModel {
  name: string;
  fields: FormFieldModel[];
}

// Business rule (formal, closed language — DESIGN §19). Deterministic rule representation.
export interface RuleModel {
  name: string; // e.g. promotionEligibility
  entity: string; // entity the rule acts on
  conditions: RuleCondition[]; // all must hold (AND)
  result: string; // e.g. "eligible" | "eligible=true" | decision table row outcome
}

export interface RuleCondition {
  field: string;
  operator: ">=" | "<=" | ">" | "<" | "==" | "!=" | "contains";
  value: string; // literal, compared against the field (JSON literal form)
}

export interface ModelModel {
  name: string;
  entity: string; // entity this DTO maps to
  jsonKeys?: Record<string, string>; // fieldName -> primary json key (default = fieldName)
  acceptedKeys?: Record<string, string[]>; // fieldName -> alternate json keys (lenient parse, v3.3)
}

export interface StateField {
  name: string;
  type: string; // Dart type (e.g. "bool", "String", "List<TransactionEntity>", "TransactionFilter")
  default?: string; // Dart default expression (e.g. "false", "const []", "50")
}

export interface StateModel {
  name: string; // e.g. AllExpenses
  entity: string; // entity of the list items
  statuses?: string[]; // default: initial, loading, success, failure
  extraFields?: StateField[]; // additional state fields beyond status/transactions/errorMessage
}

export type DartTypeMap = Record<PrimitiveType, string>;
