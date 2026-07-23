import { HeadContent, Scripts, createRootRouteWithContext, Link } from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'
import { Toaster } from 'sonner'
import Header from '../components/Header'
import { getCurrentUser } from '../utils/auth.functions'
import type { UserSession } from '../utils/auth.server'

import appCss from '../styles.css?url'

const THEME_INIT_SCRIPT = `(function(){try{var root=document.documentElement;root.classList.remove('dark');root.classList.add('light');root.setAttribute('data-theme','light');root.style.colorScheme='light';}catch(e){}})();`

export interface MyRouterContext {
  user: UserSession | null;
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'OneSubscribe - Digital Marketplace',
      },
    ],
    links: [
      {
        rel: 'icon',
        type: 'image/webp',
        href: '/logo-onesubs.webp',
      },
      {
        rel: 'stylesheet',
        href: appCss,
      },
      {
        rel: 'preconnect',
        href: 'https://fonts.googleapis.com',
      },
      {
        rel: 'preconnect',
        href: 'https://fonts.gstatic.com',
        crossOrigin: 'anonymous',
      },
      {
        rel: 'stylesheet',
        href: 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&family=Inter:wght@400;500;600&display=swap',
      },
      {
        rel: 'stylesheet',
        href: 'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap',
      },
    ],
  }),
  beforeLoad: async () => {
    try {
      const { user } = await getCurrentUser()
      return { user }
    } catch {
      return { user: null }
    }
  },
  loader: async ({ context }) => {
    return { user: context.user || null }
  },
  notFoundComponent: () => {
    return (
      <main className="page-wrap px-4 py-16 text-center">
        <div className="island-shell rounded-3xl p-8 max-w-md mx-auto border border-[var(--line)]">
          <h2 className="text-xl font-bold text-red-600 mb-2">Halaman Tidak Ditemukan</h2>
          <p className="text-sm text-[var(--sea-ink-soft)] mb-6">Maaf, halaman yang Anda cari tidak ada atau telah dipindahkan.</p>
          <Link to="/" className="rounded-full bg-[var(--lagoon-deep)] px-6 py-2.5 text-xs font-bold text-white no-underline">
            Kembali ke Beranda
          </Link>
        </div>
      </main>
    )
  },
  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        <HeadContent />
      </head>
      <body className="font-sans antialiased [overflow-wrap:anywhere] selection:bg-[rgba(79,184,178,0.24)]">
        <Toaster position="top-center" richColors />
        <Header />
        {children}
        <TanStackDevtools
          config={{
            position: 'bottom-right',
          }}
          plugins={[
            {
              name: 'Tanstack Router',
              render: <TanStackRouterDevtoolsPanel />,
            },
          ]}
        />
        <Scripts />
      </body>
    </html>
  )
}
