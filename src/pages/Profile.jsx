import { useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2, Copy, Loader2 } from "lucide-react";
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
import { uploadProfilePhoto } from "@/components/profile/uploadProfilePhoto";
import { EMPTY_FORM, buildUpdatePayload, formFromUser } from "@/components/profile/profileUtils";

// Página /perfil: guarda o estado (tutor, pets, formulário) e repassa para os componentes por props.
const Profile = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("pets");
  const [form, setForm] = useState(EMPTY_FORM);
  const fileInputRef = useRef(null);

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        setLoading(true);
        const [userData, petsData] = await Promise.all([
          authService.getMe().catch(() => authService.getCurrentUser()),
          petsService.list().catch(() => []),
        ]);
        if (!isMounted) return;
        if (userData) {
          setCurrentUser(userData);
          setForm(formFromUser(userData));
        }
        if (Array.isArray(petsData)) setPets(petsData);
      } catch (err) {
        console.error("Erro ao carregar dados do perfil:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  const totalVaccines = useMemo(() => pets.reduce((acc, pet) => acc + (pet.vaccines?.length || 0), 0), [pets]);
  const totalPedigrees = useMemo(() => pets.filter((pet) => pet.lineage || pet.raca).length, [pets]);

  const handlePhotoUpload = async (e) => {
    const updated = await uploadProfilePhoto(e.target.files?.[0], (foto_url) =>
      setForm((prev) => ({ ...prev, foto_url })),
    );
    e.target.value = "";
    if (updated) setCurrentUser(updated);
  };

  const handleShareProfile = () => {
    navigator.clipboard?.writeText(window.location.href);
    toast.success("Link do perfil copiado para a área de transferência!", { icon: <Copy className="h-4 w-4" /> });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nome.trim()) {
      toast.error("Informe seu nome completo.");
      return;
    }

    setSaving(true);
    try {
      const updated = await authService.updateMe(buildUpdatePayload(form));
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

  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Carregando seu perfil...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="container max-w-4xl pt-8 sm:pt-12">
        <ProfileHeader
          currentUser={currentUser}
          fotoUrl={form.foto_url}
          petsCount={pets.length}
          totalVaccines={totalVaccines}
          totalPedigrees={totalPedigrees}
          fileInputRef={fileInputRef}
          onPhotoChange={handlePhotoUpload}
          onEdit={() => setIsEditOpen(true)}
          onShare={handleShareProfile}
        />
        <PetStories pets={pets} />

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-2">
          <ProfileTabsNav petsCount={pets.length} pedigreesCount={totalPedigrees} />
          <PetsGridTab pets={pets} />
          <PedigreesTab pets={pets} />
          <AboutTab currentUser={currentUser} onEdit={() => setIsEditOpen(true)} />
        </Tabs>
      </div>

      <EditProfileDialog
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        form={form}
        setForm={setForm}
        saving={saving}
        onSubmit={handleSubmit}
        onPickPhoto={() => fileInputRef.current?.click()}
      />
    </div>
  );
};

export default Profile;
