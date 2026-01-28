"use client";

import { useState, useRef, useCallback } from "react";
import Image from "next/image";
import type { Person, PersonMedia } from "../../types/persons";

/**
 * Componente PersonAvatar
 * 
 * Exibe foto de perfil com fallback para iniciais.
 * Suporta upload de nova foto quando editável.
 * 
 * Conforme REGRAS.md V1.2:
 * - Foto de perfil armazenada em person_media (media_type='profile_photo')
 * - Apenas uma foto primária por pessoa (is_primary=true)
 */

interface PersonAvatarProps {
  /** Dados da pessoa (usado para iniciais e foto) */
  person: Person;
  /** Tamanho do avatar em pixels */
  size?: "sm" | "md" | "lg" | "xl";
  /** Se permite edição (upload de nova foto) */
  editable?: boolean;
  /** Callback quando nova foto é selecionada */
  onPhotoChange?: (file: File) => Promise<void>;
  /** Callback quando foto é removida */
  onPhotoRemove?: () => Promise<void>;
  /** Classes CSS adicionais */
  className?: string;
}

// Mapeamento de tamanhos
const sizeMap = {
  sm: { container: "w-8 h-8", text: "text-xs", icon: "w-3 h-3" },
  md: { container: "w-12 h-12", text: "text-sm", icon: "w-4 h-4" },
  lg: { container: "w-20 h-20", text: "text-xl", icon: "w-6 h-6" },
  xl: { container: "w-32 h-32", text: "text-3xl", icon: "w-8 h-8" },
};

/**
 * Obtém URL da foto de perfil primária
 */
export function getProfilePhotoUrl(person: Person): string | null {
  // Primeiro, verificar se há foto nos media
  const profilePhoto = person.media?.find(
    (m) => m.media_type === "profile_photo" && m.is_primary
  );
  
  if (profilePhoto?.file_url) {
    return profilePhoto.file_url;
  }
  
  return null;
}

/**
 * Gera iniciais do nome da pessoa
 */
export function getInitials(person: Person): string {
  const first = person.first_name?.[0] || "";
  const last = person.last_name?.[0] || "";
  return (first + last).toUpperCase() || "?";
}

/**
 * Gera cor de fundo baseada no ID da pessoa (consistente)
 */
function getAvatarColor(personId: string): string {
  const colors = [
    "bg-blue-500",
    "bg-green-500",
    "bg-purple-500",
    "bg-pink-500",
    "bg-indigo-500",
    "bg-teal-500",
    "bg-orange-500",
    "bg-cyan-500",
  ];
  
  // Hash simples do ID para gerar índice consistente
  let hash = 0;
  for (let i = 0; i < personId.length; i++) {
    hash = personId.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  return colors[Math.abs(hash) % colors.length];
}

export default function PersonAvatar({
  person,
  size = "md",
  editable = false,
  onPhotoChange,
  onPhotoRemove,
  className = "",
}: PersonAvatarProps) {
  const [isHovering, setIsHovering] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [imageError, setImageError] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const photoUrl = getProfilePhotoUrl(person);
  const initials = getInitials(person);
  const bgColor = getAvatarColor(person.id);
  const sizes = sizeMap[size];
  
  const showImage = photoUrl && !imageError;
  
  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onPhotoChange) return;
    
    // Validar tipo de arquivo
    if (!file.type.startsWith("image/")) {
      alert("Por favor, selecione uma imagem válida.");
      return;
    }
    
    // Validar tamanho (máx 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("A imagem deve ter no máximo 5MB.");
      return;
    }
    
    try {
      setIsUploading(true);
      await onPhotoChange(file);
      setImageError(false); // Reset error state after successful upload
    } catch (error) {
      console.error("Erro ao fazer upload da foto:", error);
    } finally {
      setIsUploading(false);
      // Limpar input para permitir re-upload do mesmo arquivo
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }, [onPhotoChange]);
  
  const handleClick = useCallback(() => {
    if (editable && fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, [editable]);
  
  const handleRemove = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onPhotoRemove) {
      try {
        setIsUploading(true);
        await onPhotoRemove();
      } catch (error) {
        console.error("Erro ao remover foto:", error);
      } finally {
        setIsUploading(false);
      }
    }
  }, [onPhotoRemove]);
  
  return (
    <div
      className={`relative inline-block ${className}`}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {/* Avatar principal */}
      <div
        onClick={handleClick}
        className={`
          ${sizes.container}
          rounded-full
          overflow-hidden
          flex items-center justify-center
          ${showImage ? "" : bgColor}
          ${editable ? "cursor-pointer" : ""}
          transition-all duration-200
          ${isHovering && editable ? "ring-2 ring-brand-500 ring-offset-2" : ""}
        `}
      >
        {isUploading ? (
          // Loading spinner
          <div className="animate-spin rounded-full border-2 border-white border-t-transparent w-1/2 h-1/2" />
        ) : showImage ? (
          // Foto de perfil
          <Image
            src={photoUrl}
            alt={person.full_name || `${person.first_name} ${person.last_name}`}
            fill
            className="object-cover"
            onError={() => setImageError(true)}
            sizes={`${parseInt(sizes.container.split("-")[1]) * 4}px`}
          />
        ) : (
          // Iniciais como fallback
          <span className={`font-semibold text-white ${sizes.text}`}>
            {initials}
          </span>
        )}
      </div>
      
      {/* Overlay de edição */}
      {editable && isHovering && !isUploading && (
        <div
          onClick={handleClick}
          className={`
            absolute inset-0
            rounded-full
            bg-black/50
            flex items-center justify-center
            cursor-pointer
            transition-opacity duration-200
          `}
        >
          <svg
            className={`${sizes.icon} text-white`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
        </div>
      )}
      
      {/* Botão de remover foto */}
      {editable && showImage && isHovering && !isUploading && onPhotoRemove && (
        <button
          onClick={handleRemove}
          className="
            absolute -top-1 -right-1
            w-5 h-5
            bg-red-500 hover:bg-red-600
            rounded-full
            flex items-center justify-center
            text-white text-xs
            shadow-md
            transition-colors
          "
          title="Remover foto"
        >
          ×
        </button>
      )}
      
      {/* Input file oculto */}
      {editable && (
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
      )}
    </div>
  );
}

/**
 * Componente simplificado para exibição apenas (sem edição)
 */
export function AvatarDisplay({
  person,
  size = "md",
  className = "",
}: {
  person: Person;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}) {
  return (
    <PersonAvatar
      person={person}
      size={size}
      editable={false}
      className={className}
    />
  );
}

/**
 * Avatar com nome ao lado
 */
export function AvatarWithName({
  person,
  size = "md",
  showNickname = false,
  className = "",
}: {
  person: Person;
  size?: "sm" | "md" | "lg";
  showNickname?: boolean;
  className?: string;
}) {
  const fullName = person.full_name || `${person.first_name} ${person.last_name || ""}`.trim();
  
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <PersonAvatar person={person} size={size} editable={false} />
      <div>
        <p className="font-medium text-gray-900 dark:text-white">
          {fullName}
        </p>
        {showNickname && person.nickname && (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            &quot;{person.nickname}&quot;
          </p>
        )}
      </div>
    </div>
  );
}
