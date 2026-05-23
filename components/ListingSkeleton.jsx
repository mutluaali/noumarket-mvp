export default function ListingSkeleton() {
  return (
    <div className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200">
      <div className="h-52 animate-pulse bg-slate-200" />
      <div className="space-y-3 p-5">
        <div className="h-3 w-24 animate-pulse rounded bg-slate-200" />
        <div className="h-5 w-4/5 animate-pulse rounded bg-slate-200" />
        <div className="h-6 w-32 animate-pulse rounded bg-slate-200" />
        <div className="h-4 w-full animate-pulse rounded bg-slate-200" />
      </div>
    </div>
  );
}
