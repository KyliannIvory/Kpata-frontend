import LoginForm from '@/app/ui/auth/login-form'
import Link from 'next/link'

export default function LoginPage() {
  return (
    <div className="flex flex-col gap-4">
      <h1> Connexion </h1>
      <LoginForm />
      <Link href="/signup">
          Pas de compte ?
      </Link>
    </div>
  )
}
