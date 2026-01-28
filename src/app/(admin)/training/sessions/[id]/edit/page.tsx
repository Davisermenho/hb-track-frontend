/**
 * Página de edição de sessão (Draft/Scheduled)
 *
 * /training/sessions/[id]/edit
 */

import { getSession } from '@/lib/auth/actions';
import { redirect } from 'next/navigation';
import SessionEditClient from './SessionEditClient';

interface SessionEditPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function SessionEditPage({ params }: SessionEditPageProps) {
  const session = await getSession();

  if (!session) {
    redirect('/signin');
  }

  const { id } = await params;
  return <SessionEditClient sessionId={id} />;
}
