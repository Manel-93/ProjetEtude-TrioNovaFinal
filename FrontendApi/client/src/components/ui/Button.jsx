export default function Button({ as: Component = 'button', variant = 'primary', className = '', ...props }) {
  const base =
    'inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ocean focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50 disabled:opacity-50 disabled:cursor-not-allowed';

  const variants = {
    primary: 'bg-ocean text-white hover:bg-ocean-hover',
    secondary: 'border border-slate-300 bg-white text-ink hover:bg-surface',
    ghost: 'text-ink/90 hover:bg-surface'
  };

  const classes = [base, variants[variant] || variants.primary, className].join(' ');

  return <Component className={classes} {...props} />;
}

