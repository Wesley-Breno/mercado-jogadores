import { assertEmptyLeague } from './support/api.ts'

export default async function globalSetup(): Promise<void> {
  await assertEmptyLeague()
}
