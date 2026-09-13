export default function Loading() {
  return (
    <div
      className="mx-auto w-full max-w-[90rem] px-4 py-8 sm:px-6 sm:py-12 lg:px-8 lg:py-14"
      aria-busy="true"
      aria-label="Loading content"
    >
      <div className="mb-8 max-w-2xl animate-pulse sm:mb-10">
        <div className="mb-4 h-3 w-32 rounded bg-muted" />
        <div className="h-10 w-4/5 rounded-lg bg-muted sm:h-14 sm:w-2/3" />
        <div className="mt-5 h-4 w-full rounded bg-muted" />
        <div className="mt-2 h-4 w-3/4 rounded bg-muted" />
      </div>
      <div className="mb-8 h-24 animate-pulse rounded-2xl bg-muted/80 sm:h-28" />
      <div className="grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 sm:gap-5 md:grid-cols-4 lg:grid-cols-6">
        {Array.from({ length: 12 }, (_, index) => (
          <div key={index} className="animate-pulse">
            <div className="aspect-[2/3] rounded-[0.9rem] bg-muted sm:rounded-[1.1rem]" />
            <div className="mt-3 h-4 w-4/5 rounded bg-muted" />
            <div className="mt-2 h-3 w-1/2 rounded bg-muted" />
          </div>
        ))}
      </div>
    </div>
  );
}
