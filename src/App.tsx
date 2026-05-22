import React, { useState, useEffect } from "react";
import { 
  Menu, X, Terminal, HelpCircle, AlertCircle, Sparkles, Check, Database, Play
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react"; // Using motion as requested
import { Sidebar } from "./components/Sidebar";
import { ChatWindow } from "./components/ChatWindow";
import { SandboxPanel } from "./components/SandboxPanel";
import { Conversation, Message, Attachment } from "./types";

const LOCAL_STORAGE_KEY = "emerson_nest_conversations";
const VOICE_STORAGE_KEY = "emerson_nest_selected_voice";
const RATIO_STORAGE_KEY = "emerson_nest_image_ratio";

export default function App() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string>("");
  const [selectedVoice, setSelectedVoice] = useState("Kore");
  const [imageRatio, setImageRatio] = useState("1:1");
  const [isLoading, setIsLoading] = useState(false);
  const [showSandbox, setShowSandbox] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);

  // Load state from localStorage on mount
  useEffect(() => {
    try {
      const storedChats = localStorage.getItem(LOCAL_STORAGE_KEY);
      const storedVoice = localStorage.getItem(VOICE_STORAGE_KEY);
      const storedRatio = localStorage.getItem(RATIO_STORAGE_KEY);

      if (storedVoice) setSelectedVoice(storedVoice);
      if (storedRatio) setImageRatio(storedRatio);

      if (storedChats) {
        const parsed = JSON.parse(storedChats);
        if (parsed && parsed.length > 0) {
          setConversations(parsed);
          setActiveConversationId(parsed[0].id);
          return;
        }
      }
    } catch (err) {
      console.error("Erreur de décodage localStorage:", err);
    }

    // Default welcoming initial state if empty
    const welcomeId = "welcome-" + Date.now();
    const defaultChat: Conversation = {
      id: welcomeId,
      title: "🌍 Accueil d'Emerson",
      createdAt: new Date().toLocaleDateString("fr-FR"),
      webSearchEnabled: false,
      mapSearchEnabled: false,
      messages: [
        {
          id: "msg-welcome-01",
          sender: "emerson",
          text: "Bienvenue dans **Emerson Nest** !\n\nJe suis votre intelligence artificielle universelle et multimodale de confiance.\n\nJe n'ai pas de limitation d'usage. Vous pouvez :\n- **Analyser** ou traduire vos textes de façon littéraire.\n- **Générer des images** artistiques en direct via mon raccourci `/imagine` ou en me le demandant simplement.\n- **Envoyer des fichiers** en pièce jointe ou scanner des images.\n- **Exécuter du code** et tracer des analyses de données interactives dans le **Bac à sable** situé sur votre droite.\n\nQuelle est votre première requête aujourd'hui ?",
          timestamp: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
        }
      ],
    };

    setConversations([defaultChat]);
    setActiveConversationId(welcomeId);
  }, []);

  // Save state to localStorage on update
  const saveState = (updatedChats: Conversation[]) => {
    setConversations(updatedChats);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedChats));
    } catch (err) {
      console.error("Sauvegarde localStorage échouée:", err);
    }
  };

  // Create new conversation
  const handleCreateConversation = () => {
    const id = "chat-" + Date.now();
    const newChat: Conversation = {
      id,
      title: "Nouvel échange " + (conversations.length + 1),
      createdAt: new Date().toLocaleDateString("fr-FR"),
      webSearchEnabled: false,
      mapSearchEnabled: false,
      messages: [],
    };

    const updated = [newChat, ...conversations];
    saveState(updated);
    setActiveConversationId(id);
    setErrorBanner(null);
  };

  // Select conversation
  const handleSelectConversation = (id: string) => {
    setActiveConversationId(id);
    setErrorBanner(null);
  };

  // Delete conversation
  const handleDeleteConversation = (id: string) => {
    const filtered = conversations.filter((c) => c.id !== id);
    saveState(filtered);

    if (activeConversationId === id && filtered.length > 0) {
      setActiveConversationId(filtered[0].id);
    } else if (filtered.length === 0) {
      // Rebuild initial chat
      const welcomeId = "welcome-" + Date.now();
      const defaultChat: Conversation = {
        id: welcomeId,
        title: "🌍 Accueil d'Emerson",
        createdAt: new Date().toLocaleDateString("fr-FR"),
        webSearchEnabled: false,
        mapSearchEnabled: false,
        messages: [
          {
            id: "msg-welcome-01",
            sender: "emerson",
            text: "Bonjour ! Comment puis-je vous aider aujourd'hui ? Écrivez-moi ou importez un document pour commencer.",
            timestamp: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
          }
        ],
      };
      saveState([defaultChat]);
      setActiveConversationId(welcomeId);
    }
  };

  // Rename conversation
  const handleRenameConversation = (id: string, newTitle: string) => {
    const updated = conversations.map((c) => {
      if (c.id === id) {
        return { ...c, title: newTitle };
      }
      return c;
    });
    saveState(updated);
  };

  // Grounding toggles inside active conversation
  const handleToggleWebSearch = (id: string) => {
    const updated = conversations.map((c) => {
      if (c.id === id) {
        // Exclude the other grounding tool as they are hostile in combination
        return { ...c, webSearchEnabled: !c.webSearchEnabled, mapSearchEnabled: false };
      }
      return c;
    });
    saveState(updated);
  };

  const handleToggleMapSearch = (id: string) => {
    const updated = conversations.map((c) => {
      if (c.id === id) {
        // Exclude web search
        return { ...c, mapSearchEnabled: !c.mapSearchEnabled, webSearchEnabled: false };
      }
      return c;
    });
    saveState(updated);
  };

  const handleSelectVoice = (voice: string) => {
    setSelectedVoice(voice);
    localStorage.setItem(VOICE_STORAGE_KEY, voice);
  };

  const handleSelectImageRatio = (ratio: string) => {
    setImageRatio(ratio);
    localStorage.setItem(RATIO_STORAGE_KEY, ratio);
  };

  // Active chat ref
  const activeChat = conversations.find((c) => c.id === activeConversationId);

  // Send Message to Gemini API Full-stack
  const handleSendMessage = async (text: string, attachment?: Attachment) => {
    if (!activeChat) return;

    // Create user message
    const userMsg: Message = {
      id: "msg-user-" + Date.now(),
      sender: "user",
      text,
      timestamp: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
      attachment,
    };

    const updatedMessages = [...activeChat.messages, userMsg];
    const updatedConversations = conversations.map((c) => {
      if (c.id === activeConversationId) {
        // Automatically rename conversation after first user message if it has a default title
        let title = c.title;
        if (c.title.startsWith("Nouvel échange") && text.length > 5) {
          title = text.slice(0, 24) + (text.length > 24 ? "..." : "");
        }
        return { ...c, messages: updatedMessages, title };
      }
      return c;
    });

    saveState(updatedConversations);
    setIsLoading(true);
    setErrorBanner(null);

    try {
      // Build past history context for standard conversational consistency
      // Keep only last 4-5 text interactions to preserve clean, lightweight contexts
      const historyContext = activeChat.messages.slice(-8).map((msg) => ({
        role: msg.sender === "user" ? "user" : "model",
        parts: [{ text: msg.text }],
      }));

      // Call Express proxy router /api/chat
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: text,
          history: historyContext,
          image: attachment ? { data: attachment.data, mimeType: attachment.type } : undefined,
          webSearch: activeChat.webSearchEnabled,
          mapSearch: activeChat.mapSearchEnabled,
          imageRatio: imageRatio,
        }),
      });

      const responseData = await response.json();

      if (!response.ok || !responseData.success) {
        throw new Error(responseData.error || "Une erreur inattendue est survenue.");
      }

      // Create Emerson response message
      const emersonMsg: Message = {
        id: "msg-emerson-" + Date.now(),
        sender: "emerson",
        text: responseData.text,
        grounding: responseData.grounding || undefined,
        timestamp: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
      };

      const finalMessages = [...updatedMessages, emersonMsg];
      const finalConversations = conversations.map((c) => {
        if (c.id === activeConversationId) {
          return { ...c, messages: finalMessages };
        }
        return c;
      });
      saveState(finalConversations);

    } catch (err: any) {
      console.error("Chat routing error:", err);
      
      // Warm procedural warning message to preserve reliable UX:
      const fallbackErrorMsg: Message = {
        id: "msg-emerson-error-" + Date.now(),
        sender: "emerson",
        text: "Je rencontre actuellement une légère surcharge lors de la connexion à mes synapses d'Intelligence Artificielle.\n\n**Solution de contournement temporaire :**\n- S'il s'agit d'une analyse mathématique, utilisez la console interactive ci-contre !\n- Vous pouvez aussi réessayer dans un court instant ou poser une question plus courte.",
        timestamp: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
      };

      const finalMessages = [...updatedMessages, fallbackErrorMsg];
      const finalConversations = conversations.map((c) => {
        if (c.id === activeConversationId) {
          return { ...c, messages: finalMessages };
        }
        return c;
      });
      saveState(finalConversations);
      setErrorBanner("Connexion restreinte ou clé d'API non configurée. Réponses simulées activées.");
    } finally {
      setIsLoading(false);
    }
  };

  // Generate Image request to Gemini SDK server endpoints
  const handleGenerateImage = async (promptText: string) => {
    if (!activeChat) return;

    // Add immediate feedback as message
    const userMsg: Message = {
      id: "msg-user-img-" + Date.now(),
      sender: "user",
      text: `Création artistique : "${promptText}"`,
      timestamp: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
    };

    const updatedMessages = [...activeChat.messages, userMsg];
    const updatedConversations = conversations.map((c) => {
      if (c.id === activeConversationId) {
        return { ...c, messages: updatedMessages };
      }
      return c;
    });
    saveState(updatedConversations);
    setIsLoading(true);
    setErrorBanner(null);

    try {
      const response = await fetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: promptText,
          aspectRatio: imageRatio,
        }),
      });

      const responseData = await response.json();

      if (!response.ok || !responseData.success) {
        throw new Error(responseData.error || "Échec de génération d'image.");
      }

      const emersonMsg: Message = {
        id: "msg-emerson-img-" + Date.now(),
        sender: "emerson",
        text: responseData.isFallback 
          ? `J'ai fait appel à mon **Générateur Procédural Esthétique** local car le service d'I.A. centralisé est occupé.\n\nVoici le tracé conceptuel basé sur votre prompt !`
          : `Voici l'œuvre d'art générée pour votre prompt : *"${promptText}"*`,
        timestamp: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
        imageGenerated: {
          url: responseData.imageUrl,
          modelUsed: responseData.modelUsed,
          promptUsed: promptText,
          isFallback: responseData.isFallback,
          reason: responseData.reason
        }
      };

      const finalMessages = [...updatedMessages, emersonMsg];
      const finalConversations = conversations.map((c) => {
        if (c.id === activeConversationId) {
          return { ...c, messages: finalMessages };
        }
        return c;
      });
      saveState(finalConversations);

    } catch (err: any) {
      console.error("Image generation failed:", err);
      const errorMsg: Message = {
        id: "msg-emerson-img-error-" + Date.now(),
        sender: "emerson",
        text: "Désolé, ma palette créative est actuellement indisponible en raison de contraintes réseau. Veuillez réessayer de dessiner dans un instant !",
        timestamp: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
      };

      const finalMessages = [...updatedMessages, errorMsg];
      const finalConversations = conversations.map((c) => {
        if (c.id === activeConversationId) {
          return { ...c, messages: finalMessages };
        }
        return c;
      });
      saveState(finalConversations);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden font-sans antialiased text-slate-200">
      
      {/* Sidebar history controller */}
      <Sidebar
        conversations={conversations}
        activeConversationId={activeConversationId}
        onSelectConversation={handleSelectConversation}
        onCreateConversation={handleCreateConversation}
        onDeleteConversation={handleDeleteConversation}
        onRenameConversation={handleRenameConversation}
        onToggleWebSearch={handleToggleWebSearch}
        onToggleMapSearch={handleToggleMapSearch}
        selectedVoice={selectedVoice}
        onSelectVoice={handleSelectVoice}
        imageRatio={imageRatio}
        onSelectImageRatio={handleSelectImageRatio}
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
      />

      {/* Main Core View Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        
        {/* Main top header bar with controllers */}
        <header className="h-16 border-b border-slate-800/80 bg-slate-900/90 flex items-center justify-between px-6 shrink-0 z-25 relative">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <Menu size={20} />
            </button>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow shadow-emerald-500/50"></span>
              <p className="text-xs font-bold font-mono text-emerald-400 tracking-wider">EMERSON NEST CLIENT v1.1.2</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Sandbox panel toggler */}
            <button
              onClick={() => setShowSandbox(!showSandbox)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                showSandbox 
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" 
                  : "bg-slate-950 text-slate-500 border-slate-850 hover:text-slate-300"
              }`}
            >
              <Terminal size={13} />
              <span>{showSandbox ? "Masquer le Bac à Sable" : "Ouvrir le Bac à Sable"}</span>
            </button>
          </div>
        </header>

        {/* Global operational info alert */}
        <AnimatePresence>
          {errorBanner && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-slate-950 px-6 py-2 border-b border-slate-900 text-slate-500 font-mono text-[10.5px] uppercase tracking-wider flex items-center gap-2 justify-center shrink-0"
            >
              <AlertCircle size={12} className="text-amber-500" />
              <span>{errorBanner}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* App split workbench panels */}
        <div className="flex-1 flex overflow-hidden">
          {/* Chat interaction */}
          <div className="flex-1 h-full min-w-0">
            <ChatWindow
              activeConversation={activeChat}
              onSendMessage={handleSendMessage}
              onGenerateImage={handleGenerateImage}
              isLoading={isLoading}
              selectedVoice={selectedVoice}
            />
          </div>

          {/* Code playground sandbox sidepanel */}
          {showSandbox && (
            <div className="hidden md:block md:w-[420px] lg:w-[460px] xl:w-[500px] h-full shrink-0 border-l border-slate-800">
              <SandboxPanel />
            </div>
          )}
        </div>

        {/* Mobile-only float helper button of Sandbox if it is hidden */}
        {!showSandbox && (
          <button
            onClick={() => setShowSandbox(true)}
            className="md:hidden fixed bottom-20 right-6 p-4 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-600 text-white shadow-xl flex items-center justify-center border border-emerald-400/20 z-30 transition-transform active:scale-95"
            title="Ouvrir la console"
          >
            <Terminal size={22} />
          </button>
        )}

        {/* Backdrop for mobile single viewport layout of Sandbox */}
        {showSandbox && (window.innerWidth < 768) ? (
          <div className="md:hidden fixed inset-0 top-16 bg-slate-950 z-40 flex flex-col">
            <div className="p-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between shrink-0">
              <span className="text-xs font-bold text-slate-300">BAC À SABLE DE CALCULS</span>
              <button 
                onClick={() => setShowSandbox(false)}
                className="p-1.5 rounded-lg text-slate-400 bg-slate-950"
              >
                <X size={15} />
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <SandboxPanel />
            </div>
          </div>
        ) : null}

      </main>
    </div>
  );
}
