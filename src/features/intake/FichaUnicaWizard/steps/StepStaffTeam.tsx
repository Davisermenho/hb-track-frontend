'use client';

import { useState, useEffect } from 'react';
import { useFormContext } from 'react-hook-form';
import { motion } from 'framer-motion';
import { Users2, Info } from 'lucide-react';
import { FormField } from '../components/FormField';
import { FichaUnicaPayload } from '../types';
import { apiClient } from '@/lib/api/client';

interface Category {
  id: number;
  name: string;
}

interface Season {
  id: string;
  title: string;
  year: number;
}

interface Organization {
  id: string;
  name: string;
}

export function StepStaffTeam() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [categoriesRes, seasonsRes, orgsRes] = await Promise.all([
          apiClient.get('/categories'),
          apiClient.get('/seasons'),
          apiClient.get('/organizations'),
        ]);
        
        console.log('Categories raw:', (categoriesRes as any).data);
        console.log('Seasons raw:', (seasonsRes as any).data);
        console.log('Organizations raw:', (orgsRes as any).data);
        
        const cats = (categoriesRes as any).data || [];
        const seas = (seasonsRes as any).data || [];
        const orgs = (orgsRes as any).data || [];
        
        console.log('First category:', cats[0]);
        console.log('First season:', seas[0]);
        console.log('First organization:', orgs[0]);
        
        setCategories(cats);
        setSeasons(seas);
        setOrganizations(orgs);
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-600 dark:text-gray-400">Carregando...</div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center gap-3 p-4 bg-brand-50 dark:bg-brand-950/30 rounded-lg border border-brand-200 dark:border-brand-900">
        <Users2 className="size-6 text-brand-600 dark:text-brand-400 flex-shrink-0" />
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Cadastro de Equipe</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">Crie uma nova equipe para a organização</p>
        </div>
      </div>

      {/* Form Fields */}
      <div className="space-y-4">
        <FormField
          name="staffTeam.name"
          label="Nome da Equipe"
          type="text"
          placeholder="Ex: Equipe Masculina Sub-15"
          required
        />

        {/* Temporada + Organização */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            name="staffTeam.season_id"
            label="Temporada"
            type="select"
            required
            options={seasons.map(s => ({ 
              value: String(s.id), 
              label: `${s.title} (${s.year})` 
            }))}
          />

          <FormField
            name="staffTeam.organization_id"
            label="Organização"
            type="select"
            required
            options={organizations.map(o => ({ 
              value: String(o.id), 
              label: o.name 
            }))}
          />
        </div>

        {/* Categoria + Gênero */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            name="staffTeam.category_id"
            label="Categoria"
            type="select"
            required
            options={categories.map(c => ({ 
              value: String(c.id), 
              label: c.name 
            }))}
          />

          <FormField
            name="staffTeam.gender"
            label="Gênero"
            type="select"
            required
            options={[
              { value: 'masculino', label: 'Masculino' },
              { value: 'feminino', label: 'Feminino' },
            ]}
          />
        </div>

        <FormField
          name="staffTeam.notes"
          label="Observações"
          type="textarea"
          placeholder="Informações adicionais sobre a equipe (opcional)"
          rows={4}
        />
      </div>

      {/* Info Box */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start gap-3 p-4 bg-blue-light-50 dark:bg-blue-light-950/30 rounded-lg border border-blue-light-200 dark:border-blue-light-900"
      >
        <Info className="size-5 text-blue-light-600 dark:text-blue-light-400 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h4 className="text-sm font-semibold text-blue-light-800 dark:text-blue-light-300 mb-1">
            Sobre a Equipe
          </h4>
          <p className="text-sm text-blue-light-700 dark:text-blue-light-400">
            A equipe será vinculada à temporada e organização selecionadas. Após a conclusão, você poderá
            cadastrar atletas, treinadores e outros membros da equipe.
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}
