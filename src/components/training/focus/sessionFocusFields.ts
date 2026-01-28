export const SESSION_FOCUS_FIELDS = [
  { key: 'focus_attack_positional_pct', label: 'Ataque Posicional' },
  { key: 'focus_defense_positional_pct', label: 'Defesa Posicional' },
  { key: 'focus_transition_offense_pct', label: 'Transicao Ofensiva' },
  { key: 'focus_transition_defense_pct', label: 'Transicao Defensiva' },
  { key: 'focus_attack_technical_pct', label: 'Tecnico Ataque' },
  { key: 'focus_defense_technical_pct', label: 'Tecnico Defesa' },
  { key: 'focus_physical_pct', label: 'Físico' },
] as const;

export type SessionFocusKey = typeof SESSION_FOCUS_FIELDS[number]['key'];
