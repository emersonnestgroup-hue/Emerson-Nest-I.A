import React, { useState, useRef, useEffect } from "react";
import { 
  Send, Image as ImageIcon, FileText, Paperclip, X, Sparkles, HelpCircle,
  Play, Square, Volume2, ArrowDown, ExternalLink, Globe, Map, RefreshCw
} from "lucide-react";
import { Message, Attachment, Conversation } from "../types";
import { MarkdownRenderer } from "./MarkdownRenderer";

interface ChatWindowProps {
  activeConversation: Conversation | undefined;
  onSendMessage: (text: string, attachment?: Attachment) => void;
  onGenerateImage: (prompt: string) => void;
  isLoading: boolean;
  selectedVoice: string;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
  activeConversation,
  onSendMessage,
  onGenerateImage,
  isLoading,
  selectedVoice,
}) => {
  const [inputText, setInputText] = useState("");
  const [attachment, setAttachment] = useState<Attachment | null>(null);
  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);
  const [audioError, setAudioError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeConversation?.messages, isLoading]);

  // Handle file select and convert to base64
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert("Le fichier est trop volumineux. La limite est de 10 Mo.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64String = (reader.result as string).split(",")[1];
      const previewUrl = file.type.startsWith("image/") ? reader.result as string : undefined;

      setAttachment({
        uuid: Math.random().toString(),
        name: file.name,
        type: file.type,
        size: file.size,
        data: base64String,
        previewUrl,
      });
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeAttachment = () => {
    setAttachment(null);
  };

  const handleSend = () => {
    if (!inputText.trim() && !attachment) return;

    // Detect if user prompt starts with direct image commands (like /draw, /image)
    const textPart = inputText.trim();
    if (textPart.toLowerCase().startsWith("/imagine ") || textPart.toLowerCase().startsWith("crée une image") || textPart.toLowerCase().startsWith("génère une image")) {
      // It's an image generation shortcut request
      let promptText = textPart;
      if (textPart.toLowerCase().startsWith("/imagine ")) {
        promptText = textPart.slice(9).trim();
      }
      onGenerateImage(promptText);
    } else {
      onSendMessage(textPart, attachment || undefined);
    }

    setInputText("");
    setAttachment(null);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Trigger speech synthesis (TTS) for messages
  const handlePlayTTS = async (message: Message) => {
    if (playingMessageId === message.id) {
      // Stop audio
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      setPlayingMessageId(null);
      return;
    }

    // Stop current playing audio if any
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setPlayingMessageId(message.id);
    setAudioError(null);

    try {
      // Request TTS synthesised speech from node backend
      const response = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: message.text,
          voice: selectedVoice,
        }),
      });

      const responseData = await response.json();
      if (!responseData.success) {
        throw new Error(responseData.error || "Échec génération audio.");
      }

      const pcmBase64 = responseData.audio;
      const audioUrl = `data:audio/wav;base64,${pcmBase64}`;
      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.onended = () => {
        setPlayingMessageId(null);
      };
      
      audio.onerror = () => {
        setAudioError("Erreur lors de la lecture audio.");
        setPlayingMessageId(null);
      };

      await audio.play();

    } catch (err: any) {
      console.error("TTS play error:", err);
      // Fallback to client browser SpeechSynthesis if backend TTS fails or API keys limits are reached
      try {
        const utterance = new SpeechSynthesisUtterance(message.text);
        utterance.lang = "fr-FR";
        utterance.onend = () => setPlayingMessageId(null);
        utterance.onerror = () => {
          setAudioError("Échec de synthèse vocale.");
          setPlayingMessageId(null);
        };
        window.speechSynthesis.speak(utterance);
      } catch (browserErr) {
        setAudioError("Impossible de générer la synthèse vocale.");
        setPlayingMessageId(null);
      }
    }
  };

  // Elegant suggestion prompt bubbles
  const suggestions = [
    { label: "Générer une image", text: "Crée une image d'un phare astronomique suspendu dans une galaxie d'émeraude, style néo-futuriste." },
    { label: "Traduire", text: "Traduits en espagnol et explique-moi les subtilités de l'expression : 'Le jeu en vaut la chandelle'." },
    { label: "Bac à sable / Code", text: "Écris une fonction javascript pour animer une vague harmonieuse en SVG et explique comment elle fonctionne." },
    { label: "Analyse d'image", text: "Analyse cette image ou explique-moi comment la photographie transmet l'émotion." }
  ];

  const applySuggestion = (text: string) => {
    setInputText(text);
  };

  if (!activeConversation) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-slate-950 p-8 text-center text-slate-400">
        <Sparkles size={48} className="text-emerald-500 animate-pulse mb-4" />
        <h3 className="text-lg font-bold text-slate-100">Prêt à échanger</h3>
        <p className="text-xs text-slate-400 mt-1 max-w-md">
          Sélectionnez une discussion existante ou lancez-en une nouvelle pour activer Emerson Nest.
        </p>
      </div>
    );
  }

  const { messages, webSearchEnabled, mapSearchEnabled } = activeConversation;

  return (
    <div className="flex-1 flex flex-col bg-slate-950 relative overflow-hidden h-full">
      {/* Search status & Indicators */}
      <div className="px-6 py-3 bg-slate-900/60 border-b border-slate-800/80 flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-100 text-sm">{activeConversation.title}</span>
          <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-mono">
            Active
          </span>
        </div>
        <div className="flex items-center gap-3">
          {webSearchEnabled && (
            <span className="flex items-center gap-1 text-[11px] font-mono bg-emerald-950/40 text-emerald-400 border border-emerald-500/20 px-2 py-1 rounded-lg">
              <Globe size={11} className="animate-spin-slow" />
              Recherche Google Active
            </span>
          )}
          {mapSearchEnabled && (
            <span className="flex items-center gap-1 text-[11px] font-mono bg-teal-950/40 text-teal-400 border border-teal-500/20 px-2 py-1 rounded-lg">
              <Map size={11} />
              Cartographie Active
            </span>
          )}
        </div>
      </div>

      {/* Message Feed Area */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 scrollbar-thin">
        {messages.length === 0 ? (
          <div className="max-w-2xl mx-auto py-12 text-center flex flex-col items-center justify-center h-full">
            <div className="relative mb-6">
              <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 opacity-20 animate-ping absolute" />
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 font-black text-2xl shadow-xl shadow-emerald-500/20">
                E
              </div>
            </div>
            
            <h2 className="text-xl font-extrabold text-slate-100 tracking-tight">Bonjour ! Je suis Emerson Nest</h2>
            <p className="text-slate-400 text-sm mt-2 max-w-lg leading-relaxed">
              Une technologie d'Intelligence Artificielle universelle et multimodale. Je peux rédiger des textes, analyser vos images, exécuter vos codes, ou concevoir vos graphiques sans restriction.
            </p>

            <div className="w-full mt-10 space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-widest justify-center">
                <Sparkles size={12} className="text-emerald-400" />
                Suggestions de départ
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl mx-auto text-left">
                {suggestions.map((s, idx) => (
                  <button
                    key={idx}
                    onClick={() => applySuggestion(s.text)}
                    className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/40 hover:bg-slate-900 hover:border-slate-700 text-left transition-all duration-200"
                  >
                    <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider block mb-1">
                      {s.label}
                    </span>
                    <span className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                      {s.text}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto space-y-6">
            {messages.map((msg) => {
              const isEmerson = msg.sender === "emerson";
              const isPlaying = playingMessageId === msg.id;

              return (
                <div 
                  key={msg.id}
                  className={`flex gap-4 ${isEmerson ? "justify-start" : "justify-end"}`}
                >
                  {/* Avatar left */}
                  {isEmerson && (
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 font-extrabold text-sm flex items-center justify-center shadow-md shadow-emerald-500/10 shrink-0">
                      EN
                    </div>
                  )}

                  {/* Message container bubble */}
                  <div className={`max-w-[85%] rounded-2xl p-5 ${
                    isEmerson 
                      ? "bg-slate-900 border border-slate-800/80 text-slate-200 shadow-md" 
                      : "bg-emerald-950/60 border border-emerald-800/30 text-emerald-50 shadow-sm"
                  }`}>
                    {/* Attachments inside user message */}
                    {!isEmerson && msg.attachment && (
                      <div className="mb-3.5 p-2 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center gap-3">
                        {msg.attachment.previewUrl ? (
                          <img 
                            src={msg.attachment.previewUrl} 
                            alt="Pièce jointe" 
                            className="w-14 h-14 object-cover rounded-lg border border-slate-700" 
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-slate-900 flex items-center justify-center text-slate-400 border border-slate-800">
                            <FileText size={20} />
                          </div>
                        )}
                        <div className="text-left">
                          <p className="text-xs font-semibold text-slate-200 truncate max-w-xs">{msg.attachment.name}</p>
                          <p className="text-[10px] text-slate-500 font-mono">{(msg.attachment.size / 1024).toFixed(1)} Ko</p>
                        </div>
                      </div>
                    )}

                    {/* Chat Text message */}
                    {msg.text && (
                      <div className="text-left">
                        <MarkdownRenderer text={msg.text} />
                      </div>
                    )}

                    {/* Image outcome area if it's generated */}
                    {isEmerson && msg.imageGenerated && (
                      <div className="mt-4 rounded-xl overflow-hidden border border-slate-800 bg-slate-950/40 p-1">
                        <div className="relative group">
                          {/* Main rendered image */}
                          <img
                            src={msg.imageGenerated.url}
                            alt="Image générée"
                            className="w-full h-auto object-cover max-h-[460px] rounded-lg shadow-inner"
                            referrerPolicy="no-referrer"
                          />
                          <a 
                            href={msg.imageGenerated.url}
                            target="_blank"
                            rel="noreferrer"
                            className="absolute right-3 bottom-3 p-2 rounded-lg bg-slate-950/80 hover:bg-slate-900 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5 text-xs font-semibold border border-slate-800"
                          >
                            <ExternalLink size={13} />
                            Agrandir l'image
                          </a>
                        </div>
                        
                        <div className="p-3 text-left border-t border-slate-900 bg-slate-950/20">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-mono text-slate-500">
                              Modèle : {msg.imageGenerated.modelUsed}
                            </span>
                            {msg.imageGenerated.isFallback && (
                              <span className="px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[9px] font-semibold uppercase tracking-wider">
                                Générateur local
                              </span>
                            )}
                          </div>
                          {msg.imageGenerated.reason && (
                            <p className="text-[10px] text-amber-500/80 mt-1 italic leading-tight">
                              {msg.imageGenerated.reason}
                            </p>
                          )}
                          <p className="text-[11px] text-slate-400 mt-2 bg-slate-950 p-2 rounded border border-slate-900 leading-normal font-medium">
                            <strong className="text-slate-350 text-[10px] uppercase font-mono block mb-0.5">Prompt d'Origine :</strong>
                            "{msg.imageGenerated.promptUsed}"
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Grounding web sources */}
                    {isEmerson && msg.grounding && msg.grounding.length > 0 && (
                      <div className="mt-4 pt-3 border-t border-slate-800/60 text-left">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 mb-2">
                          <Globe size={11} className="text-emerald-400" />
                          Sources de recherche Google :
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {msg.grounding.map((src, sIdx) => (
                            <a
                              key={sIdx}
                              href={src.uri}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-950 text-slate-300 hover:text-white border border-slate-850 hover:border-emerald-500/30 transition-all shadow-sm"
                            >
                              {src.type === "maps" ? <Map size={11} className="text-teal-400" /> : <Globe size={11} className="text-emerald-400" />}
                              <span className="truncate max-w-[150px]">{src.title}</span>
                              <ExternalLink size={10} className="text-slate-500" />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Message Meta Controls (TTS speaker button and Timestamp) */}
                    <div className="mt-3.5 pt-2.5 border-t border-slate-800/40 flex items-center justify-between text-[11px] text-slate-500">
                      <span className="font-mono">{msg.timestamp}</span>
                      
                      {isEmerson && (
                        <div className="flex items-center gap-2">
                          {audioError && <span className="text-[10px] text-rose-400 mr-2">{audioError}</span>}
                          
                          <button
                            onClick={() => handlePlayTTS(msg)}
                            className={`flex items-center gap-1 px-2 py-1 rounded bg-slate-950 hover:bg-slate-900 border border-slate-850 text-slate-300 hover:text-white transition-colors duration-200 ${
                              isPlaying ? "text-emerald-400 border-emerald-500/20" : ""
                            }`}
                            title="Synthèse Vocal"
                          >
                            {isPlaying ? (
                              <>
                                <Square size={11} className="text-emerald-400 fill-emerald-400" />
                                <span className="font-semibold text-emerald-400">Arrêter l'audio</span>
                                <span className="flex items-center gap-0.5 ml-1">
                                  <span className="w-1 h-3 bg-emerald-400 rounded-full animate-pulse"></span>
                                  <span className="w-1 h-1 bg-emerald-400 rounded-full animate-pulse delay-75"></span>
                                  <span className="w-1 h-2 bg-emerald-400 rounded-full animate-pulse delay-150"></span>
                                </span>
                              </>
                            ) : (
                              <>
                                <Play size={11} className="fill-slate-400 text-slate-400" />
                                <span>Écouter la réponse</span>
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Spacer right */}
                  {!isEmerson && (
                    <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center text-xs text-slate-400 shrink-0">
                      U
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
        
        {/* Loader skeleton state */}
        {isLoading && (
          <div className="max-w-3xl mx-auto flex gap-4 justify-start">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 font-extrabold text-sm flex items-center justify-center animate-spin-slow">
              EN
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 w-full max-w-lg shadow-md space-y-3">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-xs text-emerald-400 font-semibold tracking-wide">Emerson Nest réfléchit...</span>
              </div>
              <div className="space-y-2">
                <div className="h-3 w-5/6 bg-slate-800 rounded animate-pulse" />
                <div className="h-3 w-1/2 bg-slate-800 rounded animate-pulse" />
                <div className="h-2 w-3/4 bg-slate-800 rounded animate-pulse" />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input prompt dock panel */}
      <div className="p-4 bg-slate-900/60 border-t border-slate-800/80">
        <div className="max-w-3xl mx-auto">
          {/* Active attachment display */}
          {attachment && (
            <div className="mb-3 p-2 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {attachment.previewUrl ? (
                  <img 
                    src={attachment.previewUrl} 
                    alt="Pièce jointe" 
                    className="w-12 h-12 object-cover rounded-lg border border-slate-800" 
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-slate-900 flex items-center justify-center text-slate-400 border border-slate-850">
                    <FileText size={18} />
                  </div>
                )}
                <div className="text-left">
                  <p className="text-xs font-semibold text-slate-200 truncate max-w-md">{attachment.name}</p>
                  <p className="text-[10px] text-slate-500 font-mono">{(attachment.size / 1024).toFixed(1)} Ko</p>
                </div>
              </div>
              <button 
                onClick={removeAttachment}
                className="p-1 px-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-900 transition-colors"
                title="Supprimer la pièce jointe"
              >
                <X size={15} />
              </button>
            </div>
          )}

          {/* Interactive input components */}
          <div className="relative flex items-center bg-slate-950 rounded-2xl border border-slate-800 focus-within:border-emerald-500/60 transition-all p-2 shadow-inner">
            <input 
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*,text/plain"
              className="hidden"
            />
            
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-2 w-10 h-10 flex items-center justify-center rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-850 text-slate-400 hover:text-slate-200 transition-all"
              title="Ajouter une image ou un texte"
            >
              <Paperclip size={18} />
            </button>

            <textarea
              rows={1}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Écrivez un message ou tapez /imagine ..."
              className="flex-1 max-h-32 min-h-[40px] py-2 px-3 text-sm bg-transparent outline-none text-slate-100 placeholder-slate-500 resize-none font-medium leading-relaxed"
            />

            <button
              onClick={handleSend}
              disabled={(!inputText.trim() && !attachment) || isLoading}
              className={`p-2.5 rounded-xl flex items-center justify-center font-medium shadow-md transition-all active:scale-[0.98] ${
                (!inputText.trim() && !attachment) || isLoading
                  ? "bg-slate-900 border border-slate-850 text-slate-600 cursor-not-allowed shadow-none"
                  : "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-500/15"
              }`}
            >
              <Send size={16} />
            </button>
          </div>

          <div className="flex items-center justify-between text-[10px] text-slate-500 mt-2 px-1">
            <span className="flex items-center gap-1">
              <Sparkles size={11} className="text-emerald-400" />
              Raccourci: <strong>/imagine [prompt]</strong> pour créer une image
            </span>
            <span>Appuyez sur Entrée pour envoyer</span>
          </div>
        </div>
      </div>
    </div>
  );
};
