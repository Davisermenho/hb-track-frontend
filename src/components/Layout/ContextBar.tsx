"use client";

import React from "react";
import { Building2, Users } from "lucide-react";

interface ContextBarProps {
  userRole: string;
  organizationName: string;
  canSwitchTeam: boolean;
}

/**
 * ContextBar - Barra de contexto que mostra organização, temporada e equipe selecionada
 * Exibida abaixo do header principal em todas as páginas (exceto algumas administrativas)
 */
export default function ContextBar({
  userRole,
  organizationName,
  canSwitchTeam,
}: ContextBarProps) {
  // TODO: Integrar com contexto global de seleção de temporada/equipe
  const currentSeason = "Temporada 2025/2026";
  const currentTeam = "Feminino Sub-18";

  return (
    <div className="sticky top-16 z-30 border-b border-stroke bg-white dark:border-strokedark dark:bg-boxdark">
      <div className="flex items-center justify-between px-4 py-2.5 md:px-6">
        {/* Organization & Context Info */}
        <div className="flex items-center gap-4 text-sm">
          {/* Organization */}
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-primary" />
            <span className="font-semibold text-black dark:text-white">
              {organizationName}
            </span>
          </div>

          {/* Separator */}
          <span className="text-bodydark">|</span>

          {/* Season */}
          <div className="hidden sm:flex items-center gap-1.5">
            <span className="text-bodydark">Temporada:</span>
            <span className="font-medium text-black dark:text-white">
              {currentSeason}
            </span>
          </div>

          {/* Separator */}
          {canSwitchTeam && (
            <>
              <span className="hidden sm:block text-bodydark">|</span>

              {/* Team */}
              <div className="hidden sm:flex items-center gap-1.5">
                <Users className="h-4 w-4 text-meta-3" />
                <span className="text-bodydark">Equipe:</span>
                <span className="font-medium text-black dark:text-white">
                  {currentTeam}
                </span>
              </div>
            </>
          )}
        </div>

        {/* Actions (future: filters, quick actions) */}
        <div className="flex items-center gap-2">
          {/* Placeholder for future filters/actions */}
        </div>
      </div>

      {/* Mobile view - second row for season/team */}
      <div className="flex sm:hidden items-center gap-3 px-4 pb-2 text-xs">
        <span className="text-bodydark">{currentSeason}</span>
        {canSwitchTeam && (
          <>
            <span className="text-bodydark">•</span>
            <span className="text-bodydark">{currentTeam}</span>
          </>
        )}
      </div>
    </div>
  );
}
