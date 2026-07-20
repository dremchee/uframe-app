// Minimal inline copy of the Standard Schema v1 spec (https://standardschema.dev)
// so block prop schemas can be authored with any compliant library (zod 4,
// valibot, arktype, …) without `uframe` depending on a specific one. zod 4
// schemas already implement `~standard`, so the built-in blocks keep working
// unchanged. Flattened (no namespace) to play nice with lint; shapes match the
// spec structurally, which is all TS assignability needs.

export interface StandardSchemaV1<Input = unknown, Output = Input> {
  readonly '~standard': StandardSchemaProps<Input, Output>
}

export interface StandardSchemaProps<Input = unknown, Output = Input> {
  readonly version: 1
  readonly vendor: string
  readonly validate: (value: unknown) => StandardSchemaResult<Output> | Promise<StandardSchemaResult<Output>>
  readonly types?: StandardSchemaTypes<Input, Output> | undefined
}

export type StandardSchemaResult<Output> = StandardSchemaSuccess<Output> | StandardSchemaFailure

export interface StandardSchemaSuccess<Output> {
  readonly value: Output
  readonly issues?: undefined
}

export interface StandardSchemaFailure {
  readonly issues: ReadonlyArray<StandardSchemaIssue>
}

export interface StandardSchemaIssue {
  readonly message: string
  readonly path?: ReadonlyArray<PropertyKey | StandardSchemaPathSegment> | undefined
}

export interface StandardSchemaPathSegment {
  readonly key: PropertyKey
}

export interface StandardSchemaTypes<Input = unknown, Output = Input> {
  readonly input: Input
  readonly output: Output
}
