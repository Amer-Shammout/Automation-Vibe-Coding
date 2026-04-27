/**
 * Button component - Modern & Interactive
 */

import React from 'react';

interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  onClick?: (e?: React.MouseEvent<HTMLButtonElement>) => void;
  children: React.ReactNode;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
  title?: string;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'medium',
  disabled = false,
  onClick,
  children,
  className = '',
  type = 'button',
  title,
}) => {
  const getButtonClass = () => {
    let base = 'btn btn-' + variant;
    if (size === 'small') base += ' btn-small';
    if (size === 'large') base += ' btn-large';
    return base + ' ' + className;
  };

  return (
    <button
      className={getButtonClass()}
      disabled={disabled}
      onClick={onClick}
      type={type}
      title={title}
      style={{
        opacity: disabled ? 0.6 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
      }}
    >
      {children}
    </button>
  );
};
