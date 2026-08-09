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
            required
            errors={state?.errors?.firstname}
        />

        <FormField
            label="Nom"
            id="lastname"
            name="lastname"
            required
            errors={state?.errors?.lastname}
        />

        <FormField
            label="Numéro de téléphone"
            id="phoneNumber"
            name="phoneNumber"
            type="tel"
            placeholder="0701020304"
            errors={state?.errors?.phoneNumber}
            required
        />

        <FormField
            label="Email"
            id="email"
            name="email"
            type="email"
            errors={state?.errors?.email}
        />

        <FormField
            label="Mot de passe"
            id="password"
            name="password"
            type="password"
            errors={state?.errors?.password}
            required
        />

        {state?.message && (<p> {state.message} </p>)}

      <button type="submit" disabled={pending}>
        {pending ? 'Création du compte...' : "S'inscrire"}
      </button>

    </form>
  )
}
