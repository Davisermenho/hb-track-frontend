/**
 * Componentes de Formulário - Exportações centralizadas
 * 
 * FASE 3 - Validações e Regras de Negócio
 * 
 * Componentes disponíveis:
 * - TeamSelector: Seleção de equipe com validação R15 e gênero
 * - CEPField: Campo CEP com autocompletar ViaCEP
 * - CPFField: Campo CPF com validação de dígitos verificadores
 * - RGField: Campo RG com validação de formato
 */

export { default as TeamSelector } from "./TeamSelector";
export { default as CEPField } from "./CEPField";
export { default as CPFField, cleanCPF, formatCPF, isValidCPF } from "./CPFField";
export { default as RGField, cleanRG, isValidRG } from "./RGField";

// Re-export types from TeamSelector
export type { Gender, Team, Category } from "./TeamSelector";
