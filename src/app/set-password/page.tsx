import { redirect } from 'next/navigation'
import SetPasswordForm from '@/components/auth/SetPasswordForm'

interface SetPasswordPageProps {
  searchParams: Promise<{ token?: string }>
}

export default async function SetPasswordPage({ searchParams }: SetPasswordPageProps) {
  const params = await searchParams
  const token = params.token

  // Se não tiver token, redirecionar para login
  if (!token) {
    redirect('/login?error=Token inválido ou expirado')
  }

  return <SetPasswordForm token={token} />
}
