import { redirect } from '@paretojs/core'
import type { LoaderContext } from '@paretojs/core'

export function loader(_ctx: LoaderContext) {
  // Simulate an auth guard — always redirect for demo
  throw redirect('/redirect-demo/target')
}

export default function ProtectedPage() {
  return <div>You should never see this — loader redirects before render.</div>
}
