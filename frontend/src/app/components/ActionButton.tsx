import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ElementType } from 'react';
import { Link, type LinkProps } from 'react-router';

type ActionVariant = 'primary' | 'tonal' | 'danger' | 'neutral' | 'text';
type ActionSize = 'sm' | 'md' | 'lg';

const variantClasses: Record<ActionVariant, string> = {
  primary: 'border-transparent bg-[var(--md3-primary)] text-white hover:bg-[var(--md3-primary)]/90 hover:shadow-sm',
  tonal: 'border-transparent bg-[var(--md3-primary-container)] text-[var(--md3-primary)] hover:bg-[var(--md3-primary-container)]/80 hover:shadow-sm',
  danger: 'border-transparent bg-[var(--md3-error-container)] text-[var(--md3-error)] hover:bg-[var(--md3-error)] hover:text-white hover:shadow-sm',
  neutral: 'border-[var(--md3-outline)] bg-white text-[var(--md3-on-surface-variant)] hover:border-[var(--md3-primary)] hover:bg-[var(--md3-surface-variant)] hover:text-[var(--md3-primary)]',
  text: 'border-transparent bg-transparent text-[var(--md3-primary)] hover:bg-[var(--md3-primary-container)]',
};

const sizeClasses: Record<ActionSize, string> = {
  sm: 'min-h-9 px-3 text-xs',
  md: 'min-h-10 px-4 text-sm',
  lg: 'min-h-12 px-5 text-sm',
};

interface BaseActionButtonProps {
  icon: ElementType;
  label: string;
  variant?: ActionVariant;
  size?: ActionSize;
}

interface ActionButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, BaseActionButtonProps {}

export function ActionButton({
  icon: Icon,
  label,
  variant = 'tonal',
  size = 'sm',
  className = '',
  type = 'button',
  ...buttonProps
}: ActionButtonProps) {
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center gap-2 rounded-full border font-medium transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--md3-primary)] disabled:cursor-not-allowed disabled:opacity-50 ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      aria-label={buttonProps['aria-label'] ?? label}
      {...buttonProps}
    >
      <Icon className={size === 'lg' ? 'h-5 w-5' : 'h-4 w-4'} />
      <span>{label}</span>
    </button>
  );
}

interface ActionLinkProps extends LinkProps, BaseActionButtonProps {}

export function ActionLink({
  icon: Icon,
  label,
  variant = 'tonal',
  size = 'sm',
  className = '',
  ...linkProps
}: ActionLinkProps) {
  return (
    <Link
      className={`inline-flex items-center justify-center gap-2 rounded-full border font-medium transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--md3-primary)] ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      aria-label={linkProps['aria-label'] ?? label}
      {...linkProps}
    >
      <Icon className={size === 'lg' ? 'h-5 w-5' : 'h-4 w-4'} />
      <span>{label}</span>
    </Link>
  );
}

interface ActionAnchorProps extends AnchorHTMLAttributes<HTMLAnchorElement>, BaseActionButtonProps {}

export function ActionAnchor({
  icon: Icon,
  label,
  variant = 'tonal',
  size = 'sm',
  className = '',
  ...anchorProps
}: ActionAnchorProps) {
  return (
    <a
      className={`inline-flex items-center justify-center gap-2 rounded-full border font-medium transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--md3-primary)] ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      aria-label={anchorProps['aria-label'] ?? label}
      {...anchorProps}
    >
      <Icon className={size === 'lg' ? 'h-5 w-5' : 'h-4 w-4'} />
      <span>{label}</span>
    </a>
  );
}
