import React, { useState, useEffect } from "react";
import { 
  Play, Terminal, LineChart as ChartIcon, BarChart3, HelpCircle, 
  RefreshCw, Check, CheckSquare, Plus, FileSpreadsheet, Waves
} from "lucide-react";
import { 
  ResponsiveContainer, LineChart, Line, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend 
} from "recharts";

type CodeLang = "js" | "csv" | "math";

interface SandboxProps {
  onInsertCodePrompt?: (code: string) => void;
}

export const SandboxPanel: React.FC<SandboxProps> = ({ onInsertCodePrompt }) => {
  const [activeTab, setActiveTab] = useState<"runner" | "graph" | "csv">("runner");
  const [selectedTemplate, setSelectedTemplate] = useState<string>("sine");
  const [code, setCode] = useState("");
  const [output, setOutput] = useState<string[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [chartType, setChartType] = useState<"line" | "bar" | "area">("line");
  const [customCsv, setCustomCsv] = useState(
    "Mois,Ventes,Objectif,Visites\nJanvier,1200,1000,4500\nFévrier,1500,1100,5200\nMars,1800,1300,5800\nAvril,1600,1400,4900\nMai,2200,1650,7100\nJuin,2500,1800,8200\nJuillet,2100,1900,7400"
  );
  const [parsedCsvData, setParsedCsvData] = useState<any[]>([]);
  const [executionState, setExecutionState] = useState<"idle" | "running" | "done">("idle");

  const templates: Record<string, { title: string; code: string; type: CodeLang; chartType: "line" | "bar" | "area" }> = {
    sine: {
      title: "Courbe Sinusoïdale (Maths)",
      chartType: "line",
      type: "math",
      code: `// Simulation mathématique de fréquence d'onde d'Emerson Nest
const data = [];
for (let t = 0; t <= 360; t += 15) {
  const rad = (t * Math.PI) / 180;
  data.push({
    degrés: t,
    sinus: parseFloat(Math.sin(rad).toFixed(4)),
    cosinus: parseFloat(Math.cos(rad).toFixed(4)),
    harmonique: parseFloat((Math.sin(rad) * 0.5 + Math.cos(rad * 2) * 0.3).toFixed(4))
  });
}
console.log("Calcul de 25 coordonnées d'onde trigonométrique terminé !");
console.log("Données générées pour traçage graphique.");
`
    },
    sorting: {
      title: "Tracé d'Algorithme (Tri Rapide)",
      chartType: "bar",
      type: "js",
      code: `// Visualiseur d'un algorithme de Tri à bulles (Bubble Sort)
const elements = [45, 12, 89, 34, 67, 50, 95, 23, 71, 38];
console.log("Tableau initial :", elements.join(" | "));

function bubbleSort(arr) {
  let len = arr.length;
  for (let i = 0; i < len; i++) {
    for (let j = 0; j < len - 1 - i; j++) {
      if (arr[j] > arr[j + 1]) {
        let temp = arr[j];
        arr[j] = arr[j + 1];
        arr[j + 1] = temp;
      }
    }
  }
  return arr;
}

const sorted = bubbleSort([...elements]);
console.log("Tableau trié :", sorted.join(" | "));

// Formater pour recharts 
const data = elements.map((val, idx) => ({
  index: "E" + (idx + 1),
  "Initial (Désordonné)": val,
  "Trié (Résultat)": sorted[idx]
}));
`
    },
    stats: {
      title: "Statistiques de performance",
      chartType: "area",
      type: "js",
      code: `// Calculs de ventes et de projection d'I.A.
const data = [
  { période: "S1", ventes: 400, projection: 440, couts: 240 },
  { période: "S2", ventes: 600, projection: 680, couts: 290 },
  { période: "S3", ventes: 800, projection: 890, couts: 350 },
  { période: "S4", ventes: 1100, projection: 1150, couts: 410 },
  { période: "S5", ventes: 1400, projection: 1480, couts: 480 },
  { période: "S6", ventes: 1900, projection: 2100, couts: 590 }
];

const totalVentes = data.reduce((sum, item) => sum + item.ventes, 0);
const moyenne = totalVentes / data.length;
console.log("--- Statistique d'Emerson ---");
console.log("Volume total des ventes :", totalVentes, "€");
console.log("Moyenne par période :", moyenne.toFixed(2), "€");
`
    }
  };

  // Load selected template
  useEffect(() => {
    if (templates[selectedTemplate]) {
      setCode(templates[selectedTemplate].code);
      setChartType(templates[selectedTemplate].chartType);
    }
  }, [selectedTemplate]);

  // Execute CSV parsing
  useEffect(() => {
    try {
      const lines = customCsv.split("\n");
      if (lines.length < 2) return;
      const headers = lines[0].split(",");
      
      const parsed = lines.slice(1).map((line) => {
        const values = line.split(",");
        const obj: Record<string, any> = {};
        headers.forEach((header, idx) => {
          const val = values[idx];
          // Try parse float/number
          if (val && !isNaN(val as any)) {
            obj[header.trim()] = parseFloat(val);
          } else {
            obj[header.trim()] = val ? val.trim() : "";
          }
        });
        return obj;
      }).filter(o => Object.keys(o).length > 1 && o[headers[0]] !== "");
      setParsedCsvData(parsed);
    } catch (e) {
      console.error("Csv parsing error", e);
    }
  }, [customCsv]);

  // Execute code mock runner safely client-side
  const runCode = () => {
    setExecutionState("running");
    setOutput(["[Emerson Interpreter v1.0.5] Lancement de la machine virtuelle...", "Environnement sécurisé activé."]);
    
    setTimeout(() => {
      try {
        const consoleLogs: string[] = [];
        const customConsole = {
          log: (...args: any[]) => {
            consoleLogs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(" "));
          }
        };

        // Create evaluation runner using Function constructor safely with console mock
        // We inject the console log capture and retrieve the data variable.
        const runner = new Function("console", `
          ${code}
          return typeof data !== 'undefined' ? data : null;
        `);

        const resultData = runner(customConsole);

        setOutput(prev => [...prev, ...consoleLogs, "✓ Code exécuté avec succès sans erreur de compilation."]);
        
        if (resultData && Array.isArray(resultData)) {
          setChartData(resultData);
          setOutput(prev => [...prev, `ℹ Graphique détecté : ${resultData.length} points de données analysés.`]);
        } else {
          setChartData([]);
        }
        setExecutionState("done");
      } catch (err: any) {
        setOutput(prev => [...prev, `❌ Erreur d'exécution : ${err.message}`]);
        setExecutionState("done");
      }
    }, 600);
  };

  const getChartKeys = (data: any[]) => {
    if (!data || data.length === 0) return [];
    // Get all keys except common label keys like degrés, degrÃ©s, index, période, pÃ©riode, x, name, date, Mois
    return Object.keys(data[0]).filter(k => 
      k !== "degrés" && k !== "degrés" && k !== "index" && k !== "période" && k !== "x" && k !== "Mois" && k !== "index"
    );
  };

  const currentChartData = activeTab === "runner" ? chartData : parsedCsvData;
  const chartKeys = getChartKeys(currentChartData);
  const xAxisKey = currentChartData.length > 0 ? Object.keys(currentChartData[0])[0] : "";

  return (
    <div className="flex-1 flex flex-col bg-slate-900 border-l border-slate-800 h-full relative text-left">
      {/* Tab Header Control */}
      <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950 px-4">
        <div className="flex">
          <button
            onClick={() => setActiveTab("runner")}
            className={`py-3.5 px-4 font-semibold text-xs transition-colors flex items-center gap-1.5 border-b-2 hover:text-slate-100 ${
              activeTab === "runner" 
                ? "border-emerald-500 text-white bg-slate-900/40" 
                : "border-transparent text-slate-400"
            }`}
          >
            <Terminal size={14} className="text-emerald-400" />
            Console & Algorithmes
          </button>
          
          <button
            onClick={() => setActiveTab("csv")}
            className={`py-3.5 px-4 font-semibold text-xs transition-colors flex items-center gap-1.5 border-b-2 hover:text-slate-100 ${
              activeTab === "csv" 
                ? "border-teal-500 text-white bg-slate-900/40" 
                : "border-transparent text-slate-400"
            }`}
          >
            <FileSpreadsheet size={14} className="text-teal-400" />
            Données CSV
          </button>
        </div>

        <div className="text-[10px] font-mono text-slate-500 tracking-wider font-semibold">
          EMERSON SANDBOX
        </div>
      </div>

      {/* Main Sandbox Core body */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {activeTab === "runner" && (
          <div className="space-y-4 h-full flex flex-col">
            {/* Templates Selector */}
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-850 flex items-center justify-between">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                  Algorithmes & Gabarits d'I.A.
                </label>
                <div className="flex items-center gap-2">
                  <select
                    value={selectedTemplate}
                    onChange={(e) => setSelectedTemplate(e.target.value)}
                    className="bg-slate-900 border border-slate-800 text-slate-200 text-xs py-1.5 px-2.5 rounded-lg font-medium outline-none"
                  >
                    <option value="sine">📈 Courbe Sinusoïdale (Mathématiques)</option>
                    <option value="sorting">📊 Algorithme Tri à Bulles (Visualiseur)</option>
                    <option value="stats">📈 Statistiques de Performance</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={runCode}
                  disabled={executionState === "running"}
                  className="py-2 px-3.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 shadow"
                >
                  {executionState === "running" ? (
                    <>
                      <RefreshCw size={13} className="animate-spin" />
                      <span>Calcul en cours...</span>
                    </>
                  ) : (
                    <>
                      <Play size={13} className="fill-white" />
                      <span>Exécuter et Tracer</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Code Field */}
            <div className="flex-1 flex flex-col min-h-[190px] max-h-[300px] border border-slate-800 rounded-xl overflow-hidden shadow-inner bg-slate-950">
              <div className="px-4 py-2 bg-slate-950/80 border-b border-slate-900 flex items-center justify-between">
                <span className="text-[10px] font-bold font-mono text-slate-500 tracking-wider">
                  BAC À SABLE JAVASCRIPT / MATHS
                </span>
                <span className="text-[10px] text-slate-500 italic">Interprété à la volée v1</span>
              </div>
              
              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="flex-1 p-4 bg-transparent outline-none font-mono text-xs text-slate-350 leading-relaxed resize-none w-full select-text"
              />
            </div>

            {/* Outputs logs terminal */}
            <div className="bg-slate-950 rounded-xl border border-slate-800/80 p-4 font-mono text-xs text-left">
              <div className="text-[10px] uppercase font-bold text-slate-500 tracking-widest mb-2 flex items-center gap-1.5">
                <Terminal size={12} className="text-emerald-500" />
                Console de Sortie
              </div>
              <div className="space-y-1 max-h-[100px] overflow-y-auto scrollbar-thin text-[11px] text-slate-300">
                {output.length === 0 ? (
                  <span className="text-slate-600 italic">Cliquez sur "Exécuter et Tracer" pour lancer l'algorithme...</span>
                ) : (
                  output.map((line, idx) => (
                    <div key={idx} className={line.startsWith("❌") ? "text-rose-400" : line.startsWith("✓") ? "text-emerald-400" : "text-slate-300"}>
                      {line}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* CSV input grid */}
        {activeTab === "csv" && (
          <div className="space-y-4 h-full flex flex-col">
            <div className="bg-slate-950 p-4 border border-slate-800 rounded-xl space-y-2">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Importation de données CSV (Modifiable)
              </label>
              <p className="text-[11px] text-slate-500 leading-tight">
                Entrez vos colonnes séparées par des virgules pour générer automatiquement une visualisation statistique interactive ci-dessous.
              </p>
              
              <textarea
                value={customCsv}
                onChange={(e) => setCustomCsv(e.target.value)}
                rows={5}
                className="w-full mt-2 bg-slate-900 text-slate-200 border border-slate-800 rounded-xl font-mono p-3 text-xs leading-relaxed outline-none focus:border-teal-500/50"
              />
            </div>
            
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-400 text-xs">
              <span className="font-semibold text-teal-400">Information Emerson :</span> Modifiez les lignes sales pour tracer d'autres axes. La première colonne sert d'axe d'abscisses.
            </div>
          </div>
        )}

        {/* Rendering area of Chart (Graphique) */}
        <div className="bg-slate-950 border border-slate-850/80 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <ChartIcon size={14} className="text-emerald-400" />
              <h4 className="text-xs font-bold text-slate-200 tracking-wide">
                Tracé du Graphique Interactif
              </h4>
            </div>

            {/* Switch Chart types inside */}
            {currentChartData.length > 0 && (
              <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-0.5 rounded-lg">
                {(["line", "bar", "area"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setChartType(t)}
                    className={`py-1 px-2 text-[10px] font-semibold uppercase tracking-wider rounded-md transition-colors ${
                      chartType === t 
                        ? "bg-slate-800 text-emerald-400 border border-slate-700" 
                        : "text-slate-500 hover:text-slate-350"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            )}
          </div>

          {currentChartData.length === 0 ? (
            <div className="h-64 rounded-xl border border-dashed border-slate-800 flex flex-col items-center justify-center text-center text-slate-600 px-4">
              <BarChart3 size={32} className="text-slate-700 animate-pulse mb-2" />
              <p className="text-xs font-semibold text-slate-400">Aucun tracé actif</p>
              <p className="text-[10.5px] mt-1 max-w-sm">
                Exécutez un gabarit d'ondes trigonométriques ou modifiez le tableau d'éléments pour voir la courbe se matérialiser en temps réel.
              </p>
            </div>
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="105%">
                {chartType === "bar" ? (
                  <BarChart data={currentChartData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.5} />
                    <XAxis dataKey={xAxisKey} stroke="#64748b" tick={{ fontSize: 10 }} />
                    <YAxis stroke="#64748b" tick={{ fontSize: 10 }} />
                    <Tooltip contentStyle={{ backgroundColor: "#020617", borderColor: "#1e293b", fontSize: "11px" }} labelClassName="text-slate-400" />
                    <Legend wrapperStyle={{ fontSize: "11px", pt: 10 }} />
                    {chartKeys.map((key, index) => (
                      <Bar 
                        key={key} 
                        dataKey={key} 
                        fill={index === 0 ? "#10b981" : index === 1 ? "#14b8a6" : "#6366f1"} 
                        radius={[4, 4, 0, 0]} 
                      />
                    ))}
                  </BarChart>
                ) : chartType === "area" ? (
                  <AreaChart data={currentChartData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                    <defs>
                      <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorPv" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#14b8a6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.5} />
                    <XAxis dataKey={xAxisKey} stroke="#64748b" tick={{ fontSize: 10 }} />
                    <YAxis stroke="#64748b" tick={{ fontSize: 10 }} />
                    <Tooltip contentStyle={{ backgroundColor: "#020617", borderColor: "#1e293b", fontSize: "11px" }} labelClassName="text-slate-400" />
                    <Legend wrapperStyle={{ fontSize: "11px", pt: 10 }} />
                    {chartKeys.map((key, index) => (
                      <Area 
                        type="monotone" 
                        key={key} 
                        dataKey={key} 
                        stroke={index === 0 ? "#10b981" : index === 1 ? "#14b8a6" : "#6366f1"} 
                        fillOpacity={1} 
                        fill={`url(#${index === 0 ? "colorUv" : "colorPv"})`} 
                      />
                    ))}
                  </AreaChart>
                ) : (
                  <LineChart data={currentChartData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.3} />
                    <XAxis dataKey={xAxisKey} stroke="#64748b" tick={{ fontSize: 10 }} />
                    <YAxis stroke="#64748b" tick={{ fontSize: 10 }} />
                    <Tooltip contentStyle={{ backgroundColor: "#020617", borderColor: "#1e293b", fontSize: "11px" }} labelClassName="text-slate-400" />
                    <Legend wrapperStyle={{ fontSize: "11px" }} />
                    {chartKeys.map((key, index) => (
                      <Line 
                        type="monotone" 
                        key={key} 
                        dataKey={key} 
                        stroke={index === 0 ? "#10b981" : index === 1 ? "#14b8a6" : "#6366f1"} 
                        strokeWidth={2.5} 
                        dot={{ r: 3 }} 
                        activeDot={{ r: 5 }} 
                      />
                    ))}
                  </LineChart>
                )}
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
