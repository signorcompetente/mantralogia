import React, { useState, useEffect } from 'react';
import { Trash2, ChevronDown, ChevronUp } from 'lucide-react';

export default function FantacalcioSwitch() {
  const [vistaCorrente, setVistaCorrente] = useState('builder');

  return (
    <div className="min-h-screen relative">
      {/* BOTTONE SWITCH FISSO */}
      <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50">
        <button
          onClick={() => setVistaCorrente(vistaCorrente === 'builder' ? 'asta' : 'builder')}
          className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl font-black text-base shadow-2xl hover:scale-105 transition-all duration-200 flex items-center gap-2"
        >
          <span className="text-2xl">🔄</span>
          <span>{vistaCorrente === 'builder' ? 'ASTA RIPARAZIONE' : 'MANTRA BUILDER'}</span>
        </button>
      </div>

      {/* CONTENUTO */}
      <div className="pt-20">
        {vistaCorrente === 'builder' ? <FantacalcioBuilder /> : <MantraRiparazione />}
      </div>
    </div>
  );
}

function FantacalcioBuilder() {
  const [titolari, setTitolari] = useState([]);
  const [panchina, setPanchina] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [database, setDatabase] = useState({});
  const [inputNome, setInputNome] = useState("");
  const [inputRuolo, setInputRuolo] = useState("");
  const [autocomplete, setAutocomplete] = useState([]);
  const [hoverModulo, setHoverModulo] = useState(null);
  const [showDbModal, setShowDbModal] = useState(false);
  const [showWishModal, setShowWishModal] = useState(false);
  const [importText, setImportText] = useState("");
  const [importStatus, setImportStatus] = useState("");
  const [budgetTotale, setBudgetTotale] = useState(500);
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [budgetTrackerOpen, setBudgetTrackerOpen] = useState(false);
  const [prezziReali, setPrezziReali] = useState({});
  const [showSpesaPopup, setShowSpesaPopup] = useState(false);
  const [showWishlistPopup, setShowWishlistPopup] = useState(false);
  const [autocompleteIndex, setAutocompleteIndex] = useState(0);
  const [wishlistFiltro, setWishlistFiltro] = useState("tutti");
  const [wishlistOrdinamento, setWishlistOrdinamento] = useState("priorita");
  const [inputBoxHeight, setInputBoxHeight] = useState(300);

  const moduli = {
    "343": [["DC"], ["DC"], ["DC","B"], ["E"], ["M","C"], ["C"], ["E"], ["W","A"], ["W","A"], ["A","PC"]],
    "3412": [["DC"], ["DC"], ["DC","B"], ["M","C"], ["C"], ["E"], ["E"], ["T"], ["A","PC"], ["A","PC"]],
    "3421": [["DC"], ["DC"], ["DC","B"], ["M"], ["M","C"], ["E"], ["E","W"], ["T"], ["T","A"], ["A","PC"]],
    "352": [["DC"], ["DC"], ["DC","B"], ["M"], ["M","C"], ["C"], ["E"], ["E","W"], ["A","PC"], ["A","PC"]],
    "3511": [["DC"], ["DC"], ["DC","B"], ["M"], ["M"], ["C"], ["E","W"], ["T","A"], ["E","W"], ["A","PC"]],
    "433": [["DD"], ["DC"], ["DC"], ["DS"], ["M","C"], ["M"], ["C"], ["W","A"], ["A","PC"], ["W","A"]],
    "4312": [["DD"], ["DC"], ["DC"], ["DS"], ["M","C"], ["M"], ["C"], ["T"], ["T","A","PC"], ["A","PC"]],
    "442": [["DD"], ["DC"], ["DC"], ["DS"], ["M","C"], ["C"], ["E"], ["E","W"], ["A","PC"], ["A","PC"]],
    "4141": [["DD"], ["DC"], ["DC"], ["DS"], ["M"], ["C","T"], ["E","W"], ["T"], ["W"], ["A","PC"]],
    "4411": [["DD"], ["DC"], ["DC"], ["DS"], ["M"], ["C"], ["E","W"], ["E","W"], ["T","A"], ["A","PC"]],
    "4231": [["DD"], ["DC"], ["DC"], ["DS"], ["M"], ["M","C"], ["W","T"], ["T"], ["W","A"], ["A","PC"]]
  };

  const vincolanti = { 
    "T": 3, "W": 2.5, "M": 2.2, "DS": 2, "DD": 2, 
    "E": 1.8, "A": 1.5, "C": 1.3, "PC": 1, "DC": 0.8, "B": 0.5 
  };

  const gerarchiaRuoli = ["DC", "B", "DD", "DS", "E", "M", "C", "W", "T", "A", "PC"];

  // localStorage
  useEffect(() => {
    const saved = localStorage.getItem('fantacalcio-v6');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        setTitolari(data.titolari || []);
        setPanchina(data.panchina || []);
        setWishlist(data.wishlist || []);
        setDatabase(data.database || {});
        setBudgetTotale(data.budgetTotale || 500);
        setBudgetTrackerOpen(data.budgetTrackerOpen || false);
        setPrezziReali(data.prezziReali || {});
      } catch (e) {}
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('fantacalcio-v6', JSON.stringify({
      titolari, panchina, wishlist, database, budgetTotale, budgetTrackerOpen, prezziReali
    }));
  }, [titolari, panchina, wishlist, database, budgetTotale, budgetTrackerOpen, prezziReali]);

  // Calcola altezza box input
  useEffect(() => {
    const box = document.getElementById('input-box');
    if (box) {
      setInputBoxHeight(box.offsetHeight);
    }
  }, [database]);

  // Autocomplete
  useEffect(() => {
    if (inputNome.length >= 2 && Object.keys(database).length > 0) {
      const matches = Object.keys(database)
        .filter(nome => nome.toLowerCase().includes(inputNome.toLowerCase()))
        .slice(0, 5);
      setAutocomplete(matches);
      setAutocompleteIndex(0);
    } else {
      setAutocomplete([]);
      setAutocompleteIndex(0);
    }
  }, [inputNome, database]);

  const getRuoloFromDB = (nome) => {
    const entry = database[nome];
    if (!entry) return '';
    return typeof entry === 'string' ? entry : entry.ruolo;
  };

  const aggiungiGiocatore = (nome, ruolo, lista) => {
    nome = nome ? nome.trim() : '';
    ruolo = ruolo ? ruolo.trim() : '';
    
    if (nome && database[nome]) {
      const dbEntry = database[nome];
      ruolo = typeof dbEntry === 'string' ? dbEntry : dbEntry.ruolo;
    }
    if (!nome && ruolo) nome = ruolo.toUpperCase();
    
    ruolo = ruolo.toUpperCase().trim();
    if (!ruolo) return;
    
    const giocatore = { nome, ruolo };
    
    if (lista === "titolari") setTitolari([...titolari, giocatore]);
    else if (lista === "panchina") setPanchina([...panchina, giocatore]);
    else if (lista === "wishlist") {
      if (!wishlist.find(w => w.nome === nome)) {
        setWishlist([...wishlist, giocatore]);
      }
    }
  };

  const rimuoviGiocatore = (index, lista) => {
    if (lista === "titolari") setTitolari(titolari.filter((_, i) => i !== index));
    else if (lista === "panchina") setPanchina(panchina.filter((_, i) => i !== index));
    else if (lista === "wishlist") setWishlist(wishlist.filter((_, i) => i !== index));
  };

  const spostaGiocatore = (index, da, verso) => {
    let giocatore;
    if (da === "titolari") {
      giocatore = titolari[index];
      setTitolari(titolari.filter((_, i) => i !== index));
    } else {
      giocatore = panchina[index];
      setPanchina(panchina.filter((_, i) => i !== index));
    }
    
    if (verso === "titolari") setTitolari([...titolari, giocatore]);
    else setPanchina([...panchina, giocatore]);
  };

  const normalizzaRuolo = (ruolo) => {
    if (!ruolo) return [];
    ruolo = ruolo.toUpperCase().trim().replace(/\s/g, '');
    if (ruolo.includes('/')) return ruolo.split('/').filter(r => r.length > 0);
    return [ruolo];
  };

  const getPrioritaRuolo = (ruolo) => {
    const idx = gerarchiaRuoli.indexOf(ruolo);
    return idx === -1 ? 999 : idx;
  };

  const calcolaSlotCoperti = (slots, giocatori) => {
    const slotsCoperti = Array(slots.length).fill(false);
    const giocatoriNorm = giocatori.map(g => normalizzaRuolo(g.ruolo));
    const usati = Array(giocatori.length).fill(false);

    slots.forEach((slot, i) => {
      let bestIdx = -1;
      let bestPrio = 999;
      for (let g = 0; g < giocatoriNorm.length; g++) {
        if (usati[g]) continue;
        const ruoli = giocatoriNorm[g];
        for (let r of ruoli) {
          if (slot.includes(r)) {
            const prio = getPrioritaRuolo(r);
            if (prio < bestPrio) {
              bestPrio = prio;
              bestIdx = g;
            }
          }
        }
      }
      if (bestIdx !== -1) {
        slotsCoperti[i] = true;
        usati[bestIdx] = true;
      }
    });
    return slotsCoperti;
  };

  const calcolaBonusConcentrazione = (giocatori, slots) => {
    const conteggio = {};
    giocatori.forEach(g => {
      normalizzaRuolo(g.ruolo).forEach(r => {
        conteggio[r] = (conteggio[r] || 0) + 1;
      });
    });
    let bonus = 0;
    Object.keys(conteggio).forEach(ruolo => {
      if (conteggio[ruolo] >= 2 && vincolanti[ruolo] >= 2) {
        const richiesti = slots.filter(s => s.includes(ruolo)).length;
        if (conteggio[ruolo] >= richiesti && richiesti >= 2) {
          bonus += vincolanti[ruolo] * conteggio[ruolo] * 0.3;
        }
      }
    });
    return bonus;
  };

  const calcolaRisultati = () => {
    return Object.keys(moduli).map(nome => {
      const slots = moduli[nome];
      const slotsTit = calcolaSlotCoperti(slots, titolari);
      const numTit = slotsTit.filter(Boolean).length;
      const percTit = (numTit / slots.length) * 100;

      let score = 0;
      slotsTit.forEach((coperto, i) => {
        if (coperto) {
          slots[i].forEach(r => {
            if (vincolanti[r]) score += vincolanti[r];
          });
        }
      });
      score += calcolaBonusConcentrazione(titolari, slots);

      const mancantiTit = [];
      slotsTit.forEach((coperto, i) => {
        if (!coperto) mancantiTit.push(slots[i].join("/"));
      });

      const tutti = [...titolari, ...panchina];
      const slotsTot = calcolaSlotCoperti(slots, tutti);
      const numTot = slotsTot.filter(Boolean).length;
      const percTot = (numTot / slots.length) * 100;

      const mancantiPan = [];
      slotsTot.forEach((coperto, i) => {
        if (!coperto) mancantiPan.push(slots[i].join("/"));
      });

      const percentMatch = percTit * 0.75 + percTot * 0.25;

      return {
        nome, percentMatch, score,
        slotsCopertiTitolari: slotsTit,
        mancantiTitolari: mancantiTit,
        mancantiPanchina: mancantiPan,
        slots
      };
    }).sort((a, b) => {
      if (Math.abs(a.percentMatch - b.percentMatch) > 5) return b.percentMatch - a.percentMatch;
      return b.score - a.score;
    });
  };

  const risultati = calcolaRisultati();
  const top3 = risultati.slice(0, 3);

  const getSuggerimento = () => {
    if (titolari.length === 0) return "Inizia ad aggiungere giocatori!";
    const top = risultati[0];
    if (top.mancantiTitolari.length === 0) return `✅ ${top.nome} completo!`;
    return `🎯 Per ${top.nome}: ${top.mancantiTitolari.join(", ")}`;
  };

  const getColoreBG = (p) => {
    if (p >= 90) return "bg-gradient-to-br from-green-50 to-emerald-100";
    if (p >= 70) return "bg-gradient-to-br from-yellow-50 to-amber-100";
    if (p >= 50) return "bg-gradient-to-br from-orange-50 to-red-100";
    return "bg-gradient-to-br from-red-50 to-pink-100";
  };

  const getColoreProgress = (p) => {
    if (p >= 90) return "bg-gradient-to-r from-green-500 to-emerald-500";
    if (p >= 70) return "bg-gradient-to-r from-yellow-500 to-amber-500";
    if (p >= 50) return "bg-gradient-to-r from-orange-500 to-red-500";
    return "bg-gradient-to-r from-red-500 to-pink-500";
  };

  const getBordo = (idx) => {
    if (idx === 0) return "border-4 border-green-500";
    if (idx === 1) return "border-4 border-blue-400";
    if (idx === 2) return "border-4 border-orange-400";
    return "border-2 border-gray-200";
  };

  const handleImportDatabase = () => {
    setImportStatus("⏳ Caricamento...");
    const lines = importText.split('\n');
    const newDb = {};
    let count = 0;

    for (let line of lines) {
      line = line.trim();
      if (!line) continue;
      if (line.toLowerCase().includes('nome') && line.toLowerCase().includes('ruolo')) continue;
      const parts = line.split('\t');
      if (parts.length >= 2) {
        const nome = parts[0].trim();
        let ruolo = parts[1].trim().toUpperCase().replace(/;/g, '/');
        const fmv = parts.length >= 3 ? parseInt(parts[2].trim()) : null;
        
        if (ruolo === 'POR' || ruolo === 'P') continue;
        
        if (nome && ruolo) {
          newDb[nome] = fmv ? { ruolo, fmv } : ruolo;
          count++;
        }
      }
    }
    if (count === 0) {
      setImportStatus("❌ Nessun giocatore trovato!");
      return;
    }
    setDatabase(newDb);
    setImportStatus(`✅ ${count} giocatori caricati!`);
  };

  const handleImportWishlist = () => {
    setImportStatus("⏳ Caricamento...");
    const lines = importText.split('\n');
    const newWish = [];
    let count = 0;

    for (let line of lines) {
      line = line.trim();
      if (!line) continue;
      if (line.toLowerCase().includes('nome') && line.toLowerCase().includes('ruolo')) continue;
      const parts = line.split('\t');
      if (parts.length >= 2) {
        const nome = parts[0].trim();
        let ruolo = parts[1].trim().toUpperCase().replace(/;/g, '/');
        if (ruolo === 'POR' || ruolo === 'P') continue;
        if (nome && ruolo && !wishlist.find(w => w.nome === nome)) {
          newWish.push({ nome, ruolo });
          count++;
        }
      }
    }
    if (count === 0) {
      setImportStatus("❌ Nessun giocatore trovato!");
      return;
    }
    setWishlist([...wishlist, ...newWish]);
    setImportStatus(`✅ ${count} giocatori aggiunti!`);
  };

  const calcolaStatoWishlist = (giocatore) => {
    const giaPreso = [...titolari, ...panchina].find(g => g.nome === giocatore.nome);
    if (giaPreso) return "preso";
    
    const ruoli = normalizzaRuolo(giocatore.ruolo);
    let priorita = 0;
    let compatibile = false;

    top3.forEach((mod, idx) => {
      const peso = idx === 0 ? 3 : idx === 1 ? 2 : 1;
      mod.mancantiTitolari.forEach(mancante => {
        const ruoliManc = mancante.split('/');
        ruoli.forEach(r => {
          if (ruoliManc.includes(r)) {
            priorita += peso * (vincolanti[r] || 1);
            compatibile = true;
          }
        });
      });
    });

    if (priorita >= 4) return "alta";
    if (compatibile) return "media";
    return "bassa";
  };

  const getIconaWish = (stato) => {
    if (stato === "preso") return { icon: "⭐", bg: "bg-blue-100" };
    if (stato === "alta") return { icon: "💚", bg: "bg-green-100" };
    if (stato === "media") return { icon: "❤️", bg: "bg-blue-100" };
    return { icon: "💔", bg: "bg-gray-100" };
  };

  const calcolaAnalisiReparto = () => {
    const giocatori = [...titolari, ...panchina];
    const reparti = { difesa: [], centro: [], attacco: [] };
    
    giocatori.forEach(g => {
      const ruolo = g.ruolo.toUpperCase().split('/')[0];
      if (['DC', 'DD', 'DS', 'B'].includes(ruolo)) reparti.difesa.push(g);
      else if (['E', 'M', 'C'].includes(ruolo)) reparti.centro.push(g);
      else if (['W', 'T', 'A', 'PC'].includes(ruolo)) reparti.attacco.push(g);
    });
    
    const calcolaSpesa = (lista) => lista.reduce((sum, g) => {
      const prezzo = prezziReali[g.nome] || getFMVScalato(getFMV(g.nome)) || 0;
      return sum + prezzo;
    }, 0);
    
    return {
      difesa: { count: reparti.difesa.length, spesa: calcolaSpesa(reparti.difesa) },
      centro: { count: reparti.centro.length, spesa: calcolaSpesa(reparti.centro) },
      attacco: { count: reparti.attacco.length, spesa: calcolaSpesa(reparti.attacco) }
    };
  };

  const getSuggerimentiAcquisto = () => {
    if (titolari.length === 0) return [];
    
    const suggerimenti = [];
    const ruoliMancanti = {};
    
    top3.forEach(mod => {
      mod.mancantiTitolari.forEach(mancante => {
        const ruoli = mancante.split('/');
        ruoli.forEach(r => {
          ruoliMancanti[r] = (ruoliMancanti[r] || 0) + 1;
        });
      });
    });
    
    Object.entries(ruoliMancanti)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .forEach(([ruolo, count]) => {
        const priorita = count >= 3 ? "🔥 URGENTE" : count >= 2 ? "⚠️ IMPORTANTE" : "💡 UTILE";
        suggerimenti.push({ ruolo, count, priorita });
      });
    
    return suggerimenti;
  };

  const getWishlistFiltrata = () => {
    let lista = [...wishlist];
    
    // Filtro
    if (wishlistFiltro === "alta") {
      lista = lista.filter(g => calcolaStatoWishlist(g) === "alta");
    } else if (wishlistFiltro === "media") {
      lista = lista.filter(g => calcolaStatoWishlist(g) === "media");
    } else if (wishlistFiltro === "nonPreso") {
      lista = lista.filter(g => calcolaStatoWishlist(g) !== "preso");
    }
    
    // Ordinamento
    if (wishlistOrdinamento === "priorita") {
      lista.sort((a, b) => {
        const priority = { alta: 3, media: 2, bassa: 1, preso: 0 };
        return priority[calcolaStatoWishlist(b)] - priority[calcolaStatoWishlist(a)];
      });
    } else if (wishlistOrdinamento === "prezzo") {
      lista.sort((a, b) => {
        const prezzoA = getFMVScalato(getFMV(a.nome)) || 0;
        const prezzoB = getFMVScalato(getFMV(b.nome)) || 0;
        return prezzoB - prezzoA;
      });
    } else if (wishlistOrdinamento === "alfabetico") {
      lista.sort((a, b) => a.nome.localeCompare(b.nome));
    }
    
    return lista;
  };

  const getFMV = (nomeGiocatore) => {
    const entry = database[nomeGiocatore];
    if (!entry) return null;
    if (typeof entry === 'string') return null;
    return entry.fmv;
  };

  const getFMVScalato = (fmv) => {
    if (!fmv) return null;
    return Math.round((fmv / 1000) * budgetTotale);
  };

  const calcolaBudgetStats = () => {
    const giocatoriAcquistati = [...titolari, ...panchina];
    
    const spesaReale = giocatoriAcquistati.reduce((sum, g) => {
      const prezzoReale = prezziReali[g.nome];
      if (prezzoReale) return sum + prezzoReale;
      
      const fmv = getFMV(g.nome);
      return sum + (getFMVScalato(fmv) || 0);
    }, 0);
    
    const giocatoriTotali = 25;
    const giocatoriMancanti = giocatoriTotali - giocatoriAcquistati.length;
    const budgetRimanente = budgetTotale - spesaReale;
    const budgetMedio = giocatoriMancanti > 0 ? budgetRimanente / giocatoriMancanti : 0;
    
    return {
      giocatoriAcquistati: giocatoriAcquistati.length,
      giocatoriMancanti,
      spesaReale,
      budgetRimanente,
      budgetMedio
    };
  };

  const getPlayerColor = (ruolo) => {
    const r = ruolo.toUpperCase().split('/')[0];
    if (r === "PC" || r === "A") return "bg-gradient-to-r from-red-500 to-rose-600 shadow-lg shadow-red-500/30";
    if (["DC", "DD", "DS", "B"].includes(r)) return "bg-gradient-to-r from-lime-500 to-green-600 shadow-lg shadow-lime-500/30";
    if (r === "E") return "bg-gradient-to-r from-green-600 to-emerald-700 shadow-lg shadow-green-600/30";
    if (["M", "C"].includes(r)) return "bg-gradient-to-r from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/30";
    if (["T", "W"].includes(r)) return "bg-gradient-to-r from-purple-500 to-indigo-600 shadow-lg shadow-purple-500/30";
    return "bg-gradient-to-r from-gray-500 to-slate-600 shadow-lg shadow-gray-500/30";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* HEADER */}
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl shadow-2xl p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-4xl font-black text-white tracking-tight">⚽ Mantra Builder</h1>
              <p className="text-slate-300 text-sm mt-1">Database: {Object.keys(database).length} giocatori | Wishlist: {wishlist.length}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button 
                onClick={() => setShowDbModal(true)}
                className="px-4 py-2 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 hover:scale-105 shadow-lg hover:shadow-purple-500/50 text-sm transition-all duration-200"
              >
                📊 Database
              </button>
              <button 
                onClick={() => {
                  setShowWishlistPopup(!showWishlistPopup);
                  if (!showWishlistPopup) {
                    setShowSpesaPopup(false);
                  }
                }}
                className="px-4 py-2 bg-amber-500 text-white rounded-xl font-bold hover:bg-amber-600 hover:scale-105 shadow-lg hover:shadow-amber-500/50 text-sm transition-all duration-200"
              >
                ⭐ Wishlist ({wishlist.length})
              </button>
              <button 
                onClick={() => {
                  setShowSpesaPopup(!showSpesaPopup);
                  if (!showSpesaPopup) {
                    setShowWishlistPopup(false);
                  }
                }}
                className="px-4 py-2 bg-emerald-500 text-white rounded-xl font-bold hover:bg-emerald-600 hover:scale-105 shadow-lg hover:shadow-emerald-500/50 text-sm transition-all duration-200"
              >
                💰 Spesa ({titolari.length + panchina.length})
              </button>
              <button 
                onClick={() => setShowBudgetModal(true)}
                className="px-4 py-2 bg-blue-500 text-white rounded-xl font-bold hover:bg-blue-600 hover:scale-105 shadow-lg hover:shadow-blue-500/50 text-sm transition-all duration-200"
              >
                ⚙️ Budget ({budgetTotale})
              </button>
              <button 
                onClick={() => {
                  if (confirm("Reset rosa?")) {
                    setTitolari([]);
                    setPanchina([]);
                  }
                }}
                className="px-4 py-2 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 hover:scale-105 shadow-lg hover:shadow-red-500/50 text-sm transition-all duration-200"
              >
                🗑️ Reset
              </button>
            </div>
          </div>
        </div>

        {/* SUGGERIMENTO */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl shadow-xl p-5 relative overflow-hidden">
          <div className="absolute inset-0 bg-white opacity-10 bg-[radial-gradient(circle_at_50%_120%,rgba(255,255,255,0.2),transparent)]"></div>
          <p className="font-bold text-lg relative z-10">{getSuggerimento()}</p>
        </div>

        {/* BUDGET TRACKER - COLLAPSABILE CON ANALISI */}
        {budgetTrackerOpen && (() => {
          const stats = calcolaBudgetStats();
          const analisi = calcolaAnalisiReparto();
          const suggerimenti = getSuggerimentiAcquisto();
          
          return (
            <div className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-2xl shadow-xl p-4">
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-lg">💰 Budget Tracker</p>
                    <button 
                      onClick={() => setBudgetTrackerOpen(false)}
                      className="text-xs bg-white bg-opacity-20 hover:bg-opacity-30 px-2 py-1 rounded transition"
                    >
                      ✕ Chiudi
                    </button>
                  </div>
                  <p className="text-sm opacity-90 mt-1">
                    Giocatori: {stats.giocatoriAcquistati}/25 | 
                    Spesa totale: ~{Math.round(stats.spesaReale)} crediti
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-black">{Math.round(stats.budgetMedio)}</p>
                  <p className="text-xs opacity-90">cr/giocatore medio</p>
                </div>
              </div>
              
              <div className="text-xs bg-white bg-opacity-20 rounded px-3 py-2 mb-3">
                📊 Budget rimanente: ~{Math.round(stats.budgetRimanente)} crediti per {stats.giocatoriMancanti} giocatori
              </div>

              {/* ANALISI REPARTO */}
              {titolari.length + panchina.length > 0 && (
                <div className="bg-white bg-opacity-20 rounded-lg p-3 mb-3">
                  <p className="text-sm font-bold mb-2">📊 Analisi per Reparto</p>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-white bg-opacity-30 rounded p-2">
                      <p className="text-xs opacity-90">🛡️ DIFESA</p>
                      <p className="text-lg font-black">{analisi.difesa.count}</p>
                      <p className="text-xs opacity-80">~{Math.round(analisi.difesa.spesa)} cr</p>
                    </div>
                    <div className="bg-white bg-opacity-30 rounded p-2">
                      <p className="text-xs opacity-90">⚙️ CENTROCAMPO</p>
                      <p className="text-lg font-black">{analisi.centro.count}</p>
                      <p className="text-xs opacity-80">~{Math.round(analisi.centro.spesa)} cr</p>
                    </div>
                    <div className="bg-white bg-opacity-30 rounded p-2">
                      <p className="text-xs opacity-90">⚡ ATTACCO</p>
                      <p className="text-lg font-black">{analisi.attacco.count}</p>
                      <p className="text-xs opacity-80">~{Math.round(analisi.attacco.spesa)} cr</p>
                    </div>
                  </div>
                </div>
              )}

              {/* SUGGERIMENTI ACQUISTO */}
              {suggerimenti.length > 0 && (
                <div className="bg-white bg-opacity-20 rounded-lg p-3">
                  <p className="text-sm font-bold mb-2">💡 Priorità Acquisti</p>
                  <div className="space-y-1">
                    {suggerimenti.map((s, i) => (
                      <div key={i} className="bg-white bg-opacity-30 rounded px-2 py-1 text-xs">
                        <span className="font-bold">{s.priorita}</span> - Cerca <strong>{s.ruolo}</strong> (serve in {s.count} moduli top3)
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })()}
        
        {/* PULSANTE APRI BUDGET TRACKER */}
        {!budgetTrackerOpen && (
          <button 
            onClick={() => setBudgetTrackerOpen(true)}
            className="w-full bg-green-100 hover:bg-green-200 text-green-800 rounded-xl p-3 font-semibold transition shadow"
          >
            💰 Mostra Budget Tracker & Analisi
          </button>
        )}

        {/* INPUT + POPUP LATERALE */}
        <div className="grid grid-cols-2 gap-6 items-start">
          <div id="input-box" className="bg-white rounded-2xl shadow-xl p-6">
            <h2 className="text-xl font-bold text-slate-800 mb-4">➕ Aggiungi Giocatore</h2>
            
            {/* CAMPO RUOLO */}
            <div className="mb-4">
              <label className="block text-sm font-bold text-slate-700 mb-2">⚽ Per Ruolo</label>
              <input 
                type="text" 
                className="w-full border-2 border-blue-300 p-3 rounded-lg focus:border-blue-500 focus:outline-none transition-all"
                placeholder="DC, M/C, W/A..."
                value={inputRuolo}
                onChange={(e) => setInputRuolo(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && inputRuolo) {
                    aggiungiGiocatore("", inputRuolo, "titolari");
                    setInputRuolo("");
                  }
                }}
              />
              <p className="text-xs text-slate-500 mt-1">Premi Enter → Titolari</p>
            </div>

            {/* CAMPO NOME CON NAVIGAZIONE */}
            <div className="relative">
              <label className="block text-sm font-bold text-slate-700 mb-2">📝 Per Nome</label>
              <input 
                type="text" 
                className="w-full border-2 border-purple-300 p-3 rounded-lg focus:border-purple-500 focus:outline-none transition-all"
                placeholder="Cerca giocatore..."
                value={inputNome}
                onChange={(e) => setInputNome(e.target.value)}
                onKeyDown={(e) => {
                  if (autocomplete.length === 0) return;
                  
                  if (e.key === "ArrowDown") {
                    e.preventDefault();
                    setAutocompleteIndex(Math.min(autocompleteIndex + 1, autocomplete.length - 1));
                  } else if (e.key === "ArrowUp") {
                    e.preventDefault();
                    setAutocompleteIndex(Math.max(autocompleteIndex - 1, 0));
                  } else if (e.key === "Enter") {
                    e.preventDefault();
                    const nome = autocomplete[autocompleteIndex];
                    aggiungiGiocatore(nome, getRuoloFromDB(nome), "titolari");
                    setInputNome("");
                    setAutocomplete([]);
                  }
                }}
                disabled={Object.keys(database).length === 0}
              />
              
              {autocomplete.length > 0 && (
                <div className="absolute top-full left-0 right-0 bg-white border-2 border-purple-500 rounded-lg mt-1 shadow-2xl z-30 max-h-80 overflow-y-auto">
                  {autocomplete.map((nome, idx) => {
                    const fmv = getFMV(nome);
                    const fmvScalato = getFMVScalato(fmv);
                    const isSelected = idx === autocompleteIndex;
                    return (
                      <div 
                        key={idx} 
                        className={`p-3 border-b flex justify-between items-center ${isSelected ? 'bg-purple-100' : 'hover:bg-purple-50'}`}
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold">{nome}</span>
                            <span className="text-sm text-slate-500">({getRuoloFromDB(nome)})</span>
                            {fmvScalato && (
                              <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-semibold">
                                ~{fmvScalato} cr
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              aggiungiGiocatore(nome, getRuoloFromDB(nome), "titolari");
                              setInputNome("");
                              setAutocomplete([]);
                            }}
                            className="px-3 py-1 bg-blue-500 text-white rounded-lg font-bold hover:bg-blue-600 text-sm"
                          >
                            👤 Titolari
                          </button>
                          <button
                            onClick={() => {
                              aggiungiGiocatore(nome, getRuoloFromDB(nome), "panchina");
                              setInputNome("");
                              setAutocomplete([]);
                            }}
                            className="px-3 py-1 bg-green-500 text-white rounded-lg font-bold hover:bg-green-600 text-sm"
                          >
                            🪑 Panchina
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              <p className="text-xs text-slate-500 mt-1">
                {Object.keys(database).length === 0 ? "Carica database" : "↑↓ Naviga | Enter → Titolari"}
              </p>
            </div>
          </div>

          {/* POPUP WISHLIST */}
          {showWishlistPopup && (
            <div className="bg-amber-50 border-2 border-amber-300 rounded-xl shadow-lg p-4 flex flex-col overflow-hidden" style={{height: `${inputBoxHeight}px`}}>
              <div className="flex justify-between items-center mb-3 pb-2 border-b-2 border-amber-300 flex-shrink-0">
                <h3 className="text-lg font-bold text-slate-800">📌 Wishlist ({wishlist.length})</h3>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setShowWishModal(true)}
                    className="px-3 py-1 bg-purple-500 text-white rounded-lg text-xs font-semibold hover:bg-purple-600"
                  >
                    📋 Importa
                  </button>
                  <button 
                    onClick={() => setShowWishlistPopup(false)}
                    className="px-2 py-1 bg-slate-600 text-white rounded-lg text-sm font-bold hover:bg-slate-700"
                  >
                    ✕
                  </button>
                </div>
              </div>
              
              {/* FILTRI E ORDINAMENTO */}
              <div className="flex gap-2 mb-2 flex-shrink-0">
                <select 
                  value={wishlistFiltro}
                  onChange={(e) => setWishlistFiltro(e.target.value)}
                  className="text-xs border border-amber-400 rounded px-2 py-1 bg-white"
                >
                  <option value="tutti">Tutti</option>
                  <option value="alta">💚 Alta priorità</option>
                  <option value="media">❤️ Media priorità</option>
                  <option value="nonPreso">Non presi</option>
                </select>
                <select 
                  value={wishlistOrdinamento}
                  onChange={(e) => setWishlistOrdinamento(e.target.value)}
                  className="text-xs border border-amber-400 rounded px-2 py-1 bg-white"
                >
                  <option value="priorita">Per priorità</option>
                  <option value="prezzo">Per prezzo</option>
                  <option value="alfabetico">Alfabetico</option>
                </select>
              </div>
              
              <div className="overflow-y-auto pr-2 flex-1 min-h-0">
                {getWishlistFiltrata().length === 0 ? (
                  <p className="text-slate-400 text-center py-8">Nessun risultato</p>
                ) : (
                  <>
                    <div className="text-xs text-slate-600 mb-2 p-2 bg-white rounded sticky top-0 z-10">
                      <p><strong>Legenda:</strong> 💚 Priorità | ❤️ OK | 💔 Non utile | ⭐ Già preso</p>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {getWishlistFiltrata().map((g, i) => {
                        const stato = calcolaStatoWishlist(g);
                        const info = getIconaWish(stato);
                        const fmv = getFMV(g.nome);
                        const fmvScalato = getFMVScalato(fmv);
                        const originalIndex = wishlist.findIndex(w => w.nome === g.nome);
                        return (
                          <div key={i} className="bg-slate-700 text-white px-2 py-1 rounded-lg text-xs inline-flex items-center gap-2 shadow-sm hover:shadow-md transition">
                            <span className="text-base">{info.icon}</span>
                            <span className="font-semibold">{g.nome}</span>
                            <span className="opacity-75">({g.ruolo})</span>
                            {fmvScalato && (
                              <span className="text-xs bg-slate-600 px-1 rounded">~{fmvScalato}</span>
                            )}
                            <button 
                              onClick={() => rimuoviGiocatore(originalIndex, "wishlist")}
                              className="hover:bg-white hover:bg-opacity-20 rounded px-1 ml-auto"
                            >
                              ✕
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* POPUP SPESA */}
          {showSpesaPopup && (
            <div className="bg-green-50 border-2 border-green-300 rounded-xl shadow-lg p-4 flex flex-col overflow-hidden" style={{height: `${inputBoxHeight}px`}}>
              <div className="flex justify-between items-center mb-3 pb-2 border-b-2 border-green-300 flex-shrink-0">
                <h3 className="text-lg font-bold text-slate-800">💰 Spesa Reale ({titolari.length + panchina.length})</h3>
                <button 
                  onClick={() => setShowSpesaPopup(false)}
                  className="px-2 py-1 bg-slate-600 text-white rounded-lg text-sm font-bold hover:bg-slate-700"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-2 overflow-y-auto pr-2 flex-1 min-h-0">
                {titolari.length + panchina.length === 0 ? (
                  <p className="text-slate-400 text-center py-8">Nessun giocatore acquistato</p>
                ) : (
                  <>
                    {[...titolari, ...panchina].map((g, i) => {
                      const fmv = getFMV(g.nome);
                      const fmvScalato = getFMVScalato(fmv);
                      const prezzoReale = prezziReali[g.nome];
                      return (
                        <div key={i} className="bg-white border border-green-200 rounded-lg p-2 flex items-center gap-2">
                          <div className="flex-1">
                            <p className="font-bold text-sm">{g.nome}</p>
                            <p className="text-xs text-slate-500">({g.ruolo}) {fmvScalato && `FMV ~${fmvScalato} cr`}</p>
                          </div>
                          <input 
                            type="number"
                            min="1"
                            step="1"
                            className="w-24 border-2 border-green-300 p-2 rounded text-sm font-bold text-center focus:border-green-500 focus:outline-none"
                            placeholder="Pagato"
                            value={prezzoReale || ""}
                            onChange={(e) => {
                              const val = parseInt(e.target.value);
                              if (val && val > 0) {
                                setPrezziReali({...prezziReali, [g.nome]: val});
                              } else if (e.target.value === "") {
                                const newPrezzi = {...prezziReali};
                                delete newPrezzi[g.nome];
                                setPrezziReali(newPrezzi);
                              }
                            }}
                          />
                          <span className="text-xs text-slate-600 font-semibold">cr</span>
                        </div>
                      );
                    })}
                  </>
                )}
              </div>
            </div>
          )}

          {/* PLACEHOLDER SE NESSUN POPUP */}
          {!showWishlistPopup && !showSpesaPopup && (
            <div className="flex items-center justify-center" style={{height: `${inputBoxHeight}px`}}>
              <p className="text-slate-400 text-center">
                Clicca ⭐ Wishlist o 💰 Spesa<br/>per aprire i pannelli
              </p>
            </div>
          )}
        </div>

        {/* TITOLARI */}
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <h3 className="text-xl font-bold mb-3">👤 Titolari ({titolari.length}/11)</h3>
          <div className="min-h-24 p-4 border-2 border-dashed border-slate-300 rounded-lg bg-slate-50">
            {titolari.length === 0 ? (
              <p className="text-slate-400 text-center py-6">Nessun titolare</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {titolari.map((g, i) => (
                  <div key={i} className={`${getPlayerColor(g.ruolo)} text-white px-3 py-2 rounded-lg font-semibold text-sm flex items-center gap-2`}>
                    <div>
                      <div className="text-xs opacity-90">{g.nome}</div>
                      <div className="font-bold">{g.ruolo}</div>
                    </div>
                    <button onClick={() => spostaGiocatore(i, "titolari", "panchina")} className="hover:bg-white hover:bg-opacity-30 rounded px-2 py-1">⬇️</button>
                    <button onClick={() => rimuoviGiocatore(i, "titolari")} className="hover:bg-white hover:bg-opacity-30 rounded px-1">✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* PANCHINA */}
        <div className="bg-white rounded-2xl shadow-xl p-4">
          <h3 className="text-base font-bold mb-2">🪑 Panchina ({panchina.length})</h3>
          <div className="min-h-16 p-2 border border-slate-300 rounded-lg bg-slate-50">
            {panchina.length === 0 ? (
              <p className="text-slate-400 text-center py-2 text-sm">Nessun panchinaro</p>
            ) : (
              <div className="flex flex-wrap gap-1">
                {panchina.map((g, i) => (
                  <div key={i} className={`${getPlayerColor(g.ruolo)} text-white px-3 py-2 rounded-lg text-sm flex items-center gap-2`}>
                    <div>
                      <div className="text-xs">{g.nome}</div>
                      <div className="font-bold">{g.ruolo}</div>
                    </div>
                    <button onClick={() => spostaGiocatore(i, "panchina", "titolari")} className="hover:bg-white hover:bg-opacity-30 rounded px-2 py-1">⬆️</button>
                    <button onClick={() => rimuoviGiocatore(i, "panchina")} className="hover:bg-white hover:bg-opacity-30 rounded px-1">✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* MODULI - SEMPRE TUTTI */}
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <h2 className="text-2xl font-bold mb-6">🎯 Tutti i Moduli</h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {risultati.map((r, idx) => (
              <div 
                key={r.nome} 
                className={`${getColoreBG(r.percentMatch)} ${getBordo(idx)} rounded-xl p-5 shadow-lg hover:shadow-2xl hover:scale-105 transition-all duration-300 relative overflow-hidden`}
              >
                {idx === 0 && <div className="absolute top-2 right-2 text-3xl animate-pulse">👑</div>}
                {idx === 1 && <div className="absolute top-2 right-2 text-3xl">🥈</div>}
                {idx === 2 && <div className="absolute top-2 right-2 text-3xl">🥉</div>}
                
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-2xl font-black">{r.nome}</h3>
                </div>

                <div 
                  className="relative mb-4"
                  onMouseEnter={() => setHoverModulo(r.nome)}
                  onMouseLeave={() => setHoverModulo(null)}
                >
                  <div className="w-full bg-gray-200 rounded-full h-6 overflow-hidden">
                    <div 
                      className={`${getColoreProgress(r.percentMatch)} h-full flex items-center justify-center text-white text-sm font-bold transition-all duration-500`}
                      style={{ width: `${r.percentMatch}%` }}
                    >
                      {r.percentMatch.toFixed(0)}%
                    </div>
                  </div>
                  {hoverModulo === r.nome && (
                    <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-3 py-1 rounded shadow-lg whitespace-nowrap z-10">
                      {r.mancantiTitolari.length > 0 ? `Mancano: ${r.mancantiTitolari.join(", ")}` : "✅ Completo!"}
                    </div>
                  )}
                </div>

                <div className="text-sm mb-3">
                  <p className="font-semibold text-slate-700 mb-1">Formazione:</p>
                  <p className="text-slate-600 leading-relaxed">
                    {r.slots.map((slot, i) => {
                      const coperto = r.slotsCopertiTitolari[i];
                      return (
                        <span key={i} className={!coperto ? "text-red-600 font-bold" : ""}>
                          {slot.join("/")}
                          {i < r.slots.length - 1 ? ", " : ""}
                        </span>
                      );
                    })}
                  </p>
                </div>

                {r.mancantiTitolari.length > 0 && (
                  <div className="bg-white bg-opacity-70 rounded-lg p-2 mb-2">
                    <p className="text-xs font-bold text-red-600">
                      ⚠️ Ti servono: {r.mancantiTitolari.join(", ")}
                    </p>
                  </div>
                )}

                <div className="text-xs text-slate-600 mb-2">
                  {r.mancantiPanchina.length > 0 ? `🪑 Panchina: ${r.mancantiPanchina.join(", ")}` : "✅ Panchina OK"}
                </div>

                <div className="pt-2 border-t border-slate-300">
                  <p className="text-xs font-semibold text-slate-700">💪 Score: {r.score.toFixed(1)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* MODAL DATABASE */}
        {showDbModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">📊 Carica Database</h2>
                <button 
                  onClick={() => {
                    setShowDbModal(false);
                    setImportText("");
                    setImportStatus("");
                  }}
                  className="text-slate-500 hover:text-slate-700 text-2xl"
                >
                  ✕
                </button>
              </div>

              <div className="bg-blue-50 rounded-lg p-4 mb-4">
                <p className="text-sm text-slate-700 font-semibold">📝 Formato:</p>
                <p className="text-xs text-slate-600 mt-1">Incolla da Excel/Fantacalcio.it con TAB tra colonne</p>
                <p className="text-xs text-slate-600">Colonna 1: Nome | Colonna 2: Ruolo | Colonna 3: FMV (opzionale)</p>
                <p className="text-xs text-slate-600 mt-2">Accetta sia maiuscole/minuscole che ; o /</p>
              </div>

              {importStatus && (
                <div className={`${importStatus.includes('✅') ? 'bg-green-100 text-green-800' : importStatus.includes('⏳') ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'} border-2 rounded-lg p-3 text-center font-bold mb-4`}>
                  {importStatus}
                </div>
              )}

              <textarea
                className="w-full border-2 border-slate-300 rounded-lg p-3 font-mono text-sm h-64 focus:border-blue-500 focus:outline-none mb-4"
                placeholder="Dimarco&#9;E&#9;116&#10;Bastoni&#9;Dc&#9;73&#10;Dumfries&#9;E&#9;65"
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
              />

              <div className="flex gap-3">
                <button
                  onClick={handleImportDatabase}
                  disabled={!importText.trim()}
                  className={`flex-1 px-6 py-3 text-white rounded-lg font-semibold transition shadow ${importText.trim() ? 'bg-green-500 hover:bg-green-600' : 'bg-gray-300 cursor-not-allowed'}`}
                >
                  ✅ Importa Database
                </button>
                <button
                  onClick={() => {
                    setShowDbModal(false);
                    setImportText("");
                    setImportStatus("");
                  }}
                  className="px-6 py-3 bg-slate-300 text-slate-700 rounded-lg font-semibold hover:bg-slate-400 transition"
                >
                  Annulla
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL WISHLIST */}
        {showWishModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">⭐ Importa Wishlist</h2>
                <button 
                  onClick={() => {
                    setShowWishModal(false);
                    setImportText("");
                    setImportStatus("");
                  }}
                  className="text-slate-500 hover:text-slate-700 text-2xl"
                >
                  ✕
                </button>
              </div>

              <div className="bg-amber-50 rounded-lg p-4 mb-4">
                <p className="text-sm text-slate-700 font-semibold">📝 Formato:</p>
                <p className="text-xs text-slate-600 mt-1">Nome [TAB] Ruolo</p>
              </div>

              {importStatus && (
                <div className={`${importStatus.includes('✅') ? 'bg-green-100 text-green-800' : importStatus.includes('⏳') ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'} border-2 rounded-lg p-3 text-center font-bold mb-4`}>
                  {importStatus}
                </div>
              )}

              <textarea
                className="w-full border-2 border-slate-300 rounded-lg p-3 font-mono text-sm h-48 focus:border-blue-500 focus:outline-none mb-4"
                placeholder="Pulisic&#9;W/A&#10;Tonali&#9;M"
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
              />

              <div className="flex gap-3">
                <button
                  onClick={handleImportWishlist}
                  disabled={!importText.trim()}
                  className={`flex-1 px-6 py-3 text-white rounded-lg font-semibold transition shadow ${importText.trim() ? 'bg-green-500 hover:bg-green-600' : 'bg-gray-300 cursor-not-allowed'}`}
                >
                  ✅ Importa Wishlist
                </button>
                <button
                  onClick={() => {
                    setShowWishModal(false);
                    setImportText("");
                    setImportStatus("");
                  }}
                  className="px-6 py-3 bg-slate-300 text-slate-700 rounded-lg font-semibold hover:bg-slate-400 transition"
                >
                  Annulla
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL BUDGET */}
        {showBudgetModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">💰 Imposta Budget</h2>
                <button 
                  onClick={() => setShowBudgetModal(false)}
                  className="text-slate-500 hover:text-slate-700 text-2xl"
                >
                  ✕
                </button>
              </div>

              <div className="bg-green-50 rounded-lg p-4 mb-4">
                <p className="text-sm text-slate-700 font-semibold mb-2">💡 Come funziona:</p>
                <p className="text-xs text-slate-600">I valori FMV del database sono su base 1000. Imposta il tuo budget totale (es: 500, 300) e l'app scalerà automaticamente i prezzi.</p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-bold text-slate-700 mb-2">Budget Totale (crediti)</label>
                <input 
                  type="number" 
                  className="w-full border-2 border-green-300 p-3 rounded-lg focus:border-green-500 focus:outline-none text-lg font-bold"
                  value={budgetTotale}
                  onChange={(e) => setBudgetTotale(parseInt(e.target.value) || 500)}
                  min="100"
                  max="2000"
                />
              </div>

              <div className="bg-slate-100 rounded-lg p-3 mb-4">
                <p className="text-xs text-slate-600">
                  <strong>Esempi comuni:</strong><br/>
                  • Lega Classic: 500 crediti<br/>
                  • Lega Mantra: 300 crediti<br/>
                  • Lega Standard: 1000 crediti
                </p>
              </div>

              <button
                onClick={() => setShowBudgetModal(false)}
                className="w-full px-6 py-3 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 transition shadow"
              >
                ✅ Conferma
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
function MantraRiparazione() {
  const [budgetIniziale, setBudgetIniziale] = useState(50);
  const [modalitaSvincolo, setModalitaSvincolo] = useState("1credito");
  const [rosaAttuale, setRosaAttuale] = useState([]);
  const [giocatoriSelezionati, setGiocatoriSelezionati] = useState([]);
  const [fuoriSerieA, setFuoriSerieA] = useState({});
  const [creditiOverride, setCreditiOverride] = useState({});
  const [acquisti, setAcquisti] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [showImportRosaModal, setShowImportRosaModal] = useState(false);
  const [showImportSvincolatiModal, setShowImportSvincolatiModal] = useState(false);
  const [importText, setImportText] = useState("");
  const [inputNome, setInputNome] = useState("");
  const [inputRuolo, setInputRuolo] = useState("");
  const [listaSvincolati, setListaSvincolati] = useState([]);
  const [autocomplete, setAutocomplete] = useState([]);
  const [autocompleteIndex, setAutocompleteIndex] = useState(0);
  const [filtroPartite, setFiltroPartite] = useState(0);
  const [svincolatiAperta, setSvincolatiAperta] = useState(false);
  const [wishlistAperta, setWishlistAperta] = useState(false);
  const [svincolareDaRosaAperta, setSvincolareDaRosaAperta] = useState(false);
  const [ultimoSalvataggio, setUltimoSalvataggio] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const caricaDati = async () => {
      setLoading(true);
      try {
        const datiSalvati = await window.storage.get('mantra-asta-dati');
        if (datiSalvati && datiSalvati.value) {
          const dati = JSON.parse(datiSalvati.value);
          setBudgetIniziale(dati.budgetIniziale || 50);
          setModalitaSvincolo(dati.modalitaSvincolo || "1credito");
          setRosaAttuale(dati.rosaAttuale || []);
          setGiocatoriSelezionati(dati.giocatoriSelezionati || []);
          setFuoriSerieA(dati.fuoriSerieA || {});
          setCreditiOverride(dati.creditiOverride || {});
          setAcquisti(dati.acquisti || []);
          setListaSvincolati(dati.listaSvincolati || []);
          setWishlist(dati.wishlist || []);
          setUltimoSalvataggio(new Date());
        }
      } catch (error) {
        console.log('Nessun dato salvato');
      }
      setLoading(false);
    };
    caricaDati();
  }, []);

  useEffect(() => {
    if (loading) return;
    const salvaDati = async () => {
      try {
        const dati = {
          budgetIniziale,
          modalitaSvincolo,
          rosaAttuale,
          giocatoriSelezionati,
          fuoriSerieA,
          creditiOverride,
          acquisti,
          listaSvincolati,
          wishlist
        };
        await window.storage.set('mantra-asta-dati', JSON.stringify(dati));
        setUltimoSalvataggio(new Date());
      } catch (error) {
        console.error('Errore salvataggio:', error);
      }
    };
    const timer = setTimeout(salvaDati, 1000);
    return () => clearTimeout(timer);
  }, [budgetIniziale, modalitaSvincolo, rosaAttuale, giocatoriSelezionati, fuoriSerieA, creditiOverride, acquisti, listaSvincolati, wishlist, loading]);

  const getPlayerColor = (ruolo) => {
    const r = ruolo.toUpperCase().split('/')[0];
    if (r === "PC" || r === "A") return "bg-gradient-to-r from-red-500 to-rose-600 shadow-lg shadow-red-500/30";
    if (["DC", "DD", "DS", "B"].includes(r)) return "bg-gradient-to-r from-lime-500 to-green-600 shadow-lg shadow-lime-500/30";
    if (r === "E") return "bg-gradient-to-r from-green-600 to-emerald-700 shadow-lg shadow-green-600/30";
    if (["M", "C"].includes(r)) return "bg-gradient-to-r from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/30";
    if (["T", "W"].includes(r)) return "bg-gradient-to-r from-purple-500 to-indigo-600 shadow-lg shadow-purple-500/30";
    return "bg-gradient-to-r from-gray-500 to-slate-600 shadow-lg shadow-gray-500/30";
  };

  const calcolaCreditiRecuperati = (index) => {
    if (creditiOverride[index] !== undefined) return creditiOverride[index];
    const prezzo = rosaAttuale[index].prezzo;
    if (fuoriSerieA[index]) return prezzo;
    if (prezzo <= 1) return 1;
    if (modalitaSvincolo === "1credito") return 1;
    if (modalitaSvincolo === "metaEccesso") return Math.max(1, Math.ceil(prezzo / 2));
    if (modalitaSvincolo === "metaDifetto") return Math.max(1, Math.floor(prezzo / 2));
    return 1;
  };

  const creditiRecuperati = giocatoriSelezionati.reduce((sum, i) => sum + calcolaCreditiRecuperati(i), 0);
  const budgetTotale = budgetIniziale + creditiRecuperati;
  const spesaTotale = acquisti.reduce((sum, a) => sum + (a.prezzo || 0), 0);
  const budgetRimanente = budgetTotale - spesaTotale;

  useEffect(() => {
    if (inputNome.length >= 2 && listaSvincolati.length > 0) {
      const matches = listaSvincolati.filter(g => g.nome.toLowerCase().includes(inputNome.toLowerCase())).slice(0, 5);
      setAutocomplete(matches);
      setAutocompleteIndex(0);
    } else {
      setAutocomplete([]);
      setAutocompleteIndex(0);
    }
  }, [inputNome, listaSvincolati]);

  const handleImportRosaAttuale = () => {
    const lines = importText.split('\n');
    const newRosa = [];
    for (let line of lines) {
      line = line.trim();
      if (!line || line.toLowerCase().includes('nome')) continue;
      const parts = line.split('\t');
      if (parts.length >= 3) {
        const nome = parts[0].trim();
        const ruolo = parts[1].trim().toUpperCase().replace(/;/g, '/');
        const prezzo = parseInt(parts[2].trim());
        if (nome && ruolo && prezzo && !isNaN(prezzo) && ruolo !== 'POR') {
          newRosa.push({ nome, ruolo, prezzo });
        }
      }
    }
    if (newRosa.length === 0) {
      alert("Nessun giocatore trovato!");
      return;
    }
    setRosaAttuale(newRosa);
    setShowImportRosaModal(false);
    setImportText("");
  };

  const handleImportSvincolati = () => {
    const lines = importText.split('\n');
    const newSvinc = [];
    for (let line of lines) {
      line = line.trim();
      if (!line || line.toLowerCase().includes('nome')) continue;
      const parts = line.split('\t');
      if (parts.length >= 4) {
        const nome = parts[0].trim();
        const ruolo = parts[1].trim().toUpperCase().replace(/;/g, '/');
        const partite = parseInt(parts[2].trim());
        const quotazione = parseInt(parts[3].trim());
        if (nome && ruolo && !isNaN(partite) && !isNaN(quotazione) && ruolo !== 'POR') {
          newSvinc.push({ nome, ruolo, partite, quotazione });
        }
      }
    }
    if (newSvinc.length === 0) {
      alert("Nessun giocatore trovato!");
      return;
    }
    setListaSvincolati(newSvinc);
    setShowImportSvincolatiModal(false);
    setImportText("");
    setSvincolatiAperta(true);
  };

  const handleClickSvincolati = () => {
    if (listaSvincolati.length === 0) {
      setShowImportSvincolatiModal(true);
    } else {
      setSvincolatiAperta(!svincolatiAperta);
    }
  };

  const toggleWishlist = (giocatore) => {
    const esisteGia = wishlist.find(w => w.nome === giocatore.nome);
    if (esisteGia) {
      setWishlist(wishlist.filter(w => w.nome !== giocatore.nome));
    } else {
      setWishlist([...wishlist, { nome: giocatore.nome, ruolo: giocatore.ruolo, fmv: giocatore.quotazione }]);
    }
  };

  const rimuoviDaWishlist = (nomeGiocatore) => {
    setWishlist(wishlist.filter(w => w.nome !== nomeGiocatore));
  };

  const isInWishlist = (nomeGiocatore) => {
    return wishlist.some(w => w.nome === nomeGiocatore);
  };

  const getSvincolatiFiltrati = () => {
    return listaSvincolati.filter(g => g.partite >= filtroPartite);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-orange-50 to-red-50 flex items-center justify-center">
        <div className="text-2xl font-bold text-orange-600">Caricamento...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-orange-50 to-red-50 p-4">
      <div className="max-w-7xl mx-auto space-y-4">
        
        <div className="bg-gradient-to-br from-orange-600 to-red-700 rounded-xl shadow-2xl p-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-black text-white">🔄 ASTA DI RIPARAZIONE</h1>
              {ultimoSalvataggio && (
                <p className="text-xs text-orange-100 mt-1">
                  💾 Salvato: {ultimoSalvataggio.toLocaleTimeString()}
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowImportRosaModal(true)} className="px-4 py-2 bg-white text-orange-600 rounded-lg font-bold text-sm hover:bg-orange-50 transition">
                📥 ROSA
              </button>
              <button onClick={handleClickSvincolati} className="px-4 py-2 bg-blue-500 text-white rounded-lg font-bold text-sm hover:bg-blue-600 transition">
                📋 SVINCOLATI ({listaSvincolati.length})
              </button>
              <button onClick={() => setWishlistAperta(!wishlistAperta)} className="px-4 py-2 bg-yellow-500 text-white rounded-lg font-bold text-sm hover:bg-yellow-600 transition">
                ⭐ WISHLIST ({wishlist.length})
              </button>
              <button 
                onClick={() => {
                  if (confirm('⚠️ Vuoi davvero resettare tutti i dati? Questa azione non può essere annullata.')) {
                    setBudgetIniziale(50);
                    setModalitaSvincolo("1credito");
                    setRosaAttuale([]);
                    setGiocatoriSelezionati([]);
                    setFuoriSerieA({});
                    setCreditiOverride({});
                    setAcquisti([]);
                    setListaSvincolati([]);
                    setWishlist([]);
                  }
                }}
                className="px-4 py-2 bg-red-500 text-white rounded-lg font-bold text-sm hover:bg-red-600 transition"
              >
                🗑️ RESET
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg border-2 border-slate-200 p-6">
          <div className="flex flex-col items-center gap-6">
            <div className="flex flex-wrap items-center justify-center gap-6">
              <div className="flex items-center gap-3">
                <label className="text-sm font-bold text-slate-700 whitespace-nowrap">💰 Budget iniziale:</label>
                <input type="number" min="0" className="w-24 border-2 border-green-400 p-2 rounded-lg font-bold text-xl text-center"
                  value={budgetIniziale} onChange={(e) => setBudgetIniziale(parseInt(e.target.value) || 0)} />
              </div>
              
              <div className="h-8 w-px bg-slate-300 hidden md:block"></div>
              
              <div className="flex items-center gap-3">
                <label className="text-sm font-bold text-slate-700 whitespace-nowrap">📊 Modalità:</label>
                <select value={modalitaSvincolo} onChange={(e) => setModalitaSvincolo(e.target.value)}
                  className="border-2 border-orange-400 p-2 rounded-lg text-sm font-semibold bg-white">
                  <option value="1credito">🟢 1 credito</option>
                  <option value="metaEccesso">🟡 Metà eccesso</option>
                  <option value="metaDifetto">🟠 Metà difetto</option>
                </select>
              </div>
            </div>
            
            <div className="flex flex-wrap items-center justify-center gap-4">
              <div className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-green-600 text-white px-6 py-3 rounded-lg shadow-lg">
                <span className="text-sm font-bold">💵 Totale:</span>
                <span className="text-3xl font-black">{budgetTotale}</span>
                <span className="text-xs opacity-90">({budgetIniziale}+{creditiRecuperati})</span>
              </div>
              
              <div className={`flex items-center gap-2 text-white px-6 py-3 rounded-lg shadow-lg ${budgetRimanente >= 0 ? 'bg-gradient-to-r from-blue-500 to-indigo-600' : 'bg-gradient-to-r from-red-500 to-red-700'}`}>
                <span className="text-sm font-bold">{budgetRimanente >= 0 ? '💳 Rimanenti:' : '⚠️ Sforato:'}</span>
                <span className="text-3xl font-black">{budgetRimanente}</span>
                <span className="text-xs opacity-90">(spesi {spesaTotale})</span>
              </div>
            </div>
          </div>
        </div>

        {svincolatiAperta && listaSvincolati.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg border-2 border-blue-400 p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-blue-700">📋 LISTA SVINCOLATI</h2>
              <button onClick={() => setSvincolatiAperta(false)} className="text-2xl text-blue-600 hover:text-blue-800">✕</button>
            </div>
            
            <div className="bg-blue-50 rounded-lg p-3 mb-4">
              <div className="flex items-center gap-4">
                <label className="text-sm font-bold text-slate-700">Partite minime:</label>
                <div className="flex items-center gap-2">
                  <button onClick={() => setFiltroPartite(Math.max(0, filtroPartite - 1))}
                    className="w-8 h-8 bg-blue-500 text-white rounded font-bold hover:bg-blue-600">−</button>
                  <span className="text-lg font-bold bg-white px-4 py-1 rounded min-w-12 text-center">{filtroPartite}</span>
                  <button onClick={() => setFiltroPartite(Math.min(38, filtroPartite + 1))}
                    className="w-8 h-8 bg-blue-500 text-white rounded font-bold hover:bg-blue-600">+</button>
                </div>
                <span className="text-sm text-slate-600 ml-auto">
                  {getSvincolatiFiltrati().length} di {listaSvincolati.length} giocatori
                </span>
              </div>
            </div>
            
            <div className="grid grid-cols-5 gap-2 max-h-96 overflow-y-auto">
              {getSvincolatiFiltrati().map((g, idx) => {
                const inWishlist = isInWishlist(g.nome);
                const prezzoStimato = Math.round((g.quotazione / 1000) * budgetTotale);
                return (
                  <div key={idx} className={`border-2 rounded-lg p-2 ${inWishlist ? 'border-yellow-400 bg-yellow-50' : 'border-slate-200'}`}>
                    <div className="flex items-center justify-between mb-1">
                      <button onClick={() => toggleWishlist(g)} className="text-xl hover:scale-110 transition">
                        {inWishlist ? '⭐' : '☆'}
                      </button>
                      <span className={`${getPlayerColor(g.ruolo)} text-white px-1.5 py-0.5 rounded text-xs font-bold`}>{g.ruolo}</span>
                    </div>
                    <div className="font-bold text-xs mb-1">{g.nome}</div>
                    <div className="text-xs text-slate-600">{g.partite}p | ~{prezzoStimato}cr</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {wishlistAperta && (
          <div className="bg-white rounded-xl shadow-lg border-2 border-yellow-400 p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-yellow-700">⭐ WISHLIST</h2>
              <button onClick={() => setWishlistAperta(false)} className="text-2xl text-yellow-600 hover:text-yellow-800">✕</button>
            </div>
            
            {wishlist.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <p>Nessun giocatore nella wishlist</p>
                <p className="text-sm mt-2">Stellina i giocatori dalla lista svincolati</p>
              </div>
            ) : (
              <div className="grid grid-cols-5 gap-2">
                {wishlist.map((g, idx) => {
                  const prezzoStimato = g.fmv ? Math.round((g.fmv / 1000) * budgetTotale) : null;
                  return (
                    <div key={idx} className="border-2 border-yellow-300 bg-yellow-50 rounded-lg p-2">
                      <div className="flex items-center justify-between mb-1">
                        <button onClick={() => rimuoviDaWishlist(g.nome)} className="text-xl hover:scale-110 transition">⭐</button>
                        <span className={`${getPlayerColor(g.ruolo)} text-white px-1.5 py-0.5 rounded text-xs font-bold`}>{g.ruolo}</span>
                      </div>
                      <div className="font-bold text-xs mb-1">{g.nome}</div>
                      {prezzoStimato && <div className="text-xs text-slate-600">~{prezzoStimato}cr</div>}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        <div className="bg-white rounded-xl shadow-lg border-2 border-slate-200 overflow-hidden">
          <button onClick={() => setSvincolareDaRosaAperta(!svincolareDaRosaAperta)}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white p-3 font-bold text-lg flex items-center justify-between">
            <span>✂️ GIOCATORI DA SVINCOLARE ({giocatoriSelezionati.length})</span>
            {svincolareDaRosaAperta ? <ChevronUp /> : <ChevronDown />}
          </button>
          
          {svincolareDaRosaAperta && (
            <div className="p-4">
              {rosaAttuale.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  <p className="mb-4">Nessun giocatore nella rosa</p>
                  <button onClick={() => setShowImportRosaModal(true)} className="px-6 py-3 bg-orange-500 text-white rounded-lg font-bold">
                    📥 Importa Rosa
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {rosaAttuale.map((g, i) => {
                    const sel = giocatoriSelezionati.includes(i);
                    const fuori = fuoriSerieA[i];
                    const crediti = calcolaCreditiRecuperati(i);
                    return (
                      <div key={i} className={`border-2 rounded-lg p-2 ${sel ? 'border-orange-400 bg-orange-50' : 'border-slate-200'}`}>
                        <div className="flex items-center gap-2 mb-2">
                          <input type="checkbox" checked={sel} onChange={() => {
                            setGiocatoriSelezionati(sel ? giocatoriSelezionati.filter(x => x !== i) : [...giocatoriSelezionati, i]);
                          }} className="w-4 h-4" />
                          <span className={`${getPlayerColor(g.ruolo)} text-white px-2 py-1 rounded text-xs font-bold`}>{g.ruolo}</span>
                          <span className="flex-1 font-bold text-sm">{g.nome}</span>
                          <span className="text-xs text-slate-600 font-semibold">{g.prezzo}cr</span>
                        </div>
                        {sel && (
                          <div className="flex items-center gap-2">
                            <button onClick={() => setFuoriSerieA({...fuoriSerieA, [i]: !fuori})}
                              className={`px-2 py-1 rounded text-xs font-bold flex-1 ${fuori ? 'bg-purple-500 text-white' : 'bg-slate-200'}`}>
                              {fuori ? 'Fuori A' : 'In A'}
                            </button>
                            <input type="number" min="0" value={creditiOverride[i] !== undefined ? creditiOverride[i] : crediti}
                              onChange={(e) => {
                                const val = e.target.value === "" ? null : parseInt(e.target.value);
                                if (val === null) {
                                  const n = {...creditiOverride};
                                  delete n[i];
                                  setCreditiOverride(n);
                                } else {
                                  setCreditiOverride({...creditiOverride, [i]: val});
                                }
                              }}
                              className="w-14 border-2 border-green-400 p-1 rounded text-center text-xs font-bold" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-xl shadow-lg border-2 border-slate-200 p-4">
            <h2 className="text-xl font-bold mb-4">➕ Aggiungi Giocatore</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">🌐 Per Ruolo</label>
                <input type="text" className="w-full border-2 border-blue-300 p-2 rounded-lg text-sm"
                  placeholder="DC, M/C, W/A..." value={inputRuolo} onChange={(e) => setInputRuolo(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && inputRuolo) {
                      const ruolo = inputRuolo.toUpperCase().trim();
                      setAcquisti([...acquisti, {nome: `Giocatore ${ruolo}`, ruolo, prezzo: 0}]);
                      setInputRuolo("");
                    }
                  }} />
                <p className="text-xs text-slate-500 mt-1">Premi Enter → Titolari</p>
              </div>
              <div className="relative">
                <label className="block text-xs font-bold text-slate-700 mb-1">📝 Per Nome</label>
                <input type="text" className="w-full border-2 border-purple-300 p-2 rounded-lg text-sm"
                  placeholder="Cerca giocatore..." value={inputNome} onChange={(e) => setInputNome(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      if (autocomplete.length > 0) {
                        const selected = autocomplete[autocompleteIndex];
                        setAcquisti([...acquisti, {nome: selected.nome, ruolo: selected.ruolo, prezzo: 0}]);
                        setInputNome("");
                        setAutocomplete([]);
                        setAutocompleteIndex(0);
                      } else if (inputNome.trim()) {
                        setAcquisti([...acquisti, {nome: inputNome, ruolo: "?", prezzo: 0}]);
                        setInputNome("");
                      }
                    } else if (e.key === "ArrowDown") {
                      e.preventDefault();
                      if (autocomplete.length > 0) {
                        setAutocompleteIndex((prev) => (prev + 1) % autocomplete.length);
                      }
                    } else if (e.key === "ArrowUp") {
                      e.preventDefault();
                      if (autocomplete.length > 0) {
                        setAutocompleteIndex((prev) => (prev - 1 + autocomplete.length) % autocomplete.length);
                      }
                    } else if (e.key === "Escape") {
                      setAutocomplete([]);
                      setAutocompleteIndex(0);
                    }
                  }}
                  disabled={listaSvincolati.length === 0} />
                <p className="text-xs text-slate-500 mt-1">↑↓ Naviga | Enter → Titolari</p>
                {autocomplete.length > 0 && (
                  <div className="absolute top-full left-0 right-0 bg-white border-2 border-purple-500 rounded-lg mt-1 shadow-2xl z-30 max-h-60 overflow-y-auto">
                    {autocomplete.map((giocatore, idx) => {
                      return (
                        <div key={idx} 
                          className={`p-2 border-b cursor-pointer ${idx === autocompleteIndex ? 'bg-purple-200' : 'hover:bg-purple-50'}`}
                          onClick={() => {
                            setAcquisti([...acquisti, {nome: giocatore.nome, ruolo: giocatore.ruolo, prezzo: 0}]);
                            setInputNome("");
                            setAutocomplete([]);
                            setAutocompleteIndex(0);
                          }}>
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-bold text-sm">{giocatore.nome}</span>
                            <span className={`${getPlayerColor(giocatore.ruolo)} text-white px-2 py-0.5 rounded text-xs font-bold`}>{giocatore.ruolo}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg border-2 border-emerald-300 p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xl font-bold text-emerald-700">💰 Spesa Reale ({acquisti.length})</h2>
              <button onClick={() => setAcquisti([])} className="text-sm text-red-600 hover:text-red-800 font-bold">
                🗑️ Svuota
              </button>
            </div>
            
            {acquisti.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <p className="text-sm">Nessun giocatore acquistato</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {acquisti.map((acq, idx) => (
                  <div key={idx} className="bg-emerald-50 border-2 border-emerald-200 rounded-lg p-3 flex items-center gap-3">
                    <div className="flex-1">
                      <div className="font-bold text-sm">{acq.nome}</div>
                      <div className="text-xs text-slate-500">({acq.ruolo})</div>
                    </div>
                    <input type="number" min="0" 
                      className="w-20 border-2 border-emerald-400 bg-white p-2 rounded-lg text-center font-bold text-base focus:border-emerald-600 focus:outline-none"
                      placeholder="0"
                      value={acq.prezzo || ""} 
                      onChange={(e) => {
                        const val = e.target.value === "" ? 0 : parseInt(e.target.value);
                        const nuovi = [...acquisti];
                        nuovi[idx] = {...nuovi[idx], prezzo: val};
                        setAcquisti(nuovi);
                      }} />
                    <span className="text-xs text-slate-600 font-semibold">cr</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg border-2 border-slate-200 p-4">
          <h2 className="text-xl font-bold mb-3">🛒 ACQUISTI ({acquisti.length}/11)</h2>
          {acquisti.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <p className="text-sm">Nessun acquisto effettuato</p>
              <p className="text-xs mt-1">Aggiungi giocatori per iniziare</p>
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-2">
              {acquisti.map((acq, idx) => (
                <div key={idx} className={`${getPlayerColor(acq.ruolo)} rounded-xl p-3 text-white shadow-lg relative`}>
                  <button onClick={() => setAcquisti(acquisti.filter((_, i) => i !== idx))} 
                    className="absolute top-2 right-2 w-6 h-6 bg-white bg-opacity-20 hover:bg-opacity-40 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    ✕
                  </button>
                  <div className="flex items-center gap-1 mb-1">
                    <span className="text-xs font-bold opacity-90">{acq.ruolo}</span>
                  </div>
                  <div className="font-bold text-sm pr-6">{acq.nome}</div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {showImportRosaModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-3xl font-bold">📥 Importa Rosa Attuale</h2>
              <button onClick={() => { setShowImportRosaModal(false); setImportText(""); }} className="text-3xl font-bold">✕</button>
            </div>
            <div className="bg-orange-50 border-2 border-orange-200 rounded-xl p-5 mb-6">
              <p className="text-sm font-bold mb-2">📝 Formato: Nome [TAB] Ruolo [TAB] Prezzo</p>
            </div>
            <textarea className="w-full border-2 p-4 rounded-xl font-mono text-sm h-64 mb-6"
              placeholder="Bastoni&#9;DC&#9;45" value={importText} onChange={(e) => setImportText(e.target.value)} />
            <div className="flex gap-3">
              <button onClick={handleImportRosaAttuale} disabled={!importText.trim()}
                className={`flex-1 px-6 py-4 text-white rounded-xl font-bold ${importText.trim() ? 'bg-orange-500' : 'bg-gray-300'}`}>
                ✅ Importa Rosa
              </button>
              <button onClick={() => { setShowImportRosaModal(false); setImportText(""); }}
                className="px-6 py-4 bg-slate-200 rounded-xl font-bold">Annulla</button>
            </div>
          </div>
        </div>
      )}

      {showImportSvincolatiModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-3xl font-bold">📋 Importa Svincolati</h2>
              <button onClick={() => { setShowImportSvincolatiModal(false); setImportText(""); }} className="text-3xl font-bold">✕</button>
            </div>
            <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-5 mb-6">
              <p className="text-sm font-bold mb-2">📝 Nome [TAB] Ruolo [TAB] Partite [TAB] Quotazione</p>
            </div>
            <textarea className="w-full border-2 p-4 rounded-xl font-mono text-sm h-64 mb-6"
              placeholder="Kvaratskhelia&#9;W/A&#9;12&#9;85" value={importText} onChange={(e) => setImportText(e.target.value)} />
            <div className="flex gap-3">
              <button onClick={handleImportSvincolati} disabled={!importText.trim()}
                className={`flex-1 px-6 py-4 text-white rounded-xl font-bold ${importText.trim() ? 'bg-blue-500' : 'bg-gray-300'}`}>
                ✅ Importa Lista
              </button>
              <button onClick={() => { setShowImportSvincolatiModal(false); setImportText(""); }}
                className="px-6 py-4 bg-slate-200 rounded-xl font-bold">Annulla</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
