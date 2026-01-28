/**
 * PDFUploadStep - Etapa de upload do PDF do regulamento
 * 
 * Features:
 * - Drag & drop de arquivo PDF
 * - Campo para nome da equipe (identificação)
 * - Campo para dicas opcionais à IA
 * - Preview do arquivo selecionado
 */

'use client';

import { useState, useCallback, useRef } from 'react';
import { Upload, FileText, X, Sparkles, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCompetitionV2Context } from '@/context/CompetitionV2Context';

interface PDFUploadStepProps {
  onNext: () => void;
}

export default function PDFUploadStep({ onNext }: PDFUploadStepProps) {
  const {
    uploadedFile,
    setUploadedFile,
    ourTeamName,
    setOurTeamName,
    hints,
    setHints,
  } = useCompetitionV2Context();
  
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const validateFile = (file: File): boolean => {
    if (file.type !== 'application/pdf') {
      setError('Apenas arquivos PDF são aceitos');
      return false;
    }
    if (file.size > 10 * 1024 * 1024) { // 10MB
      setError('O arquivo deve ter no máximo 10MB');
      return false;
    }
    setError(null);
    return true;
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const file = e.dataTransfer.files[0];
    if (file && validateFile(file)) {
      setUploadedFile(file);
    }
  }, [setUploadedFile]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && validateFile(file)) {
      setUploadedFile(file);
    }
  }, [setUploadedFile]);

  const handleRemoveFile = useCallback(() => {
    setUploadedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [setUploadedFile]);

  const canProceed = uploadedFile && ourTeamName.trim().length >= 2;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (canProceed) {
      onNext();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/30 mb-4">
          <Sparkles className="w-8 h-8 text-amber-600 dark:text-amber-400" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Importar com IA
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Envie o PDF do regulamento e nossa IA preencherá os dados automaticamente
        </p>
      </div>

      {/* Upload Area */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Arquivo do Regulamento *
        </label>
        
        {!uploadedFile ? (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              'relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all',
              isDragOver
                ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20'
                : 'border-gray-300 dark:border-gray-600 hover:border-amber-400 dark:hover:border-amber-500',
              error && 'border-red-500 bg-red-50 dark:bg-red-900/20'
            )}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              onChange={handleFileSelect}
              className="hidden"
            />
            
            <Upload className={cn(
              'w-12 h-12 mx-auto mb-4',
              isDragOver ? 'text-amber-500' : 'text-gray-400'
            )} />
            
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
              <span className="font-medium text-amber-600 dark:text-amber-400">
                Clique para selecionar
              </span>
              {' '}ou arraste o arquivo aqui
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500">
              PDF até 10MB
            </p>
          </div>
        ) : (
          <div className="flex items-center gap-4 p-4 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800/50">
            <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center bg-red-100 dark:bg-red-900/30 rounded-lg">
              <FileText className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {uploadedFile.name}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
            <button
              type="button"
              onClick={handleRemoveFile}
              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}
        
        {error && (
          <p className="mt-2 text-sm text-red-500">{error}</p>
        )}
      </div>

      {/* Team Name */}
      <div>
        <label 
          htmlFor="ourTeamName" 
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
        >
          Nome da sua equipe *
        </label>
        <input
          type="text"
          id="ourTeamName"
          value={ourTeamName}
          onChange={(e) => setOurTeamName(e.target.value)}
          placeholder="Ex: Handebol Clube ABC"
          className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 
                   bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                   placeholder-gray-400 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
        />
        <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
          A IA usará este nome para identificar seus jogos na tabela
        </p>
      </div>

      {/* Hints (Optional) */}
      <div>
        <label 
          htmlFor="hints" 
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
        >
          Dicas para a IA (opcional)
        </label>
        <textarea
          id="hints"
          value={hints}
          onChange={(e) => setHints(e.target.value)}
          placeholder="Ex: Categoria Sub-18 Feminino, jogos aos sábados..."
          rows={3}
          className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 
                   bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                   placeholder-gray-400 focus:ring-2 focus:ring-amber-500 focus:border-transparent
                   resize-none"
        />
      </div>

      {/* Info Box */}
      <div className="flex gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-700 dark:text-blue-300">
          <p className="font-medium mb-1">Como funciona?</p>
          <ul className="list-disc list-inside space-y-1 text-blue-600 dark:text-blue-400">
            <li>Nossa IA lê o PDF e extrai automaticamente os dados</li>
            <li>Você revisa e ajusta o que for necessário</li>
            <li>Confirma e salva - pronto!</li>
          </ul>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end pt-4">
        <button
          type="submit"
          disabled={!canProceed}
          className={cn(
            'inline-flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium transition-all',
            canProceed
              ? 'bg-amber-600 text-white hover:bg-amber-700 shadow-md hover:shadow-lg'
              : 'bg-gray-200 text-gray-400 dark:bg-gray-700 dark:text-gray-500 cursor-not-allowed'
          )}
        >
          <Sparkles className="w-4 h-4" />
          Processar com IA
        </button>
      </div>
    </form>
  );
}
