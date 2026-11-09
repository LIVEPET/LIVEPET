import { Skeleton } from "@/components/ui/skeleton";

// Esqueleto com o formato da tela de perfil, mostrado enquanto os dados carregam.
const ProfileSkeleton = () => (
  <div className="min-h-screen bg-background pb-20" role="status" aria-busy="true">
    <span className="sr-only">Carregando seu perfil...</span>
    <div className="container max-w-4xl pt-8 sm:pt-12" aria-hidden="true">
      <div className="flex flex-col items-center gap-6 border-b border-border/60 pb-8 md:flex-row md:items-start md:gap-12">
        <Skeleton className="h-28 w-28 rounded-full sm:h-36 sm:w-36" />
        <div className="flex w-full flex-1 flex-col items-center gap-4 md:items-start">
          <Skeleton className="h-8 w-56" />
          <div className="flex gap-8">
            <Skeleton className="h-4 w-14" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-20" />
          </div>
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-4 w-full max-w-md" />
        </div>
      </div>

      <div className="flex gap-5 border-b border-border/60 py-6">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-16 w-16 rounded-full" />
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 pt-14 sm:grid-cols-3 sm:gap-5">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="aspect-square rounded-2xl" />
        ))}
      </div>
    </div>
  </div>
);

export default ProfileSkeleton;
