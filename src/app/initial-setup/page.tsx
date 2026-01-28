import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth/actions'
import InitialSetupWizard from '@/components/auth/InitialSetupWizard'

export default async function InitialSetupPage() {
  const session = await getSession()

  // Redirecionar se não estiver autenticado
  if (!session) {
    redirect('/login')
  }

  // Redirecionar se não precisar de setup
  if (!session.user.needs_setup) {
    redirect('/inicio')
  }

  // Apenas dirigentes podem acessar
  if (session.user.role !== 'dirigente') {
    redirect('/inicio')
  }

  return <InitialSetupWizard />
}
