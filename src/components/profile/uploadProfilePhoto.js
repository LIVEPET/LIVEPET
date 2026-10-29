import { toast } from "sonner";
import { authService } from "@/services/api";
import { compressImage } from "@/lib/image";

/**
 * Valida, comprime e salva a foto de perfil, avisando o tutor com toasts.
 * `onCompressed` recebe a imagem comprimida assim que fica pronta.
 * Retorna o usuário atualizado pela API, ou null se nada foi salvo.
 */
export const uploadProfilePhoto = async (file, onCompressed) => {
  if (!file) return null;
  if (!file.type.startsWith("image/")) {
    toast.error("Por favor, selecione um arquivo de imagem.");
    return null;
  }

  const toastId = toast.loading("Comprimindo e salvando foto de perfil...");
  try {
    const compressed = await compressImage(file, 500, 500, 0.8);
    if (!compressed) {
      toast.dismiss(toastId);
      return null;
    }
    onCompressed?.(compressed);
    const updated = await authService.updateMe({ foto_url: compressed });
    toast.dismiss(toastId);
    toast.success("Foto de perfil atualizada!");
    return updated;
  } catch (err) {
    console.error("Erro ao atualizar foto:", err);
    toast.dismiss(toastId);
    toast.error("Não foi possível atualizar a foto.");
    return null;
  }
};
