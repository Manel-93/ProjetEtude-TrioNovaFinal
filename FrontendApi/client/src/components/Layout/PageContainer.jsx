export default function PageContainer({ children }) {
  return (
    <main className="flex-1">
      <div className="mx-auto max-w-7xl px-4 pb-8 pt-4 sm:px-6 lg:px-8 lg:pt-6">
        {children}
      </div>
    </main>
  );
}

