/**
 * Página Principal /training
 * 
 * Redireciona para /training/agenda como rota padrão
 */

import { redirect } from 'next/navigation';

export default function TrainingPage() {
  redirect('/training/agenda');
}
