import { ApiClient } from "./types"
import { MockApiAdapter } from "./mock-adapter"
import { RestApiAdapter } from "./rest-adapter"

const useMocks = process.env.NEXT_PUBLIC_USE_MOCKS === "true"

export const api: ApiClient = useMocks ? new MockApiAdapter() : new RestApiAdapter()

export * from "./types"
export { MockApiAdapter } from "./mock-adapter"
export { RestApiAdapter } from "./rest-adapter"
