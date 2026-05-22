import React, { useState } from "react";
import { 
  Plus, MessageSquare, Trash2, Edit3, Settings, Save, X, Check,
  Search, MapPin, AudioLines, Image, ChevronRight, Menu, HelpCircle, Laptop
} from "lucide-react";
import { Conversation } from "../types";

interface SidebarProps {
  conversations: Conversation[];
  activeConversationId: string;
  onSelectConversation: (id: string) => void;
  onCreateConversation: () => void;
  onDeleteConversation: (id: string) => void;
  onRenameConversation: (id: string, newTitle: string) => void;
  onToggleWebSearch: (id: string) => void;
  onToggleMapSearch: (id: string) => void;
  selectedVoice: string;
  onSelectVoice: (voice: string) => void;
  imageRatio: string;
  onSelectImageRatio: (ratio: string) => void;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (isOpen: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  conversations,
  activeConversationId,
  onSelectConversation,
  onCreateConversation,
  onDeleteConversation,
  onRenameConversation,
  onToggleWebSearch,
  onToggleMapSearch,
  selectedVoice,
  onSelectVoice,
  imageRatio,
  onSelectImageRatio,
  isSidebarOpen,
  setIsSidebarOpen,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [showSettings, setShowSettings] = useState(false);

  const startRename = (id: string, title: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(id);
    setEditTitle(title);
  };

  const saveRename = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (editTitle.trim()) {
      onRenameConversation(id, editTitle.trim());
    }
    setEditingId(null);
  };

  const handleCreateNew = () => {
    onCreateConversation();
    if (window.innerWidth < 1024) {
      setIsSidebarOpen(false);
    }
  };

  // Active/current item configuration
  const activeChat = conversations.find(c => c.id === activeConversationId);

  return (
    <>
      {/* Mobile Backdrop overlay */}
      {isSidebarOpen && (
        <div 
          onClick={() => setIsSidebarOpen(false)}
          className="lg:hidden fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-40 transition-opacity duration-300" 
        />
      )}

      <aside className={`fixed lg:static top-0 left-0 bottom-0 w-80 bg-slate-900 border-r border-slate-800/80 flex flex-col z-50 transition-transform duration-300 transform 
        ${isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"} h-full`}
      >
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 font-bold shadow-md shadow-emerald-500/10">
              <span className="text-lg font-extrabold tracking-tight">EN</span>
              <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500"></span>
              </span>
            </div>
            <div>
              <h1 className="font-semibold text-slate-100 text-md tracking-tight">Emerson Nest</h1>
              <p className="text-[11px] text-slate-400 font-medium">I.A. Universelle & Multimodale</p>
            </div>
          </div>
          <button 
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800"
          >
            <X size={18} />
          </button>
        </div>

        {/* Action Button: Nouvelle Conversation */}
        <div className="p-4">
          <button
            onClick={handleCreateNew}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-medium text-sm transition-all duration-200 shadow-lg shadow-emerald-950/20 active:scale-[0.98]"
          >
            <Plus size={18} />
            <span>Nouvelle Discussion</span>
          </button>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
          <div className="px-3 py-1.5 text-[11px] font-bold tracking-wider text-slate-400 uppercase">
            Discussions récentes
          </div>

          {conversations.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-500 italic px-4">
              Aucun échange pour le moment. Créez-en un avec le bouton ci-dessus !
            </div>
          ) : (
            conversations.map((chat) => {
              const isActive = chat.id === activeConversationId;
              const isEditing = editingId === chat.id;

              return (
                <div
                  key={chat.id}
                  onClick={() => {
                    onSelectConversation(chat.id);
                    if (window.innerWidth < 1024) {
                      setIsSidebarOpen(false);
                    }
                  }}
                  className={`group relative flex items-center gap-3 py-3 px-3 rounded-xl cursor-pointer transition-all duration-150 ${
                    isActive 
                      ? "bg-slate-800/80 text-white border-l-2 border-emerald-500" 
                      : "text-slate-400 hover:bg-slate-800/35 hover:text-slate-200"
                  }`}
                >
                  <MessageSquare size={16} className={isActive ? "text-emerald-400" : "text-slate-500"} />
                  
                  <div className="flex-1 min-w-0 pr-12">
                    {isEditing ? (
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") saveRename(chat.id, e as any);
                          if (e.key === "Escape") setEditingId(null);
                        }}
                        className="w-full py-0.5 px-1.5 text-xs bg-slate-950 rounded border border-slate-700 text-white font-normal focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        autoFocus
                      />
                    ) : (
                      <span className="text-xs font-medium block truncate">
                        {chat.title}
                      </span>
                    )}
                    <span className="text-[10px] text-slate-500 font-mono block mt-0.5">
                      {chat.createdAt}
                    </span>
                  </div>

                  {/* Actions buttons */}
                  {!isEditing && (
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 flex items-center gap-1 bg-gradient-to-l from-slate-800/90 via-slate-800 to-transparent pl-3 pr-1 py-1 rounded-r-xl transition-opacity">
                      <button
                        onClick={(e) => startRename(chat.id, chat.title, e)}
                        className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                        title="Renommer"
                      >
                        <Edit3 size={12} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteConversation(chat.id);
                        }}
                        className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-slate-700 transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  )}

                  {isEditing && (
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 z-10 bg-slate-900 px-1 py-0.5 rounded">
                      <button
                        onClick={(e) => saveRename(chat.id, e)}
                        className="p-1 rounded hover:bg-slate-800 text-emerald-400"
                        title="Enregistrer"
                      >
                        <Check size={12} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingId(null);
                        }}
                        className="p-1 rounded hover:bg-slate-800 text-slate-400"
                        title="Annuler"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Grounding Controls panel for active conversation */}
        {activeChat && (
          <div className="px-4 py-3 bg-slate-950/40 border-t border-slate-800/80 space-y-3">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1">
              <Laptop size={11} className="text-slate-400" />
              Outils Grounding (Gemini)
            </div>

            <div className="space-y-2">
              {/* Web Search Tool */}
              <div className="flex items-center justify-between py-1.5 px-2 bg-slate-900/60 rounded-xl border border-slate-800/40">
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded-lg ${activeChat.webSearchEnabled ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-500'}`}>
                    <Search size={14} />
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-semibold text-slate-200">Recherche Web</p>
                    <p className="text-[9px] text-slate-500">Google Search live</p>
                  </div>
                </div>
                <button
                  onClick={() => onToggleWebSearch(activeConversationId)}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${
                    activeChat.webSearchEnabled ? "bg-emerald-500" : "bg-slate-700"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ${
                      activeChat.webSearchEnabled ? "translate-x-4" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              {/* Map/Location Tool */}
              <div className="flex items-center justify-between py-1.5 px-2 bg-slate-900/60 rounded-xl border border-slate-800/40">
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded-lg ${activeChat.mapSearchEnabled ? 'bg-teal-500/10 text-teal-400' : 'bg-slate-800 text-slate-500'}`}>
                    <MapPin size={14} />
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-semibold text-slate-200">Recherche Cartes</p>
                    <p className="text-[9px] text-slate-500">Google Maps places</p>
                  </div>
                </div>
                <button
                  onClick={() => onToggleMapSearch(activeConversationId)}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${
                    activeChat.mapSearchEnabled ? "bg-teal-500" : "bg-slate-700"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ${
                      activeChat.mapSearchEnabled ? "translate-x-4" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Global configuration / settings section */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/20">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="w-full flex items-center justify-between py-2 px-3 rounded-lg hover:bg-slate-800/50 text-slate-400 hover:text-slate-100 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Settings size={15} className={showSettings ? "animate-spin text-emerald-400" : ""} />
              <span className="text-xs font-medium">Préférences (Voix & Image)</span>
            </div>
            <ChevronRight size={13} className={`transform transition-transform ${showSettings ? "rotate-90" : ""}`} />
          </button>

          {showSettings && (
            <div className="mt-3 pt-3 border-t border-slate-800/60 space-y-3.5 text-left">
              {/* Voice Choice */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <AudioLines size={10} className="text-emerald-400" />
                  Voix de synthèse (TTS)
                </label>
                <div className="grid grid-cols-2 gap-1">
                  {["Kore", "Zephyr", "Puck", "Fenrir"].map((v) => (
                    <button
                      key={v}
                      onClick={() => onSelectVoice(v)}
                      className={`py-1.5 px-2 rounded text-left text-[11px] font-medium transition-colors ${
                        selectedVoice === v 
                          ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/30" 
                          : "bg-slate-900 text-slate-400 hover:bg-slate-850 hover:text-slate-200"
                      }`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>

              {/* Image ratio choice */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <Image size={10} className="text-emerald-400" />
                  Format Génération Image
                </label>
                <div className="grid grid-cols-3 gap-1">
                  {["1:1", "16:9", "9:16"].map((r) => (
                    <button
                      key={r}
                      onClick={() => onSelectImageRatio(r)}
                      className={`py-1 px-1.5 rounded text-center text-[11px] font-mono transition-colors ${
                        imageRatio === r 
                          ? "bg-teal-500/10 text-teal-300 border border-teal-500/30" 
                          : "bg-slate-900 text-slate-400 hover:bg-slate-850 hover:text-slate-200"
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* User Info footer */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/60 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700">
            <span className="font-mono text-xs font-bold text-slate-300 uppercase">U</span>
          </div>
          <div className="flex-1 min-w-0 text-left">
            <h4 className="text-xs font-semibold text-slate-300 truncate">Utilisateur</h4>
            <p className="text-[10px] text-slate-500 truncate font-mono">louisemerson001</p>
          </div>
          <div title="Système en ligne" className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-[10px] font-semibold text-emerald-400 font-mono">Live</span>
          </div>
        </div>
      </aside>
    </>
  );
};
