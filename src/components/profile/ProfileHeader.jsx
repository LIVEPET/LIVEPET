import { Link } from "react-router-dom";
import { Building2, Calendar, Camera, MapPin, Pencil, Phone, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { initialsFrom } from "./profileUtils";

const ProfileHeader = ({
  currentUser,
  petsCount,
  totalVaccines,
  totalPedigrees,
  fileInputRef,
  onPhotoChange,
  onEdit,
}) => {
  const memberSinceYear = currentUser?.criado_em
    ? new Date(currentUser.criado_em).getFullYear()
    : new Date().getFullYear();

  const usernameHandle = (currentUser?.nome || "tutor")
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "");

  return (
    <header className="flex flex-col gap-6 md:flex-row md:items-start md:gap-12 pb-8 border-b border-border/60">
      {/* Avatar com borda Gradiente de Stories */}
      <div className="flex justify-center md:justify-start">
        <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
          <div className="h-28 w-28 sm:h-36 sm:w-36 rounded-full p-[3px] bg-gradient-to-tr from-amber-500 via-rose-500 to-primary shadow-glow transition-transform duration-300 group-hover:scale-105">
            <Avatar className="h-full w-full border-2 border-background">
              <AvatarImage
                src={currentUser?.foto_url}
                alt={currentUser?.nome}
                className="object-cover"
              />
              <AvatarFallback className="bg-primary-soft text-3xl font-bold text-primary">
                {initialsFrom(currentUser?.nome || currentUser?.email)}
              </AvatarFallback>
            </Avatar>
          </div>

          {/* Botão de câmera sobre o avatar */}
          <button
            type="button"
            className="absolute bottom-1 right-1 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md transition-all duration-300 hover:scale-110"
            title="Trocar foto de perfil"
            aria-label="Trocar foto de perfil"
          >
            <Camera className="h-3.5 w-3.5" />
          </button>

          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            className="hidden"
            onChange={onPhotoChange}
            data-testid="foto-cabecalho-input"
          />
        </div>
      </div>

      {/* Dados do Perfil */}
      <div className="flex-1 space-y-4 text-center md:text-left">
        {/* Linha 1: Handle, Selo Verificado e Ações */}
        <div className="flex flex-wrap items-center justify-center gap-3 md:justify-start">
          <h1 className="font-display text-2xl font-bold text-foreground sm:text-3xl">
            @{usernameHandle}
          </h1>

          {/* Botões de Ação */}
          {/* Sem selo "Oficial" e sem "Compartilhar": não existe verificação de tutor nem perfil público ainda (#152) */}
          <div className="flex items-center gap-2 mt-2 sm:mt-0">
            <Button
              onClick={onEdit}
              size="sm"
              variant="outline"
              className="rounded-xl border-border bg-card font-semibold shadow-soft hover:bg-muted"
            >
              <Pencil className="mr-1.5 h-3.5 w-3.5 text-muted-foreground" />
              Editar perfil
            </Button>

            <Button
              asChild
              size="sm"
              className="rounded-xl gradient-primary text-primary-foreground shadow-soft transition-bounce hover:scale-105"
            >
              <Link to="/pets/novo">
                <Plus className="mr-1 h-3.5 w-3.5" />
                Novo Pet
              </Link>
            </Button>
          </div>
        </div>

        {/* Linha 2: Estatísticas estilo Instagram */}
        {/* Contagem null = pets não carregaram: mostra "–" em vez de um 0 falso */}
        <div className="flex justify-center gap-8 text-sm md:justify-start">
          <div>
            <span className="font-bold text-foreground">{petsCount ?? "–"}</span>{" "}
            <span className="text-muted-foreground">{petsCount === 1 ? "pet" : "pets"}</span>
          </div>
          <div>
            <span className="font-bold text-foreground">{totalVaccines ?? "–"}</span>{" "}
            <span className="text-muted-foreground">vacinas</span>
          </div>
          <div>
            <span className="font-bold text-foreground">{totalPedigrees ?? "–"}</span>{" "}
            <span className="text-muted-foreground">pedigrees</span>
          </div>
        </div>

        {/* Linha 3: Bio e Informações Pessoais */}
        <div className="space-y-1.5 text-sm">
          <p className="font-bold text-foreground">{currentUser?.nome || "Tutor Responsável"}</p>

          {currentUser?.bio ? (
            <p className="text-muted-foreground whitespace-pre-line leading-relaxed max-w-xl">
              {currentUser.bio}
            </p>
          ) : (
            <p className="text-xs italic text-muted-foreground/80">
              Amor, cuidado e segurança para meus pets na plataforma LivePet.
            </p>
          )}

          <div className="flex flex-wrap items-center justify-center gap-2 pt-1 md:justify-start">
            {currentUser?.cidade && (
              <span className="inline-flex items-center gap-1 rounded-lg bg-secondary px-2.5 py-1 text-xs text-muted-foreground">
                <MapPin className="h-3.5 w-3.5 text-primary" />
                {currentUser.cidade}
                {currentUser.estado ? `, ${currentUser.estado}` : ""}
              </span>
            )}

            {currentUser?.telefone && (
              <span className="inline-flex items-center gap-1 rounded-lg bg-secondary px-2.5 py-1 text-xs text-muted-foreground">
                <Phone className="h-3.5 w-3.5 text-primary" />
                {currentUser.telefone}
              </span>
            )}

            {currentUser?.nome_canil && (
              <span className="inline-flex items-center gap-1 rounded-lg bg-warm/15 px-2.5 py-1 text-xs font-semibold text-warm">
                <Building2 className="h-3.5 w-3.5" />
                {currentUser.nome_canil}
              </span>
            )}

            <span className="inline-flex items-center gap-1 rounded-lg bg-secondary px-2.5 py-1 text-xs text-muted-foreground">
              <Calendar className="h-3.5 w-3.5 text-primary" />
              Membro desde {memberSinceYear}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default ProfileHeader;
