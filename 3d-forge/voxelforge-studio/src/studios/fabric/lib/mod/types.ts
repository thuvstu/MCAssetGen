/**
 * Backward-compatible domain model barrel.
 *
 * New code should prefer importing from `@/lib/mod/model`, while this file is
 * kept so existing editor/generator modules do not need a flag-day migration.
 */
export * from "./model";
