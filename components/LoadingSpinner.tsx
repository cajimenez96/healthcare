import Image from "next/image";

// TASK-062: extracted from app/loading.tsx, app/admin/loading.tsx,
// app/doctor/loading.tsx and app/recepcion/loading.tsx (TASK-055), which were
// four byte-for-byte identical files. Next.js requires each route segment to
// keep its own loading.tsx, so those four files remain but now just render
// this shared component.
export const LoadingSpinner = () => {
  return (
    <div className="flex-center size-full h-screen gap-3 text-white">
      <Image
        src="/assets/icons/loader.svg"
        alt="loader"
        width={40}
        height={3240}
        className="animate-spin"
      />
      Cargando...
    </div>
  );
};
