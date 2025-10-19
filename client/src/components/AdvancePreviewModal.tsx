import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { api } from "../api";

interface Player {
  id: string;
  psn: string;
  displayName: string;
  email?: string;
}

interface SeedPlayer extends Player {
  seed: number;
}

interface AdvancePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  tournamentId: string;
  round: "R16" | "QF" | "SF";
  winners: string[];
  players: Player[];
  loading: boolean;
}

export default function AdvancePreviewModal({
  isOpen,
  onClose,
  onConfirm,
  tournamentId,
  round,
  winners,
  players,
  loading
}: AdvancePreviewModalProps) {
  const [seededPlayers, setSeededPlayers] = useState<SeedPlayer[]>([]);
  const [previewMatches, setPreviewMatches] = useState<any[]>([]);
  const [previewLoading, setPreviewLoading] = useState(false);

  const roundNames = {
    R16: { from: "שמינית הגמר", to: "רבע גמר" },
    QF: { from: "רבע גמר", to: "חצי גמר" },
    SF: { from: "חצי גמר", to: "גמר" }
  };

  const roundInfo = roundNames[round];

  useEffect(() => {
    if (isOpen && winners.length > 0) {
      initializeSeeds();
      generatePreview();
    }
  }, [isOpen, winners]);

  const initializeSeeds = () => {
    const winnerPlayers = players.filter(p => winners.includes(p.id));
    const seeded = winnerPlayers.map((player, index) => ({
      ...player,
      seed: index + 1
    }));
    setSeededPlayers(seeded);
  };

  const generatePreview = async () => {
    setPreviewLoading(true);
    try {
      const response = await api(`/api/tournaments/${tournamentId}/advance/preview`, {
        method: "POST",
        body: JSON.stringify({
          round,
          winners: seededPlayers.map(p => p.id),
          seeds: seededPlayers.map(p => ({ id: p.id, seed: p.seed }))
        })
      });
      setPreviewMatches(response.matches || []);
    } catch (error) {
      console.error("Preview generation error:", error);
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const items = Array.from(seededPlayers);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update seeds
    const updatedItems = items.map((item, index) => ({
      ...item,
      seed: index + 1
    }));

    setSeededPlayers(updatedItems);
  };

  const getPlayerById = (id: string) => players.find(p => p.id === id);

  const getPlayerAvatar = (player: Player) => {
    // Generate avatar based on player name
    const initials = player.psn?.substring(0, 2).toUpperCase() || "??";
    const colors = [
      "bg-red-500", "bg-blue-500", "bg-green-500", "bg-yellow-500",
      "bg-purple-500", "bg-pink-500", "bg-indigo-500", "bg-teal-500"
    ];
    const colorIndex = player.psn?.charCodeAt(0) % colors.length || 0;
    
    return (
      <div className={`w-10 h-10 rounded-full ${colors[colorIndex]} flex items-center justify-center text-white font-bold text-sm`}>
        {initials}
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">תצוגה מקדימה - העלאת מנצחים</h2>
                <p className="text-blue-100 mt-1">
                  {roundInfo.from} → {roundInfo.to}
                </p>
              </div>
              <button
                onClick={onClose}
                className="text-white hover:text-gray-200 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
            {/* Seed Management */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                🎯 ניהול שיבוץ (Drag & Drop)
                <span className="ml-2 text-sm text-gray-500">
                  ({seededPlayers.length} שחקנים)
                </span>
              </h3>
              
              <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="seeds">
                  {(provided, snapshot) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className={`space-y-2 min-h-[200px] p-4 rounded-lg border-2 border-dashed ${
                        snapshot.isDraggingOver ? "border-blue-400 bg-blue-50" : "border-gray-200"
                      }`}
                    >
                      {seededPlayers.map((player, index) => (
                        <Draggable key={player.id} draggableId={player.id} index={index}>
                          {(provided, snapshot) => (
                            <motion.div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`bg-white rounded-lg p-4 shadow-sm border ${
                                snapshot.isDragging ? "shadow-lg rotate-2" : "hover:shadow-md"
                              } transition-all`}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                  {getPlayerAvatar(player)}
                                  <div>
                                    <div className="font-medium text-gray-900">
                                      {player.psn}
                                    </div>
                                    <div className="text-sm text-gray-500">
                                      {player.displayName}
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-3">
                                  <span className="text-sm text-gray-500">
                                    Seed #{player.seed}
                                  </span>
                                  <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center">
                                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                                    </svg>
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
            </div>

            {/* Preview Matches */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                ⚽ תצוגה מקדימה של משחקים
                {previewLoading && <span className="ml-2 text-sm text-gray-500">(טוען...)</span>}
              </h3>
              
              {previewLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {previewMatches.map((match, index) => {
                    const homePlayer = getPlayerById(match.homeId);
                    const awayPlayer = getPlayerById(match.awayId);
                    
                    return (
                      <motion.div
                        key={match.id || index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                      >
                        <div className="text-center">
                          <div className="text-sm text-gray-600 mb-2">
                            משחק #{index + 1}
                          </div>
                          <div className="flex items-center justify-center space-x-4">
                            <div className="text-center">
                              {getPlayerAvatar(homePlayer || { id: "", psn: "Unknown" })}
                              <div className="text-sm font-medium mt-1">
                                {homePlayer?.psn || "Unknown"}
                              </div>
                            </div>
                            <div className="text-2xl font-bold text-gray-400">VS</div>
                            <div className="text-center">
                              {getPlayerAvatar(awayPlayer || { id: "", psn: "Unknown" })}
                              <div className="text-sm font-medium mt-1">
                                {awayPlayer?.psn || "Unknown"}
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Guard Messages */}
            <div className="mb-6">
              <AnimatePresence>
                {seededPlayers.length === 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-red-50 border border-red-200 rounded-lg p-4"
                  >
                    <div className="flex items-center">
                      <svg className="w-5 h-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                      <span className="text-red-800 font-medium">
                        לא ניתן להמשיך: אין שחקנים נבחרים
                      </span>
                    </div>
                  </motion.div>
                )}
                
                {seededPlayers.length > 0 && seededPlayers.length % 2 !== 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-yellow-50 border border-yellow-200 rounded-lg p-4"
                  >
                    <div className="flex items-center">
                      <svg className="w-5 h-5 text-yellow-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                      <span className="text-yellow-800 font-medium">
                        לא ניתן להמשיך: מספר שחקנים לא זוגי
                      </span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-4 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {seededPlayers.length} שחקנים נבחרו • {previewMatches.length} משחקים ייווצרו
            </div>
            <div className="flex space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                ביטול
              </button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onConfirm}
                disabled={loading || seededPlayers.length === 0 || seededPlayers.length % 2 !== 0}
                className={`px-6 py-2 rounded-lg font-medium transition-all ${
                  loading || seededPlayers.length === 0 || seededPlayers.length % 2 !== 0
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-green-600 text-white hover:bg-green-700 shadow-lg"
                }`}
              >
                {loading ? "מאשר..." : "אשר העלאה"}
              </motion.button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
