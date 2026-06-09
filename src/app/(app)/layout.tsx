import BottomNav from '@/components/ui/BottomNav'
import NavigationProgress from '@/components/ui/NavigationProgress'
import Providers from '@/components/ui/Providers'
import RecurringRunner from '@/components/ui/RecurringRunner'
import { NavigationProvider } from '@/lib/navigation-context'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <Providers>
      <NavigationProvider>
        <NavigationProgress />
        {/* Overlay de blur separado — não afeta position:fixed dos filhos */}
        <div
          aria-hidden="true"
          style={{
            position: 'fixed',
            inset: 0,
            backdropFilter: 'blur(3px)',
            WebkitBackdropFilter: 'blur(3px)',
            pointerEvents: 'none',
            zIndex: 0,
          }}
        />
        <RecurringRunner />
        <div className="min-h-screen pb-nav" style={{ position: 'relative', zIndex: 1 }}>
          <main className="max-w-lg mx-auto">
            {children}
          </main>
          <BottomNav />
        </div>
      </NavigationProvider>
    </Providers>
  )
}
