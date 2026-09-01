export default function Select({ id, invalid = false, className = '', children, ...rest }) {
  const classes = ['form-control', className].filter(Boolean).join(' ')
  return (
    <select id={id} className={classes} aria-invalid={invalid || undefined} {...rest}>
      {children}
    </select>
  )
}
