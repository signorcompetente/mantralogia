import React, { useState, useEffect } from 'react';
import { Trash2, ChevronDown, ChevronUp } from 'lucide-react';

export default function MantraRiparazione() {
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
