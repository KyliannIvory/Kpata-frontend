import { getUser } from '@/app/lib/dal'
import { logout } from '@/app/actions/auth'

export default async function DashboardPage() {
  const { firstname, lastname, phoneNumber, email, roles } = await getUser()

  return (
    <div className="min-h-full flex flex-col">
      <header className="flex items-center justify-between p-4 border-b-2 border-[var(--color-divider)]">
        <div className="wordmark">
          <span className="mark" />
          kpata
        </div>

        <form action={logout}>
          <button type="submit" className="btn btn-secondary">Se déconnecter</button>
        </form>
      </header>

      <main className="flex-1 w-full max-w-2xl mx-auto p-8 flex flex-col gap-4">
        <div>
          <h2>Bonjour, {firstname}</h2>
          <p className="opacity-70">Content de vous revoir sur kpata.</p>
        </div>

        <div className="card">
          <h4>Vos informations</h4>

          <div className="flex justify-between">
            <span className="text-muted">Nom complet</span>
            <span>{firstname} {lastname}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-muted">Téléphone</span>
            <span>{phoneNumber}</span>
          </div>

          {email && (
            <div className="flex justify-between">
              <span className="text-muted">Email</span>
              <span>{email}</span>
            </div>
          )}

          <div className="flex gap-2">
            {roles.map((role) => (
              <span key={role} className="tag tag-accent">{role}</span>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
