'use client';

import { useState, useCallback, useRef } from 'react';
import { useFormContext } from 'react-hook-form';
import { motion } from 'framer-motion';
import { Upload, User, Check, X, Camera, RefreshCw, AlertTriangle } from 'lucide-react';
import Image from 'next/image';

interface PhotoUploadProps {
  name: string;
  label?: string;
}

export function PhotoUpload({ name, label = 'Foto de Perfil' }: PhotoUploadProps) {
  const { setValue, watch } = useFormContext();
  const currentPhotoUrl = watch(name);

  const [isDragging, setIsDragging] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentPhotoUrl || null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback(
    (file: File) => {
      if (!file.type.startsWith('image/')) {
        setUploadError('Apenas imagens são permitidas.');
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        setUploadError('Arquivo muito grande: máximo 5MB.');
        return;
      }

      setUploadError(null);

      // Armazenar o arquivo para upload posterior
      setSelectedFile(file);

      // Criar preview local (base64)
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64String = e.target?.result as string;
        setPreview(base64String);
        // Salvar o base64 no formulário temporariamente
        setValue(name, base64String);
      };
      reader.readAsDataURL(file);
    },
    [name, setValue]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        handleFileSelect(files[0]);
      }
    },
    [handleFileSelect]
  );

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        handleFileSelect(files[0]);
      }
    },
    [handleFileSelect]
  );

  const handleRemove = useCallback(() => {
    setPreview(null);
    setSelectedFile(null);
    setValue(name, '');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [name, setValue]);

  const hasPhoto = !!preview;

  return (
    <div className="mb-5">
      <label className="block mb-3">
        <span className="text-theme-sm font-medium text-gray-700 dark:text-gray-300">{label}</span>
        <span className="text-xs text-gray-500 dark:text-gray-600 ml-2">(Opcional)</span>
      </label>

      <div className="flex flex-col md:flex-row items-center gap-6">
        <div className="relative">
          <motion.div
            className={`
              relative size-32 rounded-full overflow-hidden border-4
              ${hasPhoto ? 'border-success-500' : 'border-gray-300 dark:border-gray-700'}
              bg-gray-100 dark:bg-gray-800
              shadow-xl
            `}
          >
            {preview ? (
              <Image src={preview} alt="Preview" fill className="object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <User className="size-16 text-gray-400" strokeWidth={1.5} />
              </div>
            )}

            {hasPhoto && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', duration: 0.5 }}
                className="absolute bottom-0 right-0 size-10 bg-success-500 rounded-full flex items-center justify-center border-4 border-white dark:border-gray-900 shadow-lg"
              >
                <Check className="size-5 text-white" strokeWidth={3} />
              </motion.div>
            )}
          </motion.div>

          {hasPhoto && (
            <motion.button
              type="button"
              onClick={handleRemove}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className="absolute -top-2 -right-2 size-8 bg-error-500 hover:bg-error-600 rounded-full flex items-center justify-center shadow-lg transition-colors"
            >
              <X className="size-4 text-white" />
            </motion.button>
          )}
        </div>

        <div className="flex-1 w-full">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileInputChange}
            className="hidden"
          />

          <motion.div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            whileHover={{ scale: 1.02 }}
            className={`
              relative border-2 border-dashed rounded-xl p-8
              transition-all duration-300 cursor-pointer
              ${isDragging ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/20' : 'border-gray-300 dark:border-gray-700 hover:border-brand-400 dark:hover:border-brand-600'}
            `}
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="flex flex-col items-center text-center">
              <motion.div
                animate={isDragging ? { y: -5 } : { y: 0 }}
                className={`
                  size-12 rounded-full flex items-center justify-center mb-3
                  ${isDragging ? 'bg-brand-500' : 'bg-gray-100 dark:bg-gray-800'}
                `}
              >
                {isDragging ? <Upload className="size-6 text-white" /> : <Camera className="size-6 text-gray-400" />}
              </motion.div>

              <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                {isDragging ? 'Solte a foto aqui' : 'Clique ou arraste uma foto'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-600">PNG, JPG ou WEBP até 5MB</p>

              <div className="mt-4 flex items-center gap-2 text-xs text-gray-500">
                <div className="size-2 bg-blue-500 rounded-full" />
                A foto será enviada ao finalizar o cadastro
              </div>
            </div>
          </motion.div>

          {hasPhoto && (
            <div className="flex gap-2 mt-3">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <RefreshCw className="size-4" />
                Trocar Foto
              </button>
            </div>
          )}
        </div>
      </div>

      {uploadError && (
        <div className="mt-3 p-3 rounded-lg border border-warning-200 dark:border-warning-800 bg-warning-50 dark:bg-warning-950/40 text-xs text-warning-800 dark:text-warning-200 flex items-start gap-2">
          <AlertTriangle className="size-4 mt-0.5" />
          <div className="flex-1">
            <p>{uploadError}</p>
          </div>
        </div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-4 p-3 bg-blue-light-50 dark:bg-blue-light-950/30 rounded-lg border border-blue-light-200 dark:border-blue-light-900"
      >
        <p className="text-xs text-blue-light-700 dark:text-blue-light-400">
          <strong>Dica:</strong> Fotos com fundo claro e rosto bem iluminado ficam melhores. A foto será enviada
          de forma segura ao Cloudinary somente quando você finalizar todo o cadastro.
        </p>
      </motion.div>
    </div>
  );
}

// Hook para obter o arquivo selecionado (usado pelo form ao submeter)
export function usePhotoFile(name: string) {
  const { watch } = useFormContext();
  const photoValue = watch(name);

  // Se for base64, retornar o arquivo
  if (photoValue && photoValue.startsWith('data:image')) {
    return photoValue;
  }

  return null;
}
