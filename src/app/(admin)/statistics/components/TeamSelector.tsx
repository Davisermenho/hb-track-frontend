'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check } from 'lucide-react';
import type { Team } from '@/lib/api/teams';

interface TeamSelectorProps {
  teams: Team[];
  selectedTeam: Team | null;
  onSelectTeam: (team: Team) => void;
}

export default function TeamSelector({ teams, selectedTeam, onSelectTeam }: TeamSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
        EQUIPE
      </label>
      
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
      >
        <span className="truncate">
          {selectedTeam ? selectedTeam.name : 'Selecione uma equipe'}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-gray-500 dark:text-gray-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 w-full mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg overflow-hidden"
          >
            <div className="max-h-64 overflow-y-auto py-1">
              {teams.map((team) => (
                <button
                  key={team.id}
                  onClick={() => {
                    onSelectTeam(team);
                    setIsOpen(false);
                  }}
                  className="w-full flex items-center justify-between px-3 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <span className={`truncate ${
                    selectedTeam?.id === team.id
                      ? 'font-medium text-brand-600 dark:text-brand-400'
                      : 'text-gray-700 dark:text-gray-300'
                  }`}>
                    {team.name}
                  </span>
                  {selectedTeam?.id === team.id && (
                    <Check className="w-4 h-4 text-brand-600 dark:text-brand-400 flex-shrink-0" />
                  )}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}