import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  MessageCircle,
  Send,
  Search,
  Phone,
  ExternalLink,
  ArrowLeft,
  CheckCheck,
  PawPrint,
  Sparkles,
  ShoppingBag,
  HeartHandshake,
  ShieldCheck,
  Calendar,
  User,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  Bot,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { authService, marketplaceService } from "@/services/api";
import { BLANK_PET_IMAGE, getPetPhoto } from "@/lib/petPlaceholder";

export const CHAT_STORAGE_KEY = "livepet_conversations_v1";

export const getStoredConversations = () => {
  try {
    return JSON.parse(localStorage.getItem(CHAT_STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
};

export const saveStoredConversations = (conversations) => {
  try {
    localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(conversations));
  } catch (e) {
    console.error(e);
  }
};

export const startOrOpenConversation = ({
  id,
  title,
  petName,
  petPhoto,
  sellerName,
  sellerPhone,
  source = "filhotes", // "filhotes" | "matchpet" | "sistema"
  initialMessage = null,
}) => {
  const list = getStoredConversations();
  let conv = list.find((c) => c.id === id);

  const now = new Date();
  const timeStr = now.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  if (!conv) {
    conv = {
      id,
      title: title || `Conversa sobre ${petName || "Pet"}`,
      petName: petName || "Pet",
      petPhoto: petPhoto || BLANK_PET_IMAGE,
      sellerName: sellerName || "Tutor LivePet",
      sellerPhone: sellerPhone || "",
      source,
      updatedAt: now.toISOString(),
      messages: initialMessage
        ? [
            {
              id: Date.now(),
              from: "me",
              text: initialMessage,
              time: timeStr,
            },
          ]
        : [],
    };
    list.unshift(conv);
    saveStoredConversations(list);
  } else if (initialMessage && conv.messages.length === 0) {
    conv.messages.push({
      id: Date.now(),
      from: "me",
      text: initialMessage,
      time: timeStr,
    });
    conv.updatedAt = now.toISOString();
    saveStoredConversations(list);
  }

  return conv;
};

const initials = (name) => {
  if (!name) return "TU";
  const parts = name.trim().split(" ").filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
};

const Chat = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialChatId = searchParams.get("id");

  const [currentUser, setCurrentUser] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [activeChatId, setActiveChatId] = useState(initialChatId || null);
  const [searchQuery, setSearchQuery] = useState("");
  const [messageText, setMessageText] = useState("");
  const [checkingSystem, setCheckingSystem] = useState(false);
  const messagesEndRef = useRef(null);

  // Carrega usuário e conversas
  useEffect(() => {
    const user = authService.getCurrentUser();
    setCurrentUser(user);
    if (!user) {
      toast("Faça login para acessar suas conversas.");
      navigate("/login?redirect=/chat");
      return;
    }

    const stored = getStoredConversations();
    setConversations(stored);
    if (initialChatId) {
      setActiveChatId(initialChatId);
    } else if (stored.length > 0) {
      setActiveChatId(stored[0].id);
    }
  }, [initialChatId, navigate]);

  // Rotina de verificação: busca anúncios do usuário que completaram 30 dias
  // e insere/atualiza mensagens automáticas com botões pré-definidos no chat do sistema
  const sync30DaysConfirmations = async () => {
    if (!currentUser) return;
    try {
      setCheckingSystem(true);
      const myListings = await marketplaceService.myListings();
      if (!Array.isArray(myListings) || myListings.length === 0) return;

      const now = new Date();
      let currentConvs = getStoredConversations();
      let systemConv = currentConvs.find((c) => c.id === "assistente_livepet_bot");

      if (!systemConv) {
        systemConv = {
          id: "assistente_livepet_bot",
          title: "Assistente LivePet — Confirmações de Anúncios",
          petName: "Assistente Oficial",
          petPhoto: "https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=400&q=80",
          sellerName: "Assistente LivePet",
          sellerPhone: "",
          source: "sistema",
          updatedAt: now.toISOString(),
          messages: [],
        };
        currentConvs.unshift(systemConv);
      }

      let modified = false;

      for (const listing of myListings) {
        // Se necessita confirmação (ou status pending_confirmation)
        if (listing.needs_confirmation || listing.status === "pending_confirmation") {
          const msgId = `conf_listing_${listing.id}`;
          const existingMsgIndex = systemConv.messages.findIndex(
            (m) => m.id === msgId || (m.type === "listing_confirmation" && m.listingId === listing.id)
          );

          const sentAt = listing.confirmacao_enviada_em
            ? new Date(listing.confirmacao_enviada_em)
            : now;
          const deadline = listing.expired_deadline
            ? new Date(listing.expired_deadline)
            : new Date(sentAt.getTime() + 24 * 60 * 60 * 1000);

          // Verifica se 24h já passaram sem resposta
          const isExpired = now.getTime() > deadline.getTime();

          if (isExpired) {
            // Remove do banco de dados automaticamente se ainda não foi deletado
            try {
              await marketplaceService.delete(listing.id);
            } catch (err) {
              console.warn("Anúncio já removido ou erro ao excluir:", err);
            }
          }

          const confirmationMsg = {
            id: msgId,
            from: "system",
            type: "listing_confirmation",
            listingId: listing.id,
            listingTitle: listing.titulo,
            listingBreed: listing.raca || listing.especie,
            listingPrice: listing.preco,
            listingType: listing.tipo,
            listingPhoto: listing.foto_url,
            confirmSentAt: sentAt.toISOString(),
            expiredDeadline: deadline.toISOString(),
            status: isExpired ? "expired" : "pending",
            time: sentAt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
            text: `Olá! Seu anúncio "${listing.titulo}" completou 30 dias publicado no LivePet. Você ainda está anunciando este filhote/pet?`,
          };

          if (existingMsgIndex === -1) {
            systemConv.messages.push(confirmationMsg);
            systemConv.updatedAt = now.toISOString();
            modified = true;
          } else if (isExpired && systemConv.messages[existingMsgIndex].status !== "expired") {
            systemConv.messages[existingMsgIndex].status = "expired";
            systemConv.updatedAt = now.toISOString();
            modified = true;
          }
        }
      }

      if (modified) {
        saveStoredConversations(currentConvs);
        setConversations([...currentConvs]);
        // Se veio para o chat de confirmação ou se não há chat selecionado, seleciona o assistente
        if (!activeChatId) {
          setActiveChatId("assistente_livepet_bot");
        }
      }
    } catch (err) {
      console.warn("Erro ao sincronizar confirmações de 30 dias:", err);
    } finally {
      setCheckingSystem(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      sync30DaysConfirmations();
    }
  }, [currentUser]);

  const selectConversation = (id) => {
    setActiveChatId(id);
    setSearchParams({ id });
  };

  const activeConversation = useMemo(() => {
    return conversations.find((c) => c.id === activeChatId) || null;
  }, [conversations, activeChatId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeConversation?.messages]);

  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations;
    const q = searchQuery.toLowerCase();
    return conversations.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.petName.toLowerCase().includes(q) ||
        c.sellerName.toLowerCase().includes(q)
    );
  }, [conversations, searchQuery]);

  // Envio de mensagem padrão pelo usuário
  const handleSendMessage = (textToSend = null) => {
    const text = (textToSend || messageText).trim();
    if (!text || !activeConversation) return;

    // Se estiver no chat do assistente oficial, instruir a usar os botões pré-definidos
    if (activeConversation.id === "assistente_livepet_bot") {
      toast.info("No canal do Assistente, selecione uma das respostas pré-definidas para gerenciar seus anúncios.");
      return;
    }

    const time = new Date().toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });

    const newMsg = {
      id: Date.now(),
      from: "me",
      text,
      time,
      senderName: currentUser?.nome || "Você",
    };

    const updatedList = conversations.map((c) => {
      if (c.id === activeConversation.id) {
        return {
          ...c,
          updatedAt: new Date().toISOString(),
          messages: [...(c.messages || []), newMsg],
        };
      }
      return c;
    });

    setConversations(updatedList);
    saveStoredConversations(updatedList);
    setMessageText("");
  };

  // Trata resposta PRÉ-DEFINIDA de confirmação de 30 dias ("renovar" ou "encerrar")
  const handlePredefinedResponse = async (listingId, action) => {
    try {
      const now = new Date();
      const timeStr = now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

      if (action === "renovar") {
        await marketplaceService.confirm(listingId, "renovar");
        toast.success("Anúncio renovado com sucesso por mais 30 dias!");
      } else {
        await marketplaceService.confirm(listingId, "encerrar");
        toast.info("Anúncio encerrado e excluído do catálogo.");
      }

      // Atualiza o histórico do chat local
      const updatedConvs = conversations.map((conv) => {
        if (conv.id === "assistente_livepet_bot") {
          const updatedMessages = conv.messages.map((m) => {
            if (m.type === "listing_confirmation" && m.listingId === listingId) {
              return {
                ...m,
                status: action === "renovar" ? "renewed" : "closed",
              };
            }
            return m;
          });

          // Mensagem de confirmação registrada no chat
          const feedbackMsg = {
            id: Date.now(),
            from: "system",
            text:
              action === "renovar"
                ? `✅ Resposta registrada: "Sim, ainda estou vendendo". O anúncio foi renovado com sucesso por mais 30 dias no catálogo!`
                : `🗑️ Resposta registrada: "Não, já foi adotado / vendido". O anúncio foi removido permanentemente do catálogo.`,
            time: timeStr,
          };

          return {
            ...conv,
            updatedAt: now.toISOString(),
            messages: [...updatedMessages, feedbackMsg],
          };
        }
        return conv;
      });

      setConversations(updatedConvs);
      saveStoredConversations(updatedConvs);
    } catch (err) {
      toast.error(err.message || "Erro ao registrar confirmação do anúncio.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-secondary via-background to-primary-soft/30 py-6 md:py-10">
      <div className="container max-w-6xl">
        {/* Top Header */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate(-1)}
              className="rounded-full h-9 w-9"
              title="Voltar"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight md:text-3xl">
                <MessageCircle className="h-7 w-7 text-primary" />
                Mensagens & Chat
              </h1>
              <p className="text-xs text-muted-foreground sm:text-sm">
                Comunicação direta com tutores de filhotes e confirmações automáticas de 30 dias.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={sync30DaysConfirmations}
              disabled={checkingSystem}
              variant="outline"
              size="sm"
              className="rounded-full border-primary/30 text-primary hover:bg-primary-soft text-xs"
              title="Sincronizar avisos do sistema"
            >
              <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${checkingSystem ? "animate-spin" : ""}`} />
              Atualizar Avisos
            </Button>
            <Button
              asChild
              variant="outline"
              size="sm"
              className="rounded-full border-primary/30 text-primary hover:bg-primary-soft text-xs"
            >
              <Link to="/vitrine-pet">
                <ShoppingBag className="mr-1.5 h-3.5 w-3.5" />
                Vitrine Pet
              </Link>
            </Button>
          </div>
        </div>

        {/* Chat Layout: 2 Columns */}
        <div className="grid grid-cols-1 overflow-hidden rounded-3xl border bg-card shadow-soft md:grid-cols-[340px_1fr] lg:grid-cols-[380px_1fr] h-[75vh] min-h-[550px]">
          {/* Coluna Esquerda: Lista de Conversas */}
          <div
            className={`flex flex-col border-r bg-muted/15 ${
              activeChatId ? "hidden md:flex" : "flex"
            }`}
          >
            {/* Campo de Busca */}
            <div className="border-b p-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar conversa ou tutor…"
                  className="rounded-full pl-9 h-9 text-xs bg-background"
                />
              </div>
            </div>

            {/* Lista com Rolagem */}
            <div className="flex-1 overflow-y-auto divide-y divide-border/60">
              {filteredConversations.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <MessageCircle className="h-6 w-6" />
                  </div>
                  <p className="text-sm font-semibold">Nenhuma conversa encontrada</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Ao navegar na Vitrine Pet, clique em "Conversar com o Dono" para abrir uma conversa direta!
                  </p>
                  <Button
                    asChild
                    size="sm"
                    className="mt-4 rounded-full gradient-primary text-xs"
                  >
                    <Link to="/vitrine-pet">Explorar Vitrine Pet</Link>
                  </Button>
                </div>
              ) : (
                filteredConversations.map((c) => {
                  const isActive = c.id === activeChatId;
                  const lastMsg = c.messages?.[c.messages.length - 1];
                  const isSystem = c.id === "assistente_livepet_bot";

                  return (
                    <button
                      key={c.id}
                      onClick={() => selectConversation(c.id)}
                      className={`flex w-full items-start gap-3 p-3.5 text-left transition-smooth ${
                        isActive
                          ? "bg-primary-soft/50 border-l-4 border-l-primary"
                          : "hover:bg-muted/40"
                      } ${isSystem ? "bg-amber-500/5 hover:bg-amber-500/10" : ""}`}
                    >
                      <Avatar className="h-11 w-11 rounded-2xl border shrink-0">
                        <AvatarImage src={getPetPhoto(c.petPhoto)} alt={c.petName} />
                        <AvatarFallback className="bg-primary text-primary-foreground font-bold text-xs">
                          {isSystem ? <Bot className="h-5 w-5" /> : initials(c.petName || c.sellerName)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <p
                            className={`truncate text-xs font-semibold flex items-center gap-1 ${
                              isActive ? "text-primary" : "text-foreground"
                            }`}
                          >
                            {isSystem && <Bot className="h-3 w-3 text-amber-500" />}
                            {c.sellerName}
                          </p>
                          <span className="text-[10px] text-muted-foreground shrink-0">
                            {lastMsg ? lastMsg.time : ""}
                          </span>
                        </div>
                        <p className="truncate text-xs font-medium text-foreground/80 mt-0.5">
                          {c.title || c.petName}
                        </p>
                        <p className="truncate text-[11px] text-muted-foreground mt-0.5">
                          {lastMsg
                            ? `${lastMsg.from === "me" ? "Você: " : ""}${lastMsg.text || "Confirmação de anúncio"}`
                            : "Iniciar conversa..."}
                        </p>
                        <div className="mt-1.5 flex items-center gap-1.5">
                          {isSystem ? (
                            <Badge
                              variant="outline"
                              className="text-[9px] px-1.5 py-0 rounded-md border-amber-500/40 text-amber-600 bg-amber-50"
                            >
                              🤖 Sistema LivePet
                            </Badge>
                          ) : c.source === "filhotes" ? (
                            <Badge
                              variant="outline"
                              className="text-[9px] px-1.5 py-0 rounded-md border-primary/30 text-primary"
                            >
                              🐾 Vitrine Pet
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="text-[9px] px-1.5 py-0 rounded-md border-accent-warm/40 text-accent-warm"
                            >
                              💞 MatchPet
                            </Badge>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Coluna Direita: Janela de Chat Ativa */}
          <div
            className={`flex flex-col bg-background ${
              !activeChatId ? "hidden md:flex" : "flex"
            }`}
          >
            {activeConversation ? (
              <>
                {/* Header da Conversa Ativa */}
                <div className="flex items-center justify-between border-b p-3.5 bg-card">
                  <div className="flex items-center gap-3">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setActiveChatId(null)}
                      className="md:hidden h-8 w-8 rounded-full"
                    >
                      <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <Avatar className="h-10 w-10 rounded-2xl border">
                      <AvatarImage
                        src={getPetPhoto(activeConversation.petPhoto)}
                        alt={activeConversation.petName}
                      />
                      <AvatarFallback className="bg-primary text-primary-foreground font-bold text-xs">
                        {activeConversation.id === "assistente_livepet_bot" ? (
                          <Bot className="h-5 w-5" />
                        ) : (
                          initials(activeConversation.sellerName)
                        )}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-bold text-foreground">
                          {activeConversation.sellerName}
                        </p>
                        {activeConversation.id === "assistente_livepet_bot" ? (
                          <Badge
                            variant="secondary"
                            className="rounded-full text-[10px] bg-amber-500/10 text-amber-700 border border-amber-500/30"
                          >
                            🛡️ Sistema Oficial
                          </Badge>
                        ) : (
                          <Badge
                            variant="secondary"
                            className="rounded-full text-[10px] bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                          >
                            🟢 Ativo no LivePet
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate max-w-sm">
                        {activeConversation.id === "assistente_livepet_bot"
                          ? "Verificações periódicas de 30 dias e gerenciamento de catálogo"
                          : `Sobre: ${activeConversation.title || activeConversation.petName}`}
                      </p>
                    </div>
                  </div>

                  {/* Atalho WhatsApp para anunciantes reais */}
                  {activeConversation.sellerPhone && activeConversation.id !== "assistente_livepet_bot" && (
                    <a
                      href={`https://wa.me/${activeConversation.sellerPhone.replace(
                        /\D/g,
                        ""
                      )}?text=${encodeURIComponent(
                        `Olá ${activeConversation.sellerName}! Vi seu anúncio "${activeConversation.title}" no LivePet e gostaria de mais informações.`
                      )}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/40 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 transition-smooth"
                    >
                      <Phone className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">WhatsApp</span>
                    </a>
                  )}
                </div>

                {/* Histórico de Mensagens */}
                <div className="flex-1 space-y-4 overflow-y-auto p-4 bg-muted/10">
                  {(!activeConversation.messages || activeConversation.messages.length === 0) ? (
                    <div className="flex h-full flex-col items-center justify-center text-center p-6">
                      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary mb-3">
                        <MessageCircle className="h-7 w-7" />
                      </div>
                      <p className="text-sm font-semibold">
                        Inicie a conversa com {activeConversation.sellerName}!
                      </p>
                      <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                        Tire dúvidas sobre vacinas, cuidados, fotos adicionais ou combine uma visita para conhecer o pet.
                      </p>
                    </div>
                  ) : (
                    activeConversation.messages.map((m) => {
                      // Mensagem interativa de Confirmação de 30 Dias (com botões pré-definidos)
                      if (m.type === "listing_confirmation") {
                        const isPending = m.status === "pending";
                        const isRenewed = m.status === "renewed";
                        const isClosed = m.status === "closed";
                        const isExpired = m.status === "expired";

                        return (
                          <div key={m.id} className="flex justify-start my-2">
                            <Card className="max-w-md w-full border-2 border-primary/20 bg-card p-4 rounded-3xl shadow-sm">
                              <div className="flex items-center gap-2 mb-3">
                                <div className="h-8 w-8 rounded-full bg-amber-500/10 text-amber-600 flex items-center justify-center">
                                  <Clock className="h-4 w-4" />
                                </div>
                                <div>
                                  <h4 className="text-xs font-bold text-foreground">
                                    Confirmação de 30 Dias do Anúncio
                                  </h4>
                                  <p className="text-[10px] text-muted-foreground">
                                    Enviado às {m.time}
                                  </p>
                                </div>
                              </div>

                              {/* Card do Anúncio */}
                              <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-muted/30 border border-border/60 mb-3">
                                <img
                                  src={getPetPhoto(m.listingPhoto)}
                                  alt={m.listingTitle}
                                  className="h-12 w-12 rounded-xl object-cover border shrink-0"
                                />
                                <div className="min-w-0 flex-1 text-xs">
                                  <p className="font-bold truncate text-foreground">
                                    {m.listingTitle}
                                  </p>
                                  <p className="text-[11px] text-muted-foreground truncate">
                                    {m.listingBreed} • {m.listingType === "adocao" ? "Adoção Responsável" : `R$ ${m.listingPrice}`}
                                  </p>
                                </div>
                              </div>

                              <p className="text-xs text-foreground leading-relaxed mb-3">
                                {m.text}
                              </p>

                              {/* Prazo de 24 horas */}
                              <div className="rounded-xl bg-amber-500/10 border border-amber-500/30 p-2.5 text-[11px] text-amber-800 dark:text-amber-300 mb-3 flex items-start gap-2">
                                <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
                                <span>
                                  <strong>Atenção:</strong> Responda dentro de <strong>24 horas</strong> através dos botões pré-definidos abaixo. Caso não haja resposta dentro de 24h, o anúncio será <strong>excluído automaticamente</strong> do catálogo.
                                </span>
                              </div>

                              {/* Botões de Respostas Pré-Definidas */}
                              {isPending && (
                                <div className="space-y-2 pt-1">
                                  <p className="text-[11px] font-semibold text-muted-foreground">
                                    Selecione sua resposta:
                                  </p>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    <Button
                                      onClick={() => handlePredefinedResponse(m.listingId, "renovar")}
                                      className="rounded-xl gradient-primary text-primary-foreground text-xs h-9 font-semibold justify-center shadow-xs"
                                    >
                                      <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                                      Sim, continuar vendendo
                                    </Button>
                                    <Button
                                      onClick={() => handlePredefinedResponse(m.listingId, "encerrar")}
                                      variant="outline"
                                      className="rounded-xl border-rose-300 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-xs h-9 font-semibold justify-center"
                                    >
                                      <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                                      Não, já foi adotado / vendido
                                    </Button>
                                  </div>
                                </div>
                              )}

                              {isRenewed && (
                                <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-semibold bg-emerald-500/10 border border-emerald-500/20 p-2 rounded-xl">
                                  <CheckCircle2 className="h-4 w-4" />
                                  <span>Respondido: "Sim, continuar vendendo". Anúncio renovado!</span>
                                </div>
                              )}

                              {isClosed && (
                                <div className="flex items-center gap-1.5 text-xs text-rose-600 font-semibold bg-rose-500/10 border border-rose-500/20 p-2 rounded-xl">
                                  <Trash2 className="h-4 w-4" />
                                  <span>Respondido: "Não, já foi adotado/vendido". Anúncio excluído.</span>
                                </div>
                              )}

                              {isExpired && (
                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-semibold bg-muted border p-2 rounded-xl">
                                  <Clock className="h-4 w-4 text-rose-500" />
                                  <span>Prazo de 24h esgotado sem resposta. Anúncio removido do catálogo.</span>
                                </div>
                              )}
                            </Card>
                          </div>
                        );
                      }

                      const isMe = m.from === "me";
                      const isSystemMsg = m.from === "system";

                      return (
                        <div
                          key={m.id}
                          className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm shadow-xs ${
                              isMe
                                ? "gradient-primary text-primary-foreground rounded-br-xs"
                                : isSystemMsg
                                ? "bg-amber-500/10 border border-amber-500/30 text-foreground rounded-bl-xs"
                                : "bg-card border text-foreground rounded-bl-xs"
                            }`}
                          >
                            <p className="leading-relaxed text-xs sm:text-sm">{m.text}</p>
                            <div
                              className={`mt-1 flex items-center justify-end gap-1 text-[10px] ${
                                isMe ? "text-white/70" : "text-muted-foreground"
                              }`}
                            >
                              <span>{m.time}</span>
                              {isMe && <CheckCheck className="h-3 w-3" />}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Atalhos Rápidos de Mensagem (apenas para chats com pessoas) */}
                {activeConversation.id !== "assistente_livepet_bot" && (
                  <div className="flex flex-wrap gap-1.5 border-t bg-card px-3 pt-2">
                    {[
                      "Olá! O filhote ainda está disponível?",
                      "Poderia me enviar mais fotos e vídeos?",
                      "Podemos agendar uma visita para eu conhecê-lo?",
                      "As vacinas e vermifugação já estão em dia?",
                    ].map((sug) => (
                      <button
                        key={sug}
                        type="button"
                        onClick={() => handleSendMessage(sug)}
                        className="rounded-full border border-border/80 bg-background px-2.5 py-1 text-[11px] text-muted-foreground hover:border-primary/40 hover:text-primary transition-smooth"
                      >
                        {sug}
                      </button>
                    ))}
                  </div>
                )}

                {/* Campo de Entrada de Mensagem */}
                <div className="flex items-center gap-2 border-t p-3 bg-card">
                  <Input
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                    placeholder={
                      activeConversation.id === "assistente_livepet_bot"
                        ? "Utilize as respostas pré-definidas acima para gerenciar os anúncios."
                        : "Escreva sua mensagem aqui…"
                    }
                    disabled={activeConversation.id === "assistente_livepet_bot"}
                    className="rounded-full text-xs h-10"
                  />
                  <Button
                    onClick={() => handleSendMessage()}
                    disabled={!messageText.trim() || activeConversation.id === "assistente_livepet_bot"}
                    size="icon"
                    className="rounded-full gradient-primary text-primary-foreground h-10 w-10 shrink-0"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex h-full flex-col items-center justify-center p-8 text-center text-muted-foreground">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary mb-3">
                  <MessageCircle className="h-8 w-8" />
                </div>
                <h3 className="text-base font-bold text-foreground">
                  Selecione uma conversa
                </h3>
                <p className="text-xs max-w-xs mt-1">
                  Escolha uma conversa na lista ao lado ou inicie uma nova através da Vitrine Pet.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;
