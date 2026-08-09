type FormFieldProps = {
  label: string
  id: string
  name: string
  type?: string
  placeholder?: string
  required?: boolean
  errors?: string[]
}

export default function FormField({
  label,
  id,
  name,
  type = 'text',
  placeholder,
  required,
  errors,
}: FormFieldProps) {


  return (
      <>
        <label htmlFor={id}> {label} </label>
        <input id={id} name={name} type={type} placeholder={placeholder} required={required} />
        {errors && ( errors.map((error) => (
                <p key={error}> {error} </p>
            ))
        )}
      </>
  )
}
