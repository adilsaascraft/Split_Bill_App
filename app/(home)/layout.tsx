'use client'

import MobileNavbar from '@/components/MobileNavbar'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background">
      {/* ================= MOBILE NAVBAR ================= */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-red-500 text-white">
        <MobileNavbar />
      </div>

      {/* ================= MAIN CONTENT ================= */}
      <main className="pt-16">{children}</main>
    </div>
  )
}
