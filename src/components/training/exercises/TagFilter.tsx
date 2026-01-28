/**
 * TagFilter Component
 * Step 20: Frontend de Exercícios
 * 
 * Filtro hierárquico de tags com:
 * - Tree view expandível
 * - Multi-seleção com checkboxes
 * - Operador AND/OR
 * - Pills de tags selecionadas
 */

'use client';

import React, { useState, useMemo } from 'react';
import { ExerciseTag } from '@/lib/api/exercises';
import { Icons } from '@/design-system/icons';

interface TagFilterProps {
  tags: ExerciseTag[];
  selectedTagIds: string[];
  onSelectedChange: (tagIds: string[]) => void;
  tagOperator?: 'AND' | 'OR';
  onOperatorChange?: (operator: 'AND' | 'OR') => void;
  showOperator?: boolean;
  maxHeight?: string;
}

export function TagFilter({
  tags,
  selectedTagIds,
  onSelectedChange,
  tagOperator = 'AND',
  onOperatorChange,
  showOperator = true,
  maxHeight = '400px',
}: TagFilterProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');

  // Filtrar tags ativas
  const activeTags = useMemo(() => {
    return tags.filter(tag => tag.is_active);
  }, [tags]);

  // Filtrar por busca
  const filteredTags = useMemo(() => {
    if (!searchTerm) return activeTags;
    
    const searchLower = searchTerm.toLowerCase();
    return activeTags.filter(tag => 
      tag.name.toLowerCase().includes(searchLower) ||
      tag.description?.toLowerCase().includes(searchLower)
    );
  }, [activeTags, searchTerm]);

  const handleToggleExpand = (tagId: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(tagId)) {
        next.delete(tagId);
      } else {
        next.add(tagId);
      }
      return next;
    });
  };

  const handleToggleTag = (tagId: string, tag: ExerciseTag) => {
    const isSelected = selectedTagIds.includes(tagId);
    
    if (isSelected) {
      // Remover tag e todos os filhos
      const idsToRemove = getAllDescendantIds(tag);
      onSelectedChange(selectedTagIds.filter(id => !idsToRemove.includes(id)));
    } else {
      // Adicionar tag
      onSelectedChange([...selectedTagIds, tagId]);
    }
  };

  const handleSelectAll = (tag: ExerciseTag) => {
    const allIds = getAllDescendantIds(tag);
    const allSelected = allIds.every(id => selectedTagIds.includes(id));
    
    if (allSelected) {
      onSelectedChange(selectedTagIds.filter(id => !allIds.includes(id)));
    } else {
      const newIds = [...new Set([...selectedTagIds, ...allIds])];
      onSelectedChange(newIds);
    }
  };

  const handleClearAll = () => {
    onSelectedChange([]);
  };

  const selectedTags = useMemo(() => {
    return tags.filter(t => selectedTagIds.includes(t.id));
  }, [tags, selectedTagIds]);

  return (
    <div className="space-y-4">
      {/* Header com busca */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Filtrar por Tags
          </label>
          {selectedTagIds.length > 0 && (
            <button
              type="button"
              onClick={handleClearAll}
              className="text-xs text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
            >
              Limpar tudo
            </button>
          )}
        </div>

        {/* Search input */}
        <div className="relative">
          <Icons.Actions.Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar tags..."
            className="
              w-full pl-9 pr-3 py-2 
              bg-white dark:bg-gray-800
              border border-gray-300 dark:border-gray-600
              rounded-lg text-sm
              focus:outline-none focus:ring-2 focus:ring-blue-500
            "
          />
        </div>
      </div>

      {/* Operador AND/OR */}
      {showOperator && onOperatorChange && selectedTagIds.length > 1 && (
        <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <span className="text-sm text-gray-600 dark:text-gray-400">Filtro:</span>
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => onOperatorChange('AND')}
              className={`
                px-3 py-1 text-sm font-medium rounded-md transition-colors
                ${tagOperator === 'AND'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                }
              `}
            >
              E (AND)
            </button>
            <button
              type="button"
              onClick={() => onOperatorChange('OR')}
              className={`
                px-3 py-1 text-sm font-medium rounded-md transition-colors
                ${tagOperator === 'OR'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                }
              `}
            >
              OU (OR)
            </button>
          </div>
          <span className="text-xs text-gray-500 dark:text-gray-400 ml-auto">
            {tagOperator === 'AND' ? 'Possui todas as tags' : 'Possui ao menos uma tag'}
          </span>
        </div>
      )}

      {/* Selected tags pills */}
      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedTags.map((tag) => (
            <span
              key={tag.id}
              className="
                inline-flex items-center gap-1 px-2 py-1
                bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400
                rounded-md text-sm
              "
            >
              {tag.name}
              <button
                onClick={() => handleToggleTag(tag.id, tag)}
                className="hover:text-blue-900 dark:hover:text-blue-200"
              >
                <Icons.Status.Close className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Tree view */}
      <div
        className="
          border border-gray-300 dark:border-gray-600 
          rounded-lg overflow-y-auto bg-white dark:bg-gray-800
        "
        style={{ maxHeight }}
      >
        {filteredTags.length === 0 ? (
          <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
            {searchTerm ? 'Nenhuma tag encontrada' : 'Nenhuma tag disponível'}
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {filteredTags
              .filter(tag => !tag.parent_tag_id) // Tags raiz
              .map((tag) => (
                <TagTreeItem
                  key={tag.id}
                  tag={tag}
                  level={0}
                  isExpanded={expandedIds.has(tag.id)}
                  isSelected={selectedTagIds.includes(tag.id)}
                  selectedTagIds={selectedTagIds}
                  onToggleExpand={handleToggleExpand}
                  onToggleTag={handleToggleTag}
                  onSelectAll={handleSelectAll}
                />
              ))}
          </div>
        )}
      </div>

      {/* Counter */}
      <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
        {selectedTagIds.length} tag(s) selecionada(s)
      </div>
    </div>
  );
}

// ==================== TAG TREE ITEM ====================

interface TagTreeItemProps {
  tag: ExerciseTag;
  level: number;
  isExpanded: boolean;
  isSelected: boolean;
  selectedTagIds: string[];
  onToggleExpand: (tagId: string) => void;
  onToggleTag: (tagId: string, tag: ExerciseTag) => void;
  onSelectAll: (tag: ExerciseTag) => void;
}

function TagTreeItem({
  tag,
  level,
  isExpanded,
  isSelected,
  selectedTagIds,
  onToggleExpand,
  onToggleTag,
  onSelectAll,
}: TagTreeItemProps) {
  const hasChildren = tag.children && tag.children.length > 0;
  const indentClass = `pl-${level * 4}`;
  
  // Verificar se todos os filhos estão selecionados
  const allChildrenSelected = useMemo(() => {
    if (!hasChildren) return false;
    const childIds = getAllDescendantIds(tag);
    return childIds.every(id => selectedTagIds.includes(id));
  }, [hasChildren, tag, selectedTagIds]);

  const someChildrenSelected = useMemo(() => {
    if (!hasChildren) return false;
    const childIds = getAllDescendantIds(tag);
    return childIds.some(id => selectedTagIds.includes(id)) && !allChildrenSelected;
  }, [hasChildren, tag, selectedTagIds, allChildrenSelected]);

  return (
    <div>
      {/* Tag row */}
      <div
        className={`
          flex items-center gap-2 p-2 rounded-md
          hover:bg-gray-100 dark:hover:bg-gray-700
          ${isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : ''}
        `}
        style={{ paddingLeft: `${level * 1}rem` }}
      >
        {/* Expand button */}
        {hasChildren ? (
          <button
            onClick={() => onToggleExpand(tag.id)}
            className="flex-shrink-0 p-0.5 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
          >
            {isExpanded ? (
              <Icons.Navigation.Down className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            ) : (
              <Icons.Navigation.Right className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            )}
          </button>
        ) : (
          <div className="w-5" />
        )}

        {/* Checkbox */}
        <input
          type="checkbox"
          checked={isSelected}
          ref={(el) => {
            if (el) {
              el.indeterminate = someChildrenSelected;
            }
          }}
          onChange={() => onToggleTag(tag.id, tag)}
          className="
            w-4 h-4 rounded border-gray-300 dark:border-gray-600
            text-blue-600 focus:ring-blue-500
          "
        />

        {/* Tag name */}
        <span className="flex-1 text-sm text-gray-900 dark:text-white">
          {tag.name}
        </span>

        {/* Children count */}
        {hasChildren && (
          <span className="text-xs text-gray-500 dark:text-gray-400">
            ({tag.children?.length || 0})
          </span>
        )}

        {/* Select all children */}
        {hasChildren && (
          <button
            onClick={() => onSelectAll(tag)}
            className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
          >
            {allChildrenSelected ? 'Desmarcar todos' : 'Marcar todos'}
          </button>
        )}
      </div>

      {/* Children */}
      {hasChildren && isExpanded && tag.children && (
        <div>
          {tag.children
            .sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
            .map((child) => (
              <TagTreeItem
                key={child.id}
                tag={child}
                level={level + 1}
                isExpanded={expandedIds.has(child.id)}
                isSelected={selectedTagIds.includes(child.id)}
                selectedTagIds={selectedTagIds}
                onToggleExpand={onToggleExpand}
                onToggleTag={onToggleTag}
                onSelectAll={onSelectAll}
              />
            ))}
        </div>
      )}
    </div>
  );
}

// ==================== HELPERS ====================

function getAllDescendantIds(tag: ExerciseTag): string[] {
  const ids = [tag.id];
  if (tag.children) {
    tag.children.forEach(child => {
      ids.push(...getAllDescendantIds(child));
    });
  }
  return ids;
}

// Set para rastrear IDs expandidos fora do componente
const expandedIds = new Set<string>();
