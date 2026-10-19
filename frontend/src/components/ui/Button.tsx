import type { ButtonHTMLAttributes } from 'react'

import { type ButtonVariant, buttonStyles } from './buttonStyles'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
  size?: 'sm' | 'md'
}

export function Button({
  variant = 'outline',
  size = 'md',
  type = 'button',
  className,
  ...props
}: ButtonProps) {
  return <button type={type} className={buttonStyles(variant, size, className)} {...props} />
}
