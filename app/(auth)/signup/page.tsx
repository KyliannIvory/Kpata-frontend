import SignupForm from '@/app/ui/auth/signup-form'
import Link from 'next/link'

export default function SignupPage() {
  return (
    <div className="flex flex-col gap-4">
      <div className="wordmark">
        <span className="mark" />
        kpata
      </div>

      <div>
        <h2>Créer un compte</h2>
        <p className="opacity-70">Commencez votre expérience kpata dès aujourd&apos;hui.</p>
      </div>

      <SignupForm />

      <hr className="hr" />

      <p className="text-muted text-center">
        Déjà un compte ? <Link href="/login">Se connecter</Link>
      </p>
    </div>
  )
}
