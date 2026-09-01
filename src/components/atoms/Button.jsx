const VARIANT_CLASS = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  danger: 'btn-danger',
}

export default function Button({
  variant = 'primary',
  type = 'button',
  disabled = false,
  className = '',
  children,
  ...rest
}) {
  const classes = ['btn', VARIANT_CLASS[variant] || VARIANT_CLASS.primary, className]
    .filter(Boolean)
    .join(' ')

  return (
    <button type={type} className={classes} disabled={disabled} {...rest}>
      {children}
    </button>
  )
}
