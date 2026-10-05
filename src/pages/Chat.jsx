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
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { authService } from "@/services/api";
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
  source = "filhotes", // "filhotes" | "matchpet"
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
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const user = authService.getCurrentUser();
    setCurrentUser(user);
    if (!user) {
      toast("Faça login para acessar suas conversas.");
      navigate("/login?redirect=/chat");
      return;
    }

    // Carrega conversas salvas
    const stored = getStoredConversations();
    setConversations(stored);
    if (initialChatId) {
      setActiveChatId(initialChatId);
    } else if (stored.length > 0) {
      setActiveChatId(stored[0].id);
    }
  }, [initialChatId, navigate]);

  // Sincroniza activeChatId com searchParams
  const selectConversation = (id) => {
    setActiveChatId(id);
    setSearchParams({ id });
  };

  const activeConversation = useMemo(() => {
    return conversations.find((c) => c.id === activeChatId) || null;
  }, [conversations, activeChatId]);

  // Scroll para a última mensagem
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

  const handleSendMessage = (textToSend = null) => {
    const text = (textToSend || messageText).trim();
    if (!text || !activeConversation) return;

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
                Comunicação direta com tutores de filhotes e conexões da comunidade.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              asChild
              variant="outline"
              size="sm"
              className="rounded-full border-primary/30 text-primary hover:bg-primary-soft text-xs"
            >
              <Link to="/filhotes">
                <ShoppingBag className="mr-1.5 h-3.5 w-3.5" />
                Ver Filhotes
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="sm"
              className="rounded-full border-primary/30 text-primary hover:bg-primary-soft text-xs"
            >
              <Link to="/matchpet">
                <HeartHandshake className="mr-1.5 h-3.5 w-3.5" />
                MatchPet
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
                    Ao navegar na aba Filhotes ou no MatchPet, clique em "Conversar com o Dono" para abrir uma conversa direta!
                  </p>
                  <Button
                    asChild
                    size="sm"
                    className="mt-4 rounded-full gradient-primary text-xs"
                  >
                    <Link to="/filhotes">Explorar Filhotes</Link>
                  </Button>
                </div>
              ) : (
                filteredConversations.map((c) => {
                  const isActive = c.id === activeChatId;
                  const lastMsg = c.messages?.[c.messages.length - 1];
                  return (
                    <button
                      key={c.id}
                      onClick={() => selectConversation(c.id)}
                      className={`flex w-full items-start gap-3 p-3.5 text-left transition-smooth ${
                        isActive
                          ? "bg-primary-soft/50 border-l-4 border-l-primary"
                          : "hover:bg-muted/40"
                      }`}
                    >
                      <Avatar className="h-11 w-11 rounded-2xl border shrink-0">
                        <AvatarImage src={getPetPhoto(c.petPhoto)} alt={c.petName} />
                        <AvatarFallback className="bg-primary text-primary-foreground font-bold text-xs">
                          {initials(c.petName || c.sellerName)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <p
                            className={`truncate text-xs font-semibold ${
                              isActive ? "text-primary" : "text-foreground"
                            }`}
                          >
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
                            ? `${lastMsg.from === "me" ? "Você: " : ""}${lastMsg.text}`
                            : "Iniciar conversa..."}
                        </p>
                        <div className="mt-1.5 flex items-center gap-1.5">
                          {c.source === "filhotes" ? (
                            <Badge
                              variant="outline"
                              className="text-[9px] px-1.5 py-0 rounded-md border-primary/30 text-primary"
                            >
                              🐾 Filhote / Ninhada
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
                        {initials(activeConversation.sellerName)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-bold text-foreground">
                          {activeConversation.sellerName}
                        </p>
                        <Badge
                          variant="secondary"
                          className="rounded-full text-[10px] bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                        >
                          🟢 Ativo no LivePet
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground truncate max-w-sm">
                        Sobre: {activeConversation.title || activeConversation.petName}
                      </p>
                    </div>
                  </div>

                  {/* Atalho WhatsApp */}
                  {activeConversation.sellerPhone && (
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
                <div className="flex-1 space-y-3 overflow-y-auto p-4 bg-muted/10">
                  {(!activeConversation.messages ||
                    activeConversation.messages.length === 0) ? (
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
                      const isMe = m.from === "me";
                      return (
                        <div
                          key={m.id}
                          className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm shadow-xs ${
                              isMe
                                ? "gradient-primary text-primary-foreground rounded-br-xs"
                                : "bg-card border text-foreground rounded-bl-xs"
                            }`}
                          >
                            <p className="leading-relaxed">{m.text}</p>
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

                {/* Atalhos Rápidos de Mensagem */}
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

                {/* Campo de Entrada de Mensagem */}
                <div className="flex items-center gap-2 border-t p-3 bg-card">
                  <Input
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                    placeholder="Escreva sua mensagem aqui…"
                    className="rounded-full text-xs h-10"
                  />
                  <Button
                    onClick={() => handleSendMessage()}
                    disabled={!messageText.trim()}
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
                  Escolha uma conversa na lista ao lado ou inicie uma nova através dos anúncios de filhotes.
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
