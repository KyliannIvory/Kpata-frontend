export default function AuthLayout({ children }: LayoutProps<'/'>) {

    return (

        <div className="flex min-h-full items-center justify-center p-8">

            <div className="w-full max-w-sm rounded-[var(--radius-lg)] bg-[var(--color-neutral-100)] p-8 shadow-[var(--shadow-md)]">
                {children}
            </div>

        </div>
  )
}
