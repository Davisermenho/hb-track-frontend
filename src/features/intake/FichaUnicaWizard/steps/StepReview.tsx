'use client';

import { useFormContext } from 'react-hook-form';
import { motion } from 'framer-motion';
import { 
  CheckCircle2, User, Mail, Calendar, Phone, FileText, MapPin, 
  Image as ImageIcon, Building, Users, Shield, Trophy, Info 
} from 'lucide-react';
import { ReviewCard, ReviewItem } from '../components/ReviewCard';
import { FichaUnicaPayload } from '../types';
import NextImage from 'next/image';

interface StepReviewProps {
  goToStep?: (step: number) => void;
}

export function StepReview({ goToStep }: StepReviewProps) {
  const { getValues } = useFormContext<FichaUnicaPayload>();
  const data = getValues();

  const handleGoToStep = (step: number) => {
    if (goToStep) {
      goToStep(step);
    } else {
      console.log(`Navegando para step ${step}`);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center gap-3 p-5 bg-success-50 dark:bg-success-950/30 rounded-xl border-2 border-success-200 dark:border-success-900">
        <CheckCircle2 className="size-8 text-success-600 dark:text-success-400 flex-shrink-0" />
        <div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
            Revisão Final
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Confira todos os dados antes de finalizar o cadastro
          </p>
        </div>
      </div>

      {/* Dados Pessoais */}
      <ReviewCard
        title="Dados Pessoais"
        icon={<User className="size-5 text-brand-600 dark:text-brand-400" />}
        onEdit={() => handleGoToStep(0)}
        isEmpty={!data.person}
      >
        {data.person && (
          <>
            <ReviewItem label="Nome Completo" value={`${data.person.first_name} ${data.person.last_name}`} />
            <ReviewItem label="Data de Nascimento" value={formatDate(data.person.birth_date)} />
            <ReviewItem label="Gênero" value={capitalizeFirst(data.person.gender)} />
            <ReviewItem label="Nacionalidade" value={data.person.nationality || 'Brasil'} />
            
            {data.person.contacts && data.person.contacts.length > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">Contatos:</p>
                {data.person.contacts.map((contact, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-1">
                    {contact.contact_type === 'email' ? <Mail className="size-3" /> : <Phone className="size-3" />}
                    <span>{contact.contact_value}</span>
                    {contact.is_primary && <span className="text-xs text-brand-600 dark:text-brand-400">(principal)</span>}
                  </div>
                ))}
              </div>
            )}

            {data.person.documents && data.person.documents.length > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">Documentos:</p>
                {data.person.documents.map((doc, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-1">
                    <FileText className="size-3" />
                    <span className="uppercase font-medium">{doc.document_type}:</span>
                    <span>{doc.document_number}</span>
                  </div>
                ))}
              </div>
            )}

            {data.person.address && (
              <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1">
                  <MapPin className="size-3" />
                  Endereço:
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {data.person.address.street}, {data.person.address.number}
                  {data.person.address.complement && ` - ${data.person.address.complement}`}
                  <br />
                  {data.person.address.neighborhood} - {data.person.address.city}/{data.person.address.state}
                  <br />
                  CEP: {data.person.address.postal_code}
                </p>
              </div>
            )}

            {data.person.media?.profile_photo_url && (
              <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1">
                  <ImageIcon className="size-3" />
                  Foto de Perfil:
                </p>
                <NextImage
                  src={data.person.media.profile_photo_url}
                  alt="Foto de perfil"
                  width={96}
                  height={96}
                  className="size-24 rounded-full object-cover border-2 border-gray-200 dark:border-gray-700"
                />
              </div>
            )}
          </>
        )}
      </ReviewCard>

      {/* Acesso ao Sistema */}
      {data.create_user && data.user && (
        <ReviewCard
          title="Acesso ao Sistema"
          icon={<Shield className="size-5 text-brand-600 dark:text-brand-400" />}
          onEdit={() => handleGoToStep(1)}
        >
          <ReviewItem label="Email" value={data.user.email} />
          <ReviewItem label="Papel" value={getRoleName(data.user.role_id)} />
          <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
            <div className="flex items-start gap-2 text-xs text-blue-light-700 dark:text-blue-light-400">
              <Info className="size-3 mt-0.5 flex-shrink-0" />
              <span>E-mail de ativação será enviado automaticamente</span>
            </div>
          </div>
        </ReviewCard>
      )}

      {/* Temporada */}
      {data.season && (
        <ReviewCard
          title="Temporada"
          icon={<Calendar className="size-5 text-brand-600 dark:text-brand-400" />}
          onEdit={() => handleGoToStep(2)}
        >
          {data.season.mode === 'create' && (
            <ReviewItem label="Nova Temporada" value={`Ano ${data.season.year}`} />
          )}
          {data.season.mode === 'select' && data.season.season_id && (
            <ReviewItem label="Temporada Selecionada" value={data.season.season_id} />
          )}
        </ReviewCard>
      )}

      {/* Organização */}
      {data.organization && (
        <ReviewCard
          title="Organização"
          icon={<Building className="size-5 text-brand-600 dark:text-brand-400" />}
          onEdit={() => handleGoToStep(3)}
        >
          {data.organization.mode === 'create' && (
            <ReviewItem label="Nova Organização" value={data.organization.name || 'N/A'} />
          )}
          {data.organization.mode === 'select' && data.organization.organization_id && (
            <ReviewItem label="Organização Selecionada" value={data.organization.organization_id} />
          )}
          
          {data.membership && (
            <>
              <div className="my-2 border-t border-gray-100 dark:border-gray-800" />
              <ReviewItem label="Papel na Organização" value={getRoleName(data.membership.role_id)} />
              <ReviewItem label="Data de Início" value={formatDate(data.membership.start_at)} />
            </>
          )}
        </ReviewCard>
      )}

      {/* Equipe */}
      {data.team && (
        <ReviewCard
          title="Equipe"
          icon={<Users className="size-5 text-brand-600 dark:text-brand-400" />}
          onEdit={() => handleGoToStep(4)}
        >
          {data.team.mode === 'create' && (
            <>
              <ReviewItem label="Nova Equipe" value={data.team.name || 'N/A'} />
              <ReviewItem label="Categoria" value={getCategoryName(data.team.category_id)} />
              <ReviewItem label="Gênero" value={capitalizeFirst(data.team.gender)} />
            </>
          )}
          {data.team.mode === 'select' && data.team.team_id && (
            <ReviewItem label="Equipe Selecionada" value={data.team.team_id} />
          )}
        </ReviewCard>
      )}

      {/* Atleta */}
      {data.athlete?.create && (
        <ReviewCard
          title="Dados do Atleta"
          icon={<Trophy className="size-5 text-brand-600 dark:text-brand-400" />}
          onEdit={() => handleGoToStep(5)}
        >
          <ReviewItem label="Nome Atleta" value={data.athlete.athlete_name || 'N/A'} />
          {data.athlete.athlete_nickname && (
            <ReviewItem label="Apelido" value={data.athlete.athlete_nickname} />
          )}
          {data.athlete.shirt_number && (
            <ReviewItem label="Número da Camisa" value={data.athlete.shirt_number.toString()} />
          )}
          
          <div className="my-2 border-t border-gray-100 dark:border-gray-800" />
          <ReviewItem label="Posição Defensiva" value={getPositionName(data.athlete.main_defensive_position_id)} />
          {data.athlete.main_offensive_position_id && (
            <ReviewItem label="Posição Ofensiva" value={getPositionName(data.athlete.main_offensive_position_id)} />
          )}
          
          {data.athlete.guardian_name && (
            <>
              <div className="my-2 border-t border-gray-100 dark:border-gray-800" />
              <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Responsável:</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">{data.athlete.guardian_name}</p>
              {data.athlete.guardian_phone && (
                <p className="text-sm text-gray-500 dark:text-gray-400">{data.athlete.guardian_phone}</p>
              )}
            </>
          )}

          {data.registration && (
            <>
              <div className="my-2 border-t border-gray-100 dark:border-gray-800" />
              <ReviewItem label="Registro Início" value={formatDate(data.registration.start_at)} />
              {data.registration.end_at && (
                <ReviewItem label="Registro Término" value={formatDate(data.registration.end_at)} />
              )}
            </>
          )}
        </ReviewCard>
      )}

      {/* Info Final */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start gap-3 p-5 bg-blue-light-50 dark:bg-blue-light-950/30 rounded-xl border border-blue-light-200 dark:border-blue-light-900"
      >
        <Info className="size-5 text-blue-light-600 dark:text-blue-light-400 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h4 className="text-sm font-semibold text-blue-light-800 dark:text-blue-light-300">
            Pronto para Finalizar
          </h4>
          <p className="text-sm text-blue-light-700 dark:text-blue-light-400 mt-1">
            Confira todos os dados acima. Você pode clicar em &quot;Editar&quot; em qualquer seção para fazer alterações. 
            Quando estiver tudo correto, clique em &quot;Finalizar Cadastro&quot; para salvar.
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ============================================================================
// HELPERS
// ============================================================================

function formatDate(date?: string): string {
  if (!date) return 'N/A';
  const d = new Date(date);
  return d.toLocaleDateString('pt-BR');
}

function capitalizeFirst(str?: string): string {
  if (!str) return 'N/A';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function getRoleName(roleId: number): string {
  const roles: Record<number, string> = {
    1: 'Dirigente',
    2: 'Coordenador',
    3: 'Treinador',
    4: 'Atleta',
  };
  return roles[roleId] || `Role ID ${roleId}`;
}

function getCategoryName(categoryId?: number): string {
  if (!categoryId) return 'N/A';
  const categories: Record<number, string> = {
    1: 'Sub-8',
    2: 'Sub-10',
    3: 'Sub-12',
    4: 'Sub-14',
    5: 'Sub-16',
    6: 'Sub-18',
    7: 'Sub-20',
    8: 'Adulto',
    9: 'Master',
  };
  return categories[categoryId] || `Categoria ${categoryId}`;
}

function getPositionName(positionId?: number): string {
  if (!positionId) return 'N/A';
  const positions: Record<number, string> = {
    1: 'Goleiro',
    2: 'Zagueiro Central',
    3: 'Lateral Direito',
    4: 'Lateral Esquerdo',
    5: 'Volante',
    6: 'Meia Central',
    7: 'Meia Direita',
    8: 'Meia Esquerda',
    9: 'Atacante',
    10: 'Centroavante',
  };
  return positions[positionId] || `Posição ${positionId}`;
}


