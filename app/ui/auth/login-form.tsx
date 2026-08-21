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
          placeholder="+225 07 00 00 00 00"
          required
          errors={state?.errors?.phoneNumber}
        />

        <FormField
            label="Mot de passe"
            id="password"
            name="password"
            type="password"
            placeholder="Votre mot de passe"
            required
            errors={state?.errors?.password}
        />

        {state?.message && (<p className="field-error">{state.message}</p>)}

      <button type="submit" className="btn btn-primary btn-block" disabled={pending}>
        {pending ? 'Connexion...' : 'Se connecter'}
      </button>
    </form>
  )
}
