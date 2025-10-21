import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "../api";
import { DrawWheel, Player } from "../components/DrawWheel";
import toast from "react-hot-toast";

type Pairing = {
  a: Player;
  b: Player;
};

type DrawState = {
  id: string;
  tournamentId: string;
  round: string;
  stage: "waiting" | "idle" | "spinning" | "completed";
  currentPick: number;
  pairings: Pairing[];
  spinPool: Player[];
  currentPair: Player[];
  selectedPlayer?: Player;
};

type Tournament = {
  id: string;
  title: string;
};

export default function DrawView() {
  const [me, setMe] = useState<{ email?: string; role?: string } | null>(null);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<string>("");
  const [selectedRound, setSelectedRound] = useState<"R16" | "QF" | "SF">("R16");
  const [draw, setDraw] = useState<DrawState | null>(null);
  const [spinning, setSpinning] = useState(false);
  const [loading, setLoading] = useState(true);
  const [ws, setWs] = useState<WebSocket | null>(null);
  const nav = useNavigate();

  const isAdmin = me?.role === "admin" || me?.role === "super_admin";

  // Check auth
  useEffect(() => {
    api("/api/auth/me")
      .then((data) => {
        setMe(data);
        setLoading(false);
      })
      .catch(() => {
        nav("/login");
      });
  }, [nav]);

  // Load tournaments
  useEffect(() => {
    if (!me) return;
    
    api("/api/tournaments")
      .then((data) => {
        setTournaments(data || []);
        if (data && data.length > 0) {
          setSelectedTournament(data[0].id);
        }
      })
      .catch((err) => {
        toast.error("שגיאה בטעינת טורנירים");
        console.error(err);
      });
  }, [me]);

  // Load active draw for selected tournament
  useEffect(() => {
    if (!selectedTournament) return;

    api(`/api/draw/tournament/${selectedTournament}`)
      .then((data) => {
        setDraw(data);
      })
      .catch((err) => {
        // No active draw is OK
        console.log("No active draw for this tournament");
        setDraw(null);
      });
  }, [selectedTournament]);

  // WebSocket connection for live updates
  useEffect(() => {
    if (!me) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}/presence`;

    const websocket = new WebSocket(wsUrl);

    websocket.onopen = () => {
      console.log("🔌 WebSocket connected for draw");
    };

    websocket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        
        // Handle draw events
        if (message.type === "draw:started") {
          setDraw(message.data);
          toast.success("ההגרלה החלה!");
        } else if (message.type === "draw:spin") {
          setSpinning(true);
          setDraw((prev) => prev ? { ...prev, ...message.data } : message.data);
        } else if (message.type === "draw:pair-locked") {
          setSpinning(false);
          setDraw((prev) => prev ? { ...prev, ...message.data } : message.data);
          toast.success("הזוג נקבע!");
        } else if (message.type === "draw:completed") {
          setDraw((prev) => prev ? { ...prev, ...message.data } : message.data);
          toast.success("ההגרלה הושלמה!");
        }
      } catch (err) {
        console.error("Error parsing WebSocket message:", err);
      }
    };

    websocket.onerror = (error) => {
      console.error("❌ WebSocket error:", error);
    };

    websocket.onclose = () => {
      console.log("🔌 WebSocket disconnected");
    };

    setWs(websocket);

    return () => {
      websocket.close();
    };
  }, [me]);

  // Start draw
  const startDraw = async () => {
    if (!selectedTournament || !selectedRound) {
      toast.error("נא לבחור טורניר ושלב");
      return;
    }

    try {
      const data = await api("/api/draw/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tournamentId: selectedTournament,
          round: selectedRound,
        }),
      });

      setDraw(data);
      toast.success("ההגרלה החלה!");
    } catch (err: any) {
      toast.error(err.message || "שגיאה בהתחלת הגרלה");
    }
  };

  // Spin wheel
  const spin = async () => {
    if (!draw) return;

    setSpinning(true);

    try {
      const data = await api(`/api/draw/${draw.id}/spin`, {
        method: "POST",
      });

      // Update local state
      setTimeout(() => {
        setSpinning(false);
      }, 3500);
    } catch (err: any) {
      setSpinning(false);
      toast.error(err.message || "שגיאה בהגרלה");
    }
  };

  // Lock pair
  const lockPair = async () => {
    if (!draw) return;

    try {
      const data = await api(`/api/draw/${draw.id}/lock-pair`, {
        method: "POST",
      });

      toast.success("הזוג נקבע!");
    } catch (err: any) {
      toast.error(err.message || "שגיאה בקביעת הזוג");
    }
  };

  // Complete draw
  const completeDraw = async () => {
    if (!draw) return;

    try {
      await api(`/api/draw/${draw.id}/complete`, {
        method: "POST",
      });

      toast.success("ההגרלה הושלמה! המשחקים נוצרו.");
    } catch (err: any) {
      toast.error(err.message || "שגיאה בהשלמת ההגרלה");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4">⏳</div>
          <div className="text-xl font-bold">טוען...</div>
        </div>
      </div>
    );
  }

  const currentPool = draw?.spinPool || [];
  const currentPair = draw?.currentPair || [];
  const pairings = draw?.pairings || [];

  return (
    <div 
      className="min-h-screen p-4 md:p-8"
      style={{
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      }}
    >
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 text-center"
        >
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-2 drop-shadow-lg">
            🎲 הגרלת זוגות משחקים
          </h1>
          <p className="text-white/90 text-lg">
            {isAdmin ? "ניהול הגרלה חיה" : "צפייה בהגרלה בשידור חי"}
          </p>
        </motion.div>

        {/* Admin Controls */}
        {isAdmin && !draw && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-8 rounded-2xl bg-white p-6 shadow-xl"
          >
            <h2 className="mb-4 text-2xl font-bold text-gray-800">התחל הגרלה חדשה</h2>
            
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  בחר טורניר
                </label>
                <select
                  className="w-full rounded-lg border border-gray-300 p-3 text-right focus:border-purple-500 focus:outline-none"
                  value={selectedTournament}
                  onChange={(e) => setSelectedTournament(e.target.value)}
                >
                  <option value="">-- בחר טורניר --</option>
                  {tournaments.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  בחר שלב
                </label>
                <select
                  className="w-full rounded-lg border border-gray-300 p-3 text-right focus:border-purple-500 focus:outline-none"
                  value={selectedRound}
                  onChange={(e) => setSelectedRound(e.target.value as any)}
                >
                  <option value="R16">שמינית גמר (16 שחקנים)</option>
                  <option value="QF">רבע גמר (8 שחקנים)</option>
                  <option value="SF">חצי גמר (4 שחקנים)</option>
                </select>
              </div>
            </div>

            <button
              onClick={startDraw}
              disabled={!selectedTournament}
              className="mt-4 w-full rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-3 font-bold text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              🎬 התחל הגרלה
            </button>
          </motion.div>
        )}

        {/* Draw Area */}
        {draw && draw.stage !== "completed" && (
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Wheel */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="lg:col-span-2"
            >
              <div className="rounded-2xl bg-white p-6 shadow-xl">
                <div className="mb-4 text-center">
                  <h2 className="text-2xl font-bold text-gray-800">
                    גלגל ההגרלה
                  </h2>
                  <p className="text-gray-600">
                    שלב: <span className="font-bold">{draw.round}</span> | 
                    בחירה: <span className="font-bold">{draw.currentPick}</span>
                  </p>
                </div>

                <div className="flex justify-center">
                  <DrawWheel
                    players={currentPool}
                    spinning={spinning}
                    selectedPlayer={draw.selectedPlayer}
                  />
                </div>

                {/* Current Pair */}
                {currentPair.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-6 rounded-xl bg-gradient-to-r from-blue-50 to-purple-50 p-4"
                  >
                    <h3 className="mb-3 text-center text-lg font-bold text-gray-800">
                      הזוג הנוכחי
                    </h3>
                    <div className="flex items-center justify-center gap-4">
                      {currentPair.map((player, idx) => (
                        <React.Fragment key={player.id}>
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: idx * 0.3 }}
                            className="flex h-16 w-16 items-center justify-center rounded-full bg-purple-600 text-2xl font-bold text-white shadow-lg"
                          >
                            {player.name.charAt(0)}
                          </motion.div>
                          <div className="text-lg font-bold text-gray-800">
                            {player.name}
                          </div>
                          {idx === 0 && currentPair.length === 2 && (
                            <div className="text-2xl text-gray-400">VS</div>
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Admin Controls */}
                {isAdmin && (
                  <div className="mt-6 grid grid-cols-2 gap-3">
                    <button
                      onClick={spin}
                      disabled={spinning || currentPool.length === 0 || currentPair.length === 2}
                      className="rounded-lg bg-gradient-to-r from-green-600 to-teal-600 px-4 py-3 font-bold text-white shadow-lg transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      🎲 הגרל שחקן
                    </button>
                    <button
                      onClick={lockPair}
                      disabled={currentPair.length !== 2}
                      className="rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3 font-bold text-white shadow-lg transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      🔒 קבע זוג
                    </button>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Pairings List */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="rounded-2xl bg-white p-6 shadow-xl"
            >
              <h2 className="mb-4 text-2xl font-bold text-gray-800">
                זוגות שנקבעו ({pairings.length})
              </h2>

              <div className="space-y-3">
                <AnimatePresence>
                  {pairings.map((pair, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="rounded-lg border-2 border-gray-200 bg-gray-50 p-3"
                    >
                      <div className="text-center text-sm font-bold text-gray-600">
                        משחק #{idx + 1}
                      </div>
                      <div className="mt-2 flex items-center justify-between gap-2 text-sm">
                        <div className="flex-1 rounded bg-blue-100 p-2 text-center font-bold text-blue-800">
                          {pair.a.name}
                        </div>
                        <div className="text-lg font-bold text-gray-400">VS</div>
                        <div className="flex-1 rounded bg-red-100 p-2 text-center font-bold text-red-800">
                          {pair.b.name}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              {isAdmin && pairings.length > 0 && currentPool.length === 0 && (
                <button
                  onClick={completeDraw}
                  className="mt-6 w-full rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-3 font-bold text-white shadow-lg transition-all hover:scale-105"
                >
                  ✅ סיים הגרלה וצור משחקים
                </button>
              )}
            </motion.div>
          </div>
        )}

        {/* Completed State */}
        {draw && draw.stage === "completed" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-2xl bg-white p-8 shadow-xl text-center"
          >
            <div className="text-6xl mb-4">🏆</div>
            <h2 className="text-3xl font-bold text-gray-800 mb-2">
              ההגרלה הושלמה!
            </h2>
            <p className="text-gray-600 mb-6">
              כל המשחקים נוצרו ומוכנים לתחילת הטורניר
            </p>
            <button
              onClick={() => nav("/bracket")}
              className="rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 px-8 py-3 font-bold text-white shadow-lg transition-all hover:scale-105"
            >
              📊 צפה בטבלת הטורניר
            </button>
          </motion.div>
        )}

        {/* No Active Draw */}
        {!draw && !isAdmin && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-2xl bg-white p-8 shadow-xl text-center"
          >
            <div className="text-6xl mb-4">🎲</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              אין הגרלה פעילה כרגע
            </h2>
            <p className="text-gray-600">
              המתן להתחלת ההגרלה על ידי המנהל
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}

