import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "../api";
import AdvancePreviewModal from "./AdvancePreviewModal";
import { toast } from "react-hot-toast";
import confetti from "canvas-confetti";

interface Player {
  id: string;
  psn: string;
  displayName: string;
  email?: string;
}

interface Match {
  id: string;
  homeId: string;
  awayId: string;
  homeScore: number | null;
  awayScore: number | null;
  status: string;
}

interface AdvanceWinnersProps {
  tournamentId: string;
  round: "R16" | "QF" | "SF";
  onAdvanceComplete: () => void;
  isDisabled: boolean;
}

export default function AdvanceWinners({ 
  tournamentId, 
  round, 
  onAdvanceComplete, 
  isDisabled 
}: AdvanceWinnersProps) {
  const [matches, setMatches] = useState<Match[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedWinners, setSelectedWinners] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [canUndo, setCanUndo] = useState(false);
  const [undoTimeout, setUndoTimeout] = useState<NodeJS.Timeout | null>(null);

  const roundNames = {
    R16: { from: "שמינית הגמר", to: "רבע גמר", next: "QF" },
    QF: { from: "רבע גמר", to: "חצי גמר", next: "SF" },
    SF: { from: "חצי גמר", to: "גמר", next: "F" }
  };

  const roundInfo = roundNames[round];
  const expectedWinners = matches.length;
  const selectedCount = selectedWinners.length;
  const isComplete = selectedCount === expectedWinners && expectedWinners > 0;

  useEffect(() => {
    loadMatches();
    loadPlayers();
  }, [tournamentId, round]);

  const loadMatches = async () => {
    try {
      const data = await api(`/api/tournaments/${tournamentId}/matches?round=${round}`);
      setMatches(data.filter((m: Match) => m.status === 'CONFIRMED'));
    } catch (error) {
      console.error("Failed to load matches:", error);
    }
  };

  const loadPlayers = async () => {
    try {
      const data = await api(`/api/tournaments/${tournamentId}/players`);
      setPlayers(data);
    } catch (error) {
      console.error("Failed to load players:", error);
    }
  };

  const getPlayerById = (id: string) => players.find(p => p.id === id);

  const handleWinnerSelect = (winnerId: string) => {
    setSelectedWinners(prev => {
      if (prev.includes(winnerId)) {
        return prev.filter(id => id !== winnerId);
      } else if (prev.length < expectedWinners) {
        return [...prev, winnerId];
      }
      return prev;
    });
  };

  const getMatchWinner = (match: Match): string | null => {
    if (match.homeScore === null || match.awayScore === null) return null;
    return match.homeScore > match.awayScore ? match.homeId : match.awayId;
  };

  const autoSelectWinners = () => {
    const winners = matches
      .map(match => getMatchWinner(match))
      .filter((winner): winner is string => winner !== null);
    setSelectedWinners(winners);
  };

  const handlePreview = async () => {
    if (!isComplete) return;
    
    setLoading(true);
    try {
      // Dry run preview
      const preview = await api(`/api/tournaments/${tournamentId}/advance/preview`, {
        method: "POST",
        body: JSON.stringify({ 
          round, 
          winners: selectedWinners,
          idempotencyKey: `${tournamentId}-${round}-${Date.now()}`
        })
      });
      
      setShowPreview(true);
    } catch (error) {
      toast.error("שגיאה בתצוגה מקדימה");
      console.error("Preview error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!isComplete) return;
    
    setLoading(true);
    try {
      const idempotencyKey = `${tournamentId}-${round}-${Date.now()}`;
      
      await api(`/api/tournaments/${tournamentId}/advance/confirm`, {
        method: "POST",
        body: JSON.stringify({ 
          round, 
          winners: selectedWinners,
          idempotencyKey
        })
      });

      // Confetti effect
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });

      toast.success(`המנצחים הועלו לשלב ${roundInfo.to} בהצלחה!`, {
        duration: 4000,
        action: {
          label: "Undo",
          onClick: () => handleUndo(idempotencyKey)
        }
      });

      // Enable undo for 30 seconds
      setCanUndo(true);
      const timeout = setTimeout(() => {
        setCanUndo(false);
      }, 30000);
      setUndoTimeout(timeout);

      setShowPreview(false);
      onAdvanceComplete();
    } catch (error) {
      toast.error("שגיאה בהעלאת המנצחים");
      console.error("Confirm error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUndo = async (idempotencyKey: string) => {
    if (!canUndo) return;
    
    try {
      await api(`/api/tournaments/${tournamentId}/advance/revert`, {
        method: "POST",
        body: JSON.stringify({ idempotencyKey })
      });

      toast.success("הפעולה בוטלה בהצלחה!");
      setCanUndo(false);
      if (undoTimeout) clearTimeout(undoTimeout);
    } catch (error) {
      toast.error("שגיאה בביטול הפעולה");
      console.error("Undo error:", error);
    }
  };

  const getButtonState = () => {
    if (isDisabled) return { state: "disabled", text: "שלב זה הופעל כבר" };
    if (expectedWinners === 0) return { state: "disabled", text: "אין משחקים מוכנים" };
    if (selectedCount === 0) return { state: "disabled", text: "בחר מנצחים" };
    if (selectedCount < expectedWinners) return { state: "partial", text: `נבחרו ${selectedCount}/${expectedWinners}` };
    return { state: "ready", text: `מוכן: ${selectedCount}/${expectedWinners}` };
  };

  const buttonState = getButtonState();

  return (
    <div className="space-y-4">
      {/* Badge showing selection status */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
          buttonState.state === "ready" 
            ? "bg-green-100 text-green-800 border border-green-200" 
            : buttonState.state === "partial"
            ? "bg-yellow-100 text-yellow-800 border border-yellow-200"
            : "bg-gray-100 text-gray-600 border border-gray-200"
        }`}
      >
        <span className="mr-2">
          {buttonState.state === "ready" ? "✓" : 
           buttonState.state === "partial" ? "⚠" : "○"}
        </span>
        {buttonState.text}
      </motion.div>

      {/* Auto-select button */}
      {expectedWinners > 0 && selectedCount < expectedWinners && (
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={autoSelectWinners}
          className="px-4 py-2 text-sm bg-blue-100 text-blue-800 rounded-lg hover:bg-blue-200 transition-colors"
        >
          🎯 בחר מנצחים אוטומטית
        </motion.button>
      )}

      {/* Winner selection grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <AnimatePresence>
          {matches.map((match, index) => {
            const winner = getMatchWinner(match);
            const isSelected = selectedWinners.includes(winner || "");
            const homePlayer = getPlayerById(match.homeId);
            const awayPlayer = getPlayerById(match.awayId);

            return (
              <motion.div
                key={match.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={`p-4 rounded-lg border-2 transition-all cursor-pointer ${
                  isSelected 
                    ? "border-green-500 bg-green-50" 
                    : "border-gray-200 bg-white hover:border-gray-300"
                }`}
                onClick={() => winner && handleWinnerSelect(winner)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">
                      {homePlayer?.psn || "Unknown"} vs {awayPlayer?.psn || "Unknown"}
                    </div>
                    <div className="text-lg font-bold text-gray-700">
                      {match.homeScore}:{match.awayScore}
                    </div>
                    {winner && (
                      <div className="text-sm text-gray-600">
                        מנצח: {getPlayerById(winner)?.psn || "Unknown"}
                      </div>
                    )}
                  </div>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    isSelected ? "bg-green-500 text-white" : "bg-gray-200 text-gray-400"
                  }`}>
                    {isSelected ? "✓" : "○"}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Action buttons */}
      <div className="flex gap-3">
        <motion.button
          whileHover={{ scale: buttonState.state === "ready" ? 1.05 : 1 }}
          whileTap={{ scale: buttonState.state === "ready" ? 0.95 : 1 }}
          onClick={handlePreview}
          disabled={buttonState.state !== "ready" || loading}
          className={`flex-1 py-3 px-6 rounded-lg font-medium transition-all ${
            buttonState.state === "ready"
              ? "bg-blue-600 text-white hover:bg-blue-700 shadow-lg"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
          }`}
        >
          {loading ? "טוען..." : `תצוגה מקדימה → ${roundInfo.to}`}
        </motion.button>
      </div>

      {/* Preview Modal */}
      <AdvancePreviewModal
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        onConfirm={handleConfirm}
        tournamentId={tournamentId}
        round={round}
        winners={selectedWinners}
        players={players}
        loading={loading}
      />
    </div>
  );
}
