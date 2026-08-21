import LoginForm from '@/app/ui/auth/login-form'
import Link from 'next/link'

export default function LoginPage() {
  return (
    <div className="flex flex-col gap-4">
      <div className="wordmark">
        <span className="mark" />
        kpata
      </div>

      <div>
        <h2>Content de vous revoir</h2>
        <p className="opacity-70">Connectez-vous pour réserver votre prochain rendez-vous.</p>
      </div>

      <LoginForm />

      <hr className="hr" />

      <p className="text-muted text-center">
        Pas encore de compte ? <Link href="/signup">Créer un compte</Link>
      </p>
    </div>
  )
}
