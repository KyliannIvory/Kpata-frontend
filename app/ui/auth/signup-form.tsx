'use client'

import { useActionState } from 'react'
import { signup } from '@/app/actions/auth'
import FormField from "@/app/ui/auth/form-field";

export default function SignupForm() {
  const [state, action, pending] = useActionState(signup, undefined)

  return (
    <form action={action} className="flex flex-col gap-4">

        <FormField
            label="Prénom"
            id="firstname"
            name="firstname"
            placeholder="Aïcha"
            required
            errors={state?.errors?.firstname}
        />

        <FormField
            label="Nom"
            id="lastname"
            name="lastname"
            placeholder="Koné"
            required
            errors={state?.errors?.lastname}
        />

        <FormField
            label="Numéro de téléphone"
            id="phoneNumber"
            name="phoneNumber"
            type="tel"
            placeholder="+225 07 00 00 00 00"
            errors={state?.errors?.phoneNumber}
            required
        />

        <FormField
            label="Email"
            id="email"
            name="email"
            type="email"
            placeholder="aicha@example.com"
            errors={state?.errors?.email}
        />

        <div className="flex flex-col gap-1">
          <FormField
              label="Mot de passe"
              id="password"
              name="password"
              type="password"
              placeholder="8 caractères minimum"
              errors={state?.errors?.password}
              required
          />
          <p className="text-muted">Doit contenir au moins 8 caractères.</p>
        </div>

        {state?.message && (<p className="field-error">{state.message}</p>)}

      <button type="submit" className="btn btn-primary btn-block" disabled={pending}>
        {pending ? 'Création du compte...' : 'Créer mon compte'}
      </button>

      <p className="text-muted text-center">
        En continuant, vous acceptez les conditions d&apos;utilisation.
      </p>

    </form>
  )
}
