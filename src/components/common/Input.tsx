/**
 * Input component
 */

import React from 'react';

interface InputProps {
  type?: 'text' | 'email' | 'password' | 'number' | 'search';
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  required?: boolean;
  label?: string;
  error?: string;
}

export const Input: React.FC<InputProps> = ({
  type = 'text',
  placeholder,
  value,
  onChange,
  disabled = false,
  required = false,
  label,
  error,
}) => {
  return (
    <div className="input-group">
      {label && <label>{label}</label>}
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        disabled={disabled}
        required={required}
        className={error ? 'input input-error' : 'input'}
      />
      {error && <span className="error-message">{error}</span>}
    </div>
  );
};
