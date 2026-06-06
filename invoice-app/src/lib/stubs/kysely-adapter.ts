/** Stub: app uses drizzleAdapter, not kysely. Satisfies better-auth graph for Vite. */
export function getKyselyDatabaseType() {
  return undefined
}
export async function createKyselyAdapter() {
  return { kysely: undefined, databaseType: undefined, transaction: undefined }
}
export function kyselyAdapter() {
  throw new Error('kysely adapter is not used in this app')
}
