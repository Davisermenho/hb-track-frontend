import { useFormContext } from 'react-hook-form';

interface Props {
  name: string;
  label: string;
  type?: 'text' | 'email' | 'date' | 'select';
  placeholder?: string;
  required?: boolean;
  options?: { label: string; value: string }[];
  disabled?: boolean;
}

export function FormField({
  name,
  label,
  type = 'text',
  placeholder,
  required = false,
  options = [],
  disabled = false,
}: Props) {
  const {
    register,
    formState: { errors },
  } = useFormContext();

  const error = errors as any;

  return (
    <div style={{ marginBottom: 'var(--space-4)' }}>
      <label
        htmlFor={name}
        style={{
          display: 'block',
          fontSize: 'var(--font-size-sm)',
          fontWeight: 500,
          marginBottom: 4,
        }}
      >
        {label}
        {required && <span style={{ color: 'red' }}> *</span>}
      </label>

      {type === 'select' ? (
        <select
          id={name}
          {...register(name)}
          disabled={disabled}
          style={{
            width: '100%',
            padding: '10px 12px',
            borderRadius: 6,
            border: '1px solid #d1d5db',
          }}
        >
          <option value="">Selecione</option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          id={name}
          type={type}
          placeholder={placeholder}
          disabled={disabled}
          {...register(name)}
          style={{
            width: '100%',
            padding: '10px 12px',
            borderRadius: 6,
            border: '1px solid #d1d5db',
          }}
        />
      )}

      {error?.[name] && (
        <span style={{ color: 'red', fontSize: 12 }}>
          {error[name]?.message as string}
        </span>
      )}
    </div>
  );
}

export default FormField;
