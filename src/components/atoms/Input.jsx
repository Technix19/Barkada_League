export default function Input({ id, invalid = false, className = '', ...rest }) {
  const classes = ['form-control', className].filter(Boolean).join(' ')
  return (
    <input
      id={id}
      className={classes}
      aria-invalid={invalid || undefined}
      {...rest}
    />
  )
}
