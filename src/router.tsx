import { createRouter as createTanStackRouter } from '@tanstack/react-router'
import { routeTree } from './routeTree.gen'

export function getRouter() {
  const router = createTanStackRouter({
    routeTree,
    context: {
      user: null,
    },
    scrollRestoration: true,
    defaultPreload: 'intent',
    // ponytail: 30s cache prevents duplicate fetch storms on link hover & route transitions
    defaultPreloadStaleTime: 30_000,
    defaultStaleTime: 30_000,
    defaultGcTime: 1000 * 60 * 5,
  })

  return router
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>
  }
}
