import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Tabs } from "@/components/ui/tabs";
import { authService, petsService } from "@/services/api";
import ProfileHeader from "@/components/profile/ProfileHeader";
import PetStories from "@/components/profile/PetStories";
import ProfileTabsNav from "@/components/profile/ProfileTabsNav";
import PetsGridTab from "@/components/profile/PetsGridTab";
import PedigreesTab from "@/components/profile/PedigreesTab";
import AboutTab from "@/components/profile/AboutTab";
import EditProfileDialog from "@/components/profile/EditProfileDialog";
import ProfileSkeleton from "@/components/profile/ProfileSkeleton";
import LoadErrorAlert from "@/components/profile/LoadErrorAlert";
import { uploadProfilePhoto } from "@/components/profile/uploadProfilePhoto";
import { buildUpdatePayload } from "@/components/profile/profileUtils";
import { hasLineage } from "@/lib/petBadges";

// Página /perfil: guarda o estado (tutor e pets) e repassa para os componentes por props.
// O formulário de edição (React Hook Form) vive dentro do EditProfileDialog.
const Profile = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userError, setUserError] = useState(false);
  const [petsError, setPetsError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("pets");
  const fileInputRef = useRef(null);
  const isMountedRef = useRef(true);

  // Carrega tutor e pets separadamente: a falha de um não esconde a do outro.
  const loadProfile = useCallback(async () => {
    setLoading(true);
    const [userResult, petsResult] = await Promise.allSettled([
      authService.getMe().catch(() => authService.getCurrentUser()),
      petsService.list(),
    ]);
    if (!isMountedRef.current) return;

    const userData = userResult.status === "fulfilled" ? userResult.value : null;
    if (userData) setCurrentUser(userData);
    else console.error("Erro ao carregar dados do tutor:", userResult.reason);
    setUserError(!userData);

    const petsOk = petsResult.status === "fulfilled" && Array.isArray(petsResult.value);
    if (!petsOk) console.error("Erro ao carregar pets do tutor:", petsResult.reason);
    setPets(petsOk ? petsResult.value : []);
    setPetsError(!petsOk);
    setLoading(false);
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    loadProfile();
    return () => {
      isMountedRef.current = false;
    };
  }, [loadProfile]);

  const totalVaccines = useMemo(() => pets.reduce((acc, pet) => acc + (pet.vaccines?.length || 0), 0), [pets]);
  const totalPedigrees = useMemo(() => pets.filter(hasLineage).length, [pets]);

  // O modal reseta o formulário para os dados salvos sempre que abre (ver EditProfileDialog).
  const openEdit = () => setIsEditOpen(true);
  const discardEdit = () => setIsEditOpen(false);

  const handlePhotoUpload = async (e) => {
    const updated = await uploadProfilePhoto(e.target.files?.[0]);
    e.target.value = "";
    if (updated) setCurrentUser(updated);
  };

  // Só é chamado com os dados já validados pelo Zod (profileSchema.js).
  const handleSave = async (values) => {
    setSaving(true);
    try {
      const updated = await authService.updateMe(buildUpdatePayload(values));
      setCurrentUser(updated);
      setIsEditOpen(false);
      toast.success("Perfil salvo com sucesso!", { icon: <CheckCircle2 className="h-4 w-4" /> });
    } catch (err) {
      console.error("Erro ao salvar perfil:", err);
      const msg = err instanceof Error ? err.message : "Erro ao salvar";
      toast.error("Não foi possível salvar o perfil.", { description: msg });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <ProfileSkeleton />;
  if (userError) {
    return (
      <div className="container max-w-4xl py-16">
        <LoadErrorAlert title="Não foi possível carregar seu perfil" onRetry={loadProfile} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="container max-w-4xl pt-8 sm:pt-12">
        <ProfileHeader
          currentUser={currentUser}
          petsCount={petsError ? null : pets.length}
          totalVaccines={petsError ? null : totalVaccines}
          totalPedigrees={petsError ? null : totalPedigrees}
          fileInputRef={fileInputRef}
          onPhotoChange={handlePhotoUpload}
          onEdit={openEdit}
        />
        <PetStories pets={pets} />

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-2">
          <ProfileTabsNav petsCount={petsError ? null : pets.length} pedigreesCount={petsError ? null : totalPedigrees} />
          <PetsGridTab pets={pets} error={petsError} onRetry={loadProfile} />
          <PedigreesTab pets={pets} error={petsError} onRetry={loadProfile} />
          <AboutTab currentUser={currentUser} onEdit={openEdit} />
        </Tabs>
      </div>

      <EditProfileDialog
        open={isEditOpen}
        user={currentUser}
        saving={saving}
        onSave={handleSave}
        onDiscard={discardEdit}
        onPickPhoto={() => fileInputRef.current?.click()}
      />
    </div>
  );
};

export default Profile;
