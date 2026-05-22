export default function Loading() {
  return (
    <main className="min-h-screen bg-slate-100">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-8 h-12 w-48 animate-pulse rounded-2xl bg-slate-200" />

        <div className="grid gap-6 lg:grid-cols-[1.08fr_0.92fr]">
          <div className="space-y-4">
            <div className="h-10 w-72 animate-pulse rounded-2xl bg-slate-200" />
            <div className="h-16 w-full max-w-2xl animate-pulse rounded-3xl bg-slate-200" />
            <div className="h-16 w-full max-w-3xl animate-pulse rounded-3xl bg-slate-200" />
          </div>

          <div className="hidden h-96 animate-pulse rounded-[2rem] bg-slate-200 lg:block" />
        </div>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((item) => (
            <div key={item} className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200">
              <div className="h-48 animate-pulse bg-slate-200" />
              <div className="space-y-3 p-4">
                <div className="h-4 w-20 animate-pulse rounded bg-slate-200" />
                <div className="h-6 w-4/5 animate-pulse rounded bg-slate-200" />
                <div className="h-6 w-1/2 animate-pulse rounded bg-slate-200" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
