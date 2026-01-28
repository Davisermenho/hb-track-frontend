/**
 * Painel de Controle do Super Admin
 * Rota: /admin/admin
 * 
 * Dashboard completo com todas as permissões e poderes do superadmin
 * Sem sidebar - layout standalone
 */

import type { Metadata } from "next";
import { getSession } from '@/lib/auth/actions';
import { redirect } from 'next/navigation';
import SuperAdminDashboard from './SuperAdminDashboard';

export const metadata: Metadata = {
  title: "Painel Super Admin - HB Track",
  description: "Painel de controle administrativo completo",
};

export default async function AdminPage() {
  const session = await getSession();

  if (!session) {
    redirect('/signin');
  }

  return <SuperAdminDashboard />;
}
