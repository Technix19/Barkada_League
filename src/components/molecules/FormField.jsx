export default function FormField({ label, htmlFor, error, children }) {
  return (
    <div className="form-field">
      <label className="form-label" htmlFor={htmlFor}>
        {label}
      </label>
      {children}
      {error && (
        <span className="form-error" id={`${htmlFor}-error`} role="alert">
          {error}
        </span>
      )}
    </div>
  )
}
