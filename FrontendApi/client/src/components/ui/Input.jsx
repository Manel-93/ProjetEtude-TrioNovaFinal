export default function Input({ label, id, className = '', error, helperText, ...props }) {
  const inputId = id || props.name;

  return (
    <div className={className}>
      {label && (
        <label
          htmlFor={inputId}
          className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500"
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        className="input"
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={helperText ? `${inputId}-helper` : undefined}
        {...props}
      />
      {helperText && (
        <p id={`${inputId}-helper`} className="mt-1 text-xs text-slate-500">
          {helperText}
        </p>
      )}
      {error && (
        <p className="mt-1 text-xs text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

