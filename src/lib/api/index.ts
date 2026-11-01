import { ApiClient } from "./types"
import { MockApiAdapter } from "./mock-adapter"
import { SupabaseStubAdapter, NotImplementedError } from "./supabase-stub"

const useMocks = process.env.NEXT_PUBLIC_USE_MOCKS !== "false"

export const api: ApiClient = useMocks ? new MockApiAdapter() : new SupabaseStubAdapter()

export * from "./types"
export { NotImplementedError }
