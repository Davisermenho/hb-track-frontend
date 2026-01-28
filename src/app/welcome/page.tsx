import { redirect } from 'next/navigation'
import WelcomeFlow from '@/components/auth/WelcomeFlow'

interface WelcomePageProps {
  searchParams: Promise<{ token?: string }>
}

export default async function WelcomePage({ searchParams }: WelcomePageProps) {
  const params = await searchParams
  const token = params.token

  // Se não tiver token, redirecionar para login
  if (!token) {
    redirect('/signin?error=Token inválido ou expirado')
  }

  return <WelcomeFlow token={token} />
}
