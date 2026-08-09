import SignupForm from '@/app/ui/auth/signup-form'
import Link from "next/link";

export default function SignupPage() {
  return (
    <div className="flex flex-col gap-4">
      <h1> Créer un compte </h1>
      <SignupForm />
      <Link href="/login">
          Déjà un compte
      </Link>
    </div>
  )
}
