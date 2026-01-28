'use client';

import Image from 'next/image';
import { Mail, Phone, MapPin, Calendar, Edit, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { AthleteStateBadge } from '@/components/ui/AthleteStateBadge';
import { cn, calculateAge, formatDate } from '@/lib/utils';

interface AthleteProfileHeaderProps {
  athlete: {
    id: string;
    name: string;
    number: number;
    photo?: string;
    birthDate: Date;
    email?: string;
    phone?: string;
    city?: string;
    position: string;
    state: 'ativa' | 'dispensada' | 'arquivada';
    flags?: {
      injured?: boolean;
      medical_restriction?: boolean;
      load_restricted?: boolean;
      suspended_until?: string;
    };
  };
  onEdit?: () => void;
  onShare?: () => void;
  className?: string;
}

export function AthleteProfileHeader({
  athlete,
  onEdit,
  onShare,
  className,
}: AthleteProfileHeaderProps) {
  const age = calculateAge(athlete.birthDate);

  return (
    <div className={cn(
      'bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800',
      className
    )}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-start gap-6">
          {/* Photo */}
          <div className="relative flex-shrink-0">
            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white text-4xl font-bold shadow-lg overflow-hidden relative">
              {athlete.photo ? (
                <Image
                  src={athlete.photo}
                  alt={athlete.name}
                  fill
                  className="rounded-full object-cover"
                />
              ) : (
                athlete.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
              )}
            </div>
            {/* Number Badge */}
            <div className="absolute -bottom-2 -right-2 w-12 h-12 rounded-full bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 flex items-center justify-center text-xl font-bold shadow-lg">
              {athlete.number}
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  {athlete.name}
                </h1>
                <div className="flex items-center gap-3 flex-wrap mb-3">
                  <span className="px-3 py-1 bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-400 rounded-full text-sm font-medium">
                    {athlete.position}
                  </span>
                  <AthleteStateBadge
                    state={athlete.state}
                    flags={athlete.flags}
                    size="md"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                {onShare && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onShare}
                  >
                    <Share2 className="w-4 h-4" />
                    Compartilhar
                  </Button>
                )}
                {onEdit && (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={onEdit}
                  >
                    <Edit className="w-4 h-4" />
                    Editar
                  </Button>
                )}
              </div>
            </div>

            {/* Contact Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>
                  {formatDate(athlete.birthDate)} ({age} anos)
                </span>
              </div>
              {athlete.email && (
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  <span className="truncate">{athlete.email}</span>
                </div>
              )}
              {athlete.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  <span>{athlete.phone}</span>
                </div>
              )}
              {athlete.city && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  <span>{athlete.city}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}