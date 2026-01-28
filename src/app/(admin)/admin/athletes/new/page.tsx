'use client';

import { useRouter } from 'next/navigation';
import AthleteFormNew from '@/components/Athletes/AthleteFormNew';

/**
 * Página de Cadastro de Nova Atleta
 * 
 * Referências:
 * - RF1: Cadeia hierárquica de criação (admin, coordenador, treinador podem criar)
 * - RF1.1: Vínculos automáticos (person, athlete, opcionalmente user e team_registration)
 * - Seção 5: Regras operacionais de cadastro
 */
export default function NewAthletePage() {
  const router = useRouter();

  const handleSuccess = () => {
    // Redirecionar para a lista de atletas
    router.push('/admin/athletes');
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <div className="p-4 md:p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-800 dark:text-white">
          Cadastrar Nova Atleta
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Preencha os dados para cadastrar uma nova atleta no sistema.
        </p>
      </div>

      <AthleteFormNew 
        onSuccess={handleSuccess}
        onCancel={handleCancel}
      />
    </div>
  );
}
