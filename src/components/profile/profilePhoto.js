import { toast } from "sonner";
import { compressImage } from "@/lib/image";

export const MAX_FOTO_MB = 5;
const MAX_FOTO_BYTES = MAX_FOTO_MB * 1024 * 1024;

/**
 * Confere e comprime a foto escolhida, sem salvar nada.
 * Retorna a imagem pronta (data URL) para pré-visualizar, ou null com um aviso ao tutor.
 */
export const preparePhoto = async (file) => {
  if (!file) return null;
  if (!file.type?.startsWith("image/")) {
    toast.error("Esse arquivo não é uma imagem.", { description: "Escolha uma foto em JPG, PNG ou WEBP." });
    return null;
  }
  if (file.size > MAX_FOTO_BYTES) {
    const mb = (file.size / 1024 / 1024).toFixed(1).replace(".", ",");
    toast.error(`A imagem tem ${mb} MB.`, { description: `Escolha uma foto de até ${MAX_FOTO_MB} MB.` });
    return null;
  }

  try {
    return (await compressImage(file, 500, 500, 0.8)) || null;
  } catch (err) {
    console.error("Erro ao preparar a foto:", err);
    toast.error("Não foi possível abrir essa imagem.");
    return null;
  }
};
