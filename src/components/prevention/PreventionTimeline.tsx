'use client';

/**
 * PreventionTimelineComponent - Timeline visual de eventos preventivos
 * 
 * Exibe alertas → sugestões → lesões em ordem cronológica com conectores visuais
 */

import { TimelineEvent, getEventColor } from '@/lib/api/prevention-effectiveness';
import { Icons } from '@/design-system/icons';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface PreventionTimelineProps {
  events: TimelineEvent[];
}

export function PreventionTimeline({ events }: PreventionTimelineProps) {
  if (events.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        Nenhum evento no período selecionado
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {events.map((event, idx) => (
        <div key={event.id} className="relative">
          {/* Connector Line */}
          {idx < events.length - 1 && (
            <div className="absolute left-6 top-12 h-full w-0.5 bg-gray-200 dark:bg-gray-700" />
          )}

          {/* Event Card */}
          <div className={`flex gap-4 relative`}>
            {/* Icon */}
            <div className={`
              flex-shrink-0 w-12 h-12 rounded-full border-4 border-white dark:border-gray-900
              ${getEventColor(event.type)} flex items-center justify-center z-10
            `}>
              {event.type === 'alert' && <Icons.Status.Warning className="h-6 w-6" />}
              {event.type === 'suggestion' && <Icons.UI.Lightbulb className="h-6 w-6" />}
              {event.type === 'injury' && <Icons.Medical className="h-6 w-6" />}
            </div>

            {/* Content */}
            <div className="flex-1 bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                      {event.type === 'alert' && 'Alerta'}
                      {event.type === 'suggestion' && 'Sugestão'}
                      {event.type === 'injury' && 'Lesão'}
                    </span>
                    {event.type === 'suggestion' && event.status && (
                      <span className={`
                        px-2 py-0.5 text-xs font-medium rounded-full
                        ${event.status === 'applied' ? 'bg-green-100 text-green-700 dark:bg-green-900/30' : ''}
                        ${event.status === 'rejected' ? 'bg-red-100 text-red-700 dark:bg-red-900/30' : ''}
                        ${event.status === 'pending' ? 'bg-gray-100 text-gray-700 dark:bg-gray-700' : ''}
                      `}>
                        {event.status === 'applied' && 'Aplicada'}
                        {event.status === 'rejected' && 'Recusada'}
                        {event.status === 'pending' && 'Pendente'}
                      </span>
                    )}
                  </div>

                  {event.type === 'alert' && (
                    <>
                      <p className="font-medium text-gray-900 dark:text-gray-100">{event.message}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Tipo: {event.alert_type} • Severidade: {event.severity}
                      </p>
                    </>
                  )}

                  {event.type === 'suggestion' && (
                    <>
                      <p className="font-medium text-gray-900 dark:text-gray-100">{event.action}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Tipo: {event.suggestion_type}
                      </p>
                    </>
                  )}

                  {event.type === 'injury' && (
                    <>
                      <p className="font-medium text-gray-900 dark:text-gray-100">{event.reason || 'Lesão registrada'}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Status: {event.status}
                      </p>
                    </>
                  )}
                </div>

                <time className="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap ml-4">
                  {format(new Date(event.date), 'dd MMM HH:mm', { locale: ptBR })}
                </time>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
