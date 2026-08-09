'use client'

import { useActionState } from 'react'
import { login } from '@/app/actions/auth'
import FormField from '@/app/ui/auth/form-field'

export default function LoginForm() {
  const [state, action, pending] = useActionState(login, undefined)

  return (
    <form action={action} className="flex flex-col gap-4">

        <FormField
          label="Numéro de téléphone"
          id="phoneNumber"
          name="phoneNumber"
          type="tel"
          placeholder="0701020304"
          required
          errors={state?.errors?.phoneNumber}
        />

        <FormField
            label="Mot de passe"
            id="password"
            name="password"
            type="password"
            required
            errors={state?.errors?.password}
        />

        {state?.message && (<p> {state.message} </p>)}

      <button type="submit" disabled={pending}>
        {pending ? 'Connexion...' : 'Se connecter'}
      </button>
    </form>
  )
}
