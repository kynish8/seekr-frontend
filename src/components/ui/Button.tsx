import { ButtonHTMLAttributes, ReactNode } from 'react';
import clsx from 'clsx';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'solid' | 'outline';
  children: ReactNode;
  fullWidth?: boolean;
}

export function Button({
  variant = 'solid',
  children,
  fullWidth = false,
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      className={clsx(
        'px-8 py-4 rounded-lg font-bold text-lg transition-all duration-200',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        {
          'bg-white text-orange-primary hover:bg-gray-50': variant === 'solid',
          'bg-transparent text-white border-2 border-white hover:bg-white/10':
            variant === 'outline',
          'w-full': fullWidth,
        },
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
