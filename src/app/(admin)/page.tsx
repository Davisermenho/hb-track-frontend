/**
 * Rota raiz (/) - Redireciona para /inicio
 */

import { redirect } from 'next/navigation';

export default function RootPage() {
  redirect('/inicio');
}