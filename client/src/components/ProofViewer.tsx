import React, { useState, useEffect } from "react";
import { api } from "../api";

interface ProofViewerProps {
  matchId: string;
  homePlayer: string;
  awayPlayer: string;
}

interface ProofData {
  matchId: string;
  evidenceHome: string | null;
  evidenceAway: string | null;
}

export default function ProofViewer({ matchId, homePlayer, awayPlayer }: ProofViewerProps) {
  const [proofs, setProofs] = useState<ProofData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedProof, setSelectedProof] = useState<string | null>(null);

  useEffect(() => {
    loadProofs();
  }, [matchId]);

  const loadProofs = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api(`/api/matches/${matchId}/proofs`);
      setProofs(data);
    } catch (err) {
      setError("שגיאה בטעינת תמונות ההוכחה");
      console.error("Failed to load proofs:", err);
    } finally {
      setLoading(false);
    }
  };

  const getProofUrl = (proofPath: string | null) => {
    if (!proofPath) return null;
    return `/uploads/${proofPath.split('/').pop()}`;
  };

  const openProofModal = (proofPath: string) => {
    setSelectedProof(proofPath);
  };

  const closeProofModal = () => {
    setSelectedProof(null);
  };

  if (loading) {
    return (
      <div style={{
        padding: 20,
        textAlign: "center",
        background: "rgba(0, 123, 255, 0.1)",
        borderRadius: 12,
        border: "2px solid #007BFF"
      }}>
        <div style={{ fontSize: 16, color: "#007BFF" }}>⏳ טוען תמונות הוכחה...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        padding: 20,
        textAlign: "center",
        background: "rgba(220, 53, 69, 0.1)",
        borderRadius: 12,
        border: "2px solid #dc3545"
      }}>
        <div style={{ fontSize: 16, color: "#dc3545" }}>⚠️ {error}</div>
      </div>
    );
  }

  if (!proofs || (!proofs.evidenceHome && !proofs.evidenceAway)) {
    return (
      <div style={{
        padding: 20,
        textAlign: "center",
        background: "rgba(255, 193, 7, 0.1)",
        borderRadius: 12,
        border: "2px solid #ffc107"
      }}>
        <div style={{ fontSize: 16, color: "#ffc107" }}>📸 לא הועלו תמונות הוכחה עדיין</div>
      </div>
    );
  }

  return (
    <div style={{
      padding: 20,
      background: "linear-gradient(135deg, rgba(255, 215, 0, 0.1) 0%, rgba(255, 165, 0, 0.1) 100%)",
      borderRadius: 12,
      border: "2px solid #FFD700",
      marginBottom: 16
    }}>
      <h4 style={{
        fontSize: 18,
        fontWeight: 700,
        color: "#333",
        marginBottom: 16,
        textAlign: "center"
      }}>
        📸 תמונות הוכחת תוצאה
      </h4>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
        gap: 16
      }}>
        {/* תמונת שחקן בית */}
        {proofs.evidenceHome && (
          <div style={{
            textAlign: "center",
            padding: 16,
            background: "rgba(0, 123, 255, 0.1)",
            borderRadius: 12,
            border: "2px solid #007BFF"
          }}>
            <div style={{
              fontSize: 14,
              fontWeight: 600,
              color: "#007BFF",
              marginBottom: 12
            }}>
              🏠 {homePlayer}
            </div>
            
            <div
              style={{
                cursor: "pointer",
                borderRadius: 8,
                overflow: "hidden",
                border: "2px solid #007BFF",
                transition: "transform 0.2s"
              }}
              onClick={() => openProofModal(proofs.evidenceHome!)}
              onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.05)"}
              onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
            >
              <img
                src={getProofUrl(proofs.evidenceHome)!}
                alt={`הוכחה של ${homePlayer}`}
                style={{
                  width: "100%",
                  height: 150,
                  objectFit: "cover"
                }}
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                  e.currentTarget.nextElementSibling!.style.display = "flex";
                }}
              />
              <div
                style={{
                  width: "100%",
                  height: 150,
                  background: "#f8f9fa",
                  display: "none",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 14,
                  color: "#666"
                }}
              >
                ❌ שגיאה בטעינת התמונה
              </div>
            </div>
            
            <button
              onClick={() => openProofModal(proofs.evidenceHome!)}
              style={{
                marginTop: 8,
                padding: "6px 12px",
                background: "linear-gradient(135deg, #007BFF 0%, #0056b3 100%)",
                color: "#fff",
                border: "none",
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer"
              }}
            >
              🔍 הגדל
            </button>
          </div>
        )}

        {/* תמונת שחקן אורח */}
        {proofs.evidenceAway && (
          <div style={{
            textAlign: "center",
            padding: 16,
            background: "rgba(220, 53, 69, 0.1)",
            borderRadius: 12,
            border: "2px solid #DC3545"
          }}>
            <div style={{
              fontSize: 14,
              fontWeight: 600,
              color: "#DC3545",
              marginBottom: 12
            }}>
              ✈️ {awayPlayer}
            </div>
            
            <div
              style={{
                cursor: "pointer",
                borderRadius: 8,
                overflow: "hidden",
                border: "2px solid #DC3545",
                transition: "transform 0.2s"
              }}
              onClick={() => openProofModal(proofs.evidenceAway!)}
              onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.05)"}
              onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
            >
              <img
                src={getProofUrl(proofs.evidenceAway)!}
                alt={`הוכחה של ${awayPlayer}`}
                style={{
                  width: "100%",
                  height: 150,
                  objectFit: "cover"
                }}
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                  e.currentTarget.nextElementSibling!.style.display = "flex";
                }}
              />
              <div
                style={{
                  width: "100%",
                  height: 150,
                  background: "#f8f9fa",
                  display: "none",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 14,
                  color: "#666"
                }}
              >
                ❌ שגיאה בטעינת התמונה
              </div>
            </div>
            
            <button
              onClick={() => openProofModal(proofs.evidenceAway!)}
              style={{
                marginTop: 8,
                padding: "6px 12px",
                background: "linear-gradient(135deg, #DC3545 0%, #a71e2a 100%)",
                color: "#fff",
                border: "none",
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer"
              }}
            >
              🔍 הגדל
            </button>
          </div>
        )}
      </div>

      {/* Modal להגדלת תמונה */}
      {selectedProof && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background: "rgba(0, 0, 0, 0.8)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: 20
          }}
          onClick={closeProofModal}
        >
          <div
            style={{
              maxWidth: "90%",
              maxHeight: "90%",
              background: "#fff",
              borderRadius: 12,
              padding: 20,
              position: "relative"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={closeProofModal}
              style={{
                position: "absolute",
                top: 10,
                right: 10,
                background: "#dc3545",
                color: "#fff",
                border: "none",
                borderRadius: "50%",
                width: 30,
                height: 30,
                cursor: "pointer",
                fontSize: 16,
                fontWeight: "bold"
              }}
            >
              ×
            </button>
            
            <img
              src={getProofUrl(selectedProof)!}
              alt="תמונת הוכחה"
              style={{
                maxWidth: "100%",
                maxHeight: "100%",
                borderRadius: 8
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
