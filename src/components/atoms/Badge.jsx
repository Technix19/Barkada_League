const VARIANT_CLASS = {
  win: 'badge-win',
  loss: 'badge-loss',
  primary: 'badge-primary',
  neutral: 'badge-neutral',
}

export default function Badge({ variant = 'neutral', className = '', children }) {
  const classes = ['badge', VARIANT_CLASS[variant] || VARIANT_CLASS.neutral, className]
    .filter(Boolean)
    .join(' ')
  return <span className={classes}>{children}</span>
}
