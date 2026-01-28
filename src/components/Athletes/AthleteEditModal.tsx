"use client";

import React, { useState, useEffect } from "react";
import { Athlete, AthleteCategoryType, OffensivePosition, DefensivePosition } from "../../types/athletes";
import { CloseIcon } from "@/icons";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";

interface AthleteEditModalProps {
  athlete: Athlete | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (athlete: Athlete) => void;
}

const CATEGORIES: { label: string; value: AthleteCategoryType }[] = [
  { label: "Infantil", value: "infantil" },
  { label: "Cadete", value: "cadete" },
  { label: "Juvenil", value: "juvenil" },
  { label: "Sênior", value: "senior" },
];

const OFFENSIVE_POSITIONS: OffensivePosition[] = [
  "Armadora Central",
  "Lateral Esquerda",
  "Lateral Direita",
  "Pivô",
  "Ponta Esquerda",
  "Ponta Direita",
];

const DEFENSIVE_POSITIONS: DefensivePosition[] = [
  "1ª Defensora",
  "2ª Defensora",
  "Defensora Base",
  "Defensora Avançada",
  "Goleira",
];

export default function AthleteEditModal({
  athlete,
  isOpen,
  onClose,
  onSave,
}: AthleteEditModalProps) {
  const [formData, setFormData] = useState({
    phone: "",
    email: "",
    jersey_number: "",
    category: "senior" as AthleteCategoryType,
    offensive_primary: "Armadora Central" as OffensivePosition,
    offensive_secondary: "",
    defensive_primary: "1ª Defensora" as DefensivePosition,
    defensive_secondary: "",
  });

  useEffect(() => {
    if (athlete) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFormData({
        phone: athlete.phone || "",
        email: athlete.email || "",
        jersey_number: athlete.jersey_number || "",
        category: athlete.category,
        offensive_primary: athlete.positions.offensive_primary,
        offensive_secondary: athlete.positions.offensive_secondary || "",
        defensive_primary: athlete.positions.defensive_primary,
        defensive_secondary: athlete.positions.defensive_secondary || "",
      });
    }
  }, [athlete]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!athlete) return;
    
    onSave({
      ...athlete,
      phone: formData.phone || undefined,
      email: formData.email || undefined,
      jersey_number: formData.jersey_number || undefined,
      category: formData.category,
      positions: {
        offensive_primary: formData.offensive_primary,
        offensive_secondary: formData.offensive_secondary as OffensivePosition || undefined,
        defensive_primary: formData.defensive_primary,
        defensive_secondary: formData.defensive_secondary as DefensivePosition || undefined,
      },
    });
    onClose();
  };

  if (!isOpen || !athlete) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-hidden mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Editar Atleta
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">{athlete.name}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <CloseIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit}>
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)] space-y-4">
            {/* Contato */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Telefone</Label>
                <Input
                  type="tel"
                  placeholder="(00) 00000-0000"
                  defaultValue={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  placeholder="email@exemplo.com"
                  defaultValue={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>

            {/* Camisa e Categoria */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Nº da Camisa</Label>
                <Input
                  type="text"
                  placeholder="00"
                  defaultValue={formData.jersey_number}
                  onChange={(e) => setFormData({ ...formData, jersey_number: e.target.value })}
                />
              </div>
              <div>
                <Label>Categoria</Label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as AthleteCategoryType })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Posições Ofensivas */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Posição Ofensiva (Principal)</Label>
                <select
                  value={formData.offensive_primary}
                  onChange={(e) => setFormData({ ...formData, offensive_primary: e.target.value as OffensivePosition })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                >
                  {OFFENSIVE_POSITIONS.map((pos) => (
                    <option key={pos} value={pos}>
                      {pos}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Posição Ofensiva (Secundária)</Label>
                <select
                  value={formData.offensive_secondary}
                  onChange={(e) => setFormData({ ...formData, offensive_secondary: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                >
                  <option value="">Nenhuma</option>
                  {OFFENSIVE_POSITIONS.map((pos) => (
                    <option key={pos} value={pos}>
                      {pos}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Posições Defensivas */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Posição Defensiva (Principal)</Label>
                <select
                  value={formData.defensive_primary}
                  onChange={(e) => setFormData({ ...formData, defensive_primary: e.target.value as DefensivePosition })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                >
                  {DEFENSIVE_POSITIONS.map((pos) => (
                    <option key={pos} value={pos}>
                      {pos}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Posição Defensiva (Secundária)</Label>
                <select
                  value={formData.defensive_secondary}
                  onChange={(e) => setFormData({ ...formData, defensive_secondary: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                >
                  <option value="">Nenhuma</option>
                  {DEFENSIVE_POSITIONS.map((pos) => (
                    <option key={pos} value={pos}>
                      {pos}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-brand-500 hover:bg-brand-600 rounded-lg transition-colors"
            >
              Salvar Alterações
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
