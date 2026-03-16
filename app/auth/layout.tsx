import Image from "next/image"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/10 p-4">
      <div className="w-full max-w-md">
        <div className="bg-card rounded-lg shadow-lg p-8 border border-border">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-primary mb-2 flex items-center justify-center">
              <Image src="/apple-icon.png" alt="Hysacam" width={175} height={100} />
            </h1>
            <p className="text-muted-foreground text-sm">Tableau de bord Administrateur de Hysacam</p>
          </div>
          {children}
        </div>
        <p className="text-center text-xs text-muted-foreground mt-6">
          Système de gestion des incidents et des rapports pour Douala, Cameroun
        </p>
      </div>
    </div>
  )
}
