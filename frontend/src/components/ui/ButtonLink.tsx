import { Link, type LinkProps } from 'react-router'

import { type ButtonVariant, buttonStyles } from './buttonStyles'

type ButtonLinkProps = LinkProps & {
  variant?: ButtonVariant
}

/** Navigation that looks like a button, such as "Ver jogadores livres". */
export function ButtonLink({ variant = 'outline', className, ...props }: ButtonLinkProps) {
  return <Link className={buttonStyles(variant, 'md', className)} {...props} />
}
