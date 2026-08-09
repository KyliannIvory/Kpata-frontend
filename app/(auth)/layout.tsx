export default function AuthLayout({ children }: LayoutProps<'/'>) {

    return (

        <div className="flex min-h-full items-center justify-center p-8">

            <div className="w-full max-w-sm rounded-lg border border-[var(--border)] bg-[var(--background)] p-6 shadow-sm">
                {children}
            </div>

        </div>
  )
}
