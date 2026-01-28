/**
 * Seção Upload de Foto - Ficha Única
 * 
 * Upload via person_media com:
 * - Remoção de fundo obrigatória (backend via rembg)
 * - Formatos: JPG/JPEG/PNG
 * - Tamanho máximo: 2MB
 */

'use client';

import { useState, useRef } from 'react';
import { Camera, Upload, X, AlertCircle, Image as ImageIcon } from 'lucide-react';
import NextImage from 'next/image';
import CollapsibleSection from '@/components/form/CollapsibleSection';

interface PhotoSectionProps {
  preview: string | null;
  onFileChange: (file: File | null) => void;
  error?: string;
}

// Limite de 2MB
const MAX_FILE_SIZE = 2 * 1024 * 1024;
const ACCEPTED_TYPES = ['image/jpeg', 'image/jpg', 'image/png'];

export default function PhotoSection({
  preview,
  onFileChange,
  error,
}: PhotoSectionProps) {
  const [dragActive, setDragActive] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const validateFile = (file: File): string | null => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      return 'Formato inválido. Use JPG, JPEG ou PNG.';
    }
    if (file.size > MAX_FILE_SIZE) {
      return 'Arquivo muito grande. Tamanho máximo: 2MB.';
    }
    return null;
  };
  
  const handleFileSelect = (file: File | null) => {
    if (!file) {
      onFileChange(null);
      setLocalError(null);
      return;
    }
    
    const validationError = validateFile(file);
    if (validationError) {
      setLocalError(validationError);
      return;
    }
    
    setLocalError(null);
    onFileChange(file);
  };
  
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };
  
  const handleRemove = () => {
    handleFileSelect(null);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };
  
  const displayError = error || localError;
  
  return (
    <CollapsibleSection
      title="Foto de Perfil"
      defaultOpen={false}
    >
      <div className="space-y-4">
        {/* Área de Preview / Upload */}
        <div className="flex items-start gap-6">
          {/* Preview da foto */}
          <div className="flex-shrink-0">
            <div className={`
              w-32 h-32 rounded-full overflow-hidden border-2
              ${preview 
                ? 'border-brand-500' 
                : 'border-gray-300 dark:border-gray-600 border-dashed'
              }
              flex items-center justify-center bg-gray-50 dark:bg-gray-800
            `}>
              {preview ? (
                <NextImage
                  src={preview}
                  alt="Preview da foto"
                  fill
                  className="object-cover"
                />
              ) : (
                <Camera className="w-10 h-10 text-gray-400" />
              )}
            </div>
          </div>
          
          {/* Área de upload */}
          <div className="flex-1">
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`
                relative border-2 border-dashed rounded-lg p-6 text-center transition-colors
                ${dragActive
                  ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20'
                  : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                }
              `}
            >
              <input
                ref={inputRef}
                type="file"
                accept=".jpg,.jpeg,.png"
                onChange={handleInputChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              
              <div className="flex flex-col items-center">
                <div className={`
                  w-12 h-12 rounded-full flex items-center justify-center mb-3
                  ${dragActive
                    ? 'bg-brand-100 dark:bg-brand-900/40'
                    : 'bg-gray-100 dark:bg-gray-800'
                  }
                `}>
                  <Upload className={`w-6 h-6 ${dragActive ? 'text-brand-500' : 'text-gray-500'}`} />
                </div>
                
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {dragActive ? 'Solte a imagem aqui' : 'Arraste uma imagem ou clique para selecionar'}
                </p>
                
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  JPG, JPEG ou PNG • Máximo 2MB
                </p>
              </div>
            </div>
            
            {/* Ações quando há preview */}
            {preview && (
              <div className="mt-3 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  className="text-sm text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1"
                >
                  <ImageIcon className="w-4 h-4" />
                  Trocar foto
                </button>
                <button
                  type="button"
                  onClick={handleRemove}
                  className="text-sm text-error-600 dark:text-error-400 hover:underline flex items-center gap-1"
                >
                  <X className="w-4 h-4" />
                  Remover
                </button>
              </div>
            )}
          </div>
        </div>
        
        {/* Erro */}
        {displayError && (
          <div className="flex items-start gap-2 p-3 bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800 rounded-lg">
            <AlertCircle className="w-5 h-5 text-error-500 flex-shrink-0" />
            <p className="text-sm text-error-700 dark:text-error-300">{displayError}</p>
          </div>
        )}
        
        {/* Informações */}
        <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <p className="text-xs text-gray-600 dark:text-gray-400">
            <strong>Dica:</strong> A foto será processada automaticamente para remover o fundo.
            Use uma imagem com boa iluminação e fundo simples para melhores resultados.
          </p>
        </div>
      </div>
    </CollapsibleSection>
  );
}
