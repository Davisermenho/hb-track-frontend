"use client";

import React, { useState, useRef, useEffect } from "react";
import { AthletesFilters, AthleteCategoryType, AthleteSportStatus } from "../../types/athletes";

interface AthletesFilterProps {
  teams: { id: string; name: string }[];
  onFilterChange: (filters: AthletesFilters) => void;
  filters: AthletesFilters;
}

const CATEGORIES: { label: string; value: AthleteCategoryType }[] = [
  { label: "Infantil", value: "infantil" },
  { label: "Cadete", value: "cadete" },
  { label: "Juvenil", value: "juvenil" },
  { label: "Sênior", value: "senior" },
];

const SPORT_STATUS: { label: string; value: AthleteSportStatus }[] = [
  { label: "Ativa", value: "ativa" },
  { label: "Dispensada", value: "dispensada" },
  { label: "Arquivada", value: "arquivada" },
];

interface DropdownFilterProps {
  placeholder: string;
  options: { label: string; value: string }[];
  value: string[];
  onChange: (value: string[]) => void;
}

const DropdownFilter: React.FC<DropdownFilterProps> = ({
  placeholder,
  options,
  value,
  onChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleToggle = (optionValue: string) => {
    if (value.includes(optionValue)) {
      onChange(value.filter((v) => v !== optionValue));
    } else {
      onChange([...value, optionValue]);
    }
  };

  const displayText = value.length > 0
    ? `${placeholder} (${value.length})`
    : placeholder;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-between min-w-[120px] px-3 py-2 text-sm border rounded-lg bg-white dark:bg-gray-800 ${
          value.length > 0 
            ? "border-brand-500 text-brand-600 dark:text-brand-400" 
            : "border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300"
        } hover:border-gray-400 dark:hover:border-gray-500 transition-colors`}
      >
        <span className="truncate">{displayText}</span>
        <svg
          className={`w-4 h-4 ml-2 transition-transform flex-shrink-0 ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute z-50 w-48 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-48 overflow-y-auto">
          {options.map((option) => (
            <label
              key={option.value}
              className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <input
                type="checkbox"
                checked={value.includes(option.value)}
                onChange={() => handleToggle(option.value)}
                className="rounded text-brand-500 focus:ring-brand-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {option.label}
              </span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
};

export default function AthletesFilter({
  teams,
  onFilterChange,
  filters,
}: AthletesFilterProps) {
  const teamsOptions = teams.map((team) => ({
    label: team.name,
    value: team.id,
  }));

  const handleTeamChange = (selectedTeams: string[]) => {
    onFilterChange({
      ...filters,
      team_ids: selectedTeams.length > 0 ? selectedTeams : undefined,
    });
  };

  const handleCategoryChange = (selectedCategories: string[]) => {
    onFilterChange({
      ...filters,
      categories:
        selectedCategories.length > 0
          ? (selectedCategories as AthleteCategoryType[])
          : undefined,
    });
  };

  const handleStatusChange = (selectedStatus: string[]) => {
    onFilterChange({
      ...filters,
      sport_status:
        selectedStatus.length > 0
          ? (selectedStatus as AthleteSportStatus[])
          : undefined,
    });
  };

  const handleReset = () => {
    onFilterChange({});
  };

  const hasFilters = 
    (filters.team_ids && filters.team_ids.length > 0) ||
    (filters.categories && filters.categories.length > 0) ||
    (filters.sport_status && filters.sport_status.length > 0);

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <DropdownFilter
        placeholder="Equipe"
        options={teamsOptions}
        value={filters.team_ids || []}
        onChange={handleTeamChange}
      />

      <DropdownFilter
        placeholder="Categoria"
        options={CATEGORIES.map((c) => ({ label: c.label, value: c.value }))}
        value={(filters.categories || []) as string[]}
        onChange={handleCategoryChange}
      />

      <DropdownFilter
        placeholder="Status"
        options={SPORT_STATUS.map((s) => ({ label: s.label, value: s.value }))}
        value={(filters.sport_status || []) as string[]}
        onChange={handleStatusChange}
      />

      {hasFilters && (
        <button
          onClick={handleReset}
          className="px-3 py-2 text-xs font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
        >
          Limpar
        </button>
      )}
    </div>
  );
}
