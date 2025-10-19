import React, { useState, useRef } from "react";
import { api } from "../api";
import "../styles/championsLeague.css";

interface ProofUploaderProps {
  matchId: string;
  match: {
    id: string;
    round: string;
    homePsn: string;
    awayPsn: string;
    homeScore: number | null;
    awayScore: number | null;
    status: string;
    isMyMatch: boolean;
    myRole?: "home" | "away";
  };
  onUploadSuccess?: () => void;
  isMobile: boolean;
}

export default function ProofUploader({ matchId, match, onUploadSuccess, isMobile }: ProofUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    
    if (selectedFile) {
      // בדיקת סוג קובץ
      if (!selectedFile.type.startsWith("image/")) {
        setError("רק קבצי תמונה מותרים (JPG, PNG, WEBP)");
        return;
      }
      
      // בדיקת גודל קובץ (מקסימום 10MB)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (selectedFile.size > maxSize) {
        setError("גודל הקובץ חורג מ-10MB. אנא הקטן את הקובץ ונסה שנית.");
        return;
      }
      
      setFile(selectedFile);
      setError(null);
      
      // יצירת תצוגה מקדימה
      const reader = new FileReader();
      reader.onload = (event) => {
        setPreview(event.target?.result as string);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const clearFile = () => {
    setFile(null);
    setPreview(null);
    setError(null);
    setSuccess(false);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const uploadProof = async () => {
    if (!file) {
      setError("יש לבחור תמונה לפני העלאה");
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("proof", file);
      formData.append("matchId", matchId);
      formData.append("playerRole", match.myRole || "");

      const response = await fetch("/api/matches/proof", {
        method: "POST",
        body: formData,
        credentials: "include"
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "שגיאה בהעלאת התמונה");
      }

      const result = await response.json();
      setSuccess(true);
      
      if (onUploadSuccess) {
        onUploadSuccess();
      }
      
      // איפוס הטופס אחרי 3 שניות
      setTimeout(() => {
        clearFile();
      }, 3000);

    } catch (err) {
      setError(err instanceof Error ? err.message : "שגיאה בהעלאת התמונה");
    } finally {
      setUploading(false);
    }
  };

  const getRoundName = (round: string) => {
    switch (round) {
      case 'R16': return 'שמינית גמר';
      case 'QF': return 'רבע גמר';
      case 'SF': return 'חצי גמר';
      case 'F': return 'גמר';
      default: return round;
    }
  };

  return (
    <div className="champions-league-match-card" style={{
      padding: isMobile ? 20 : 24,
      marginBottom: 16
    }}>
      <h3 className="champions-league-title" style={{
        fontSize: isMobile ? 18 : 24,
        marginBottom: 16,
        textAlign: "center"
      }}>
        📸 העלאת הוכחת תוצאה
      </h3>
      
      <div style={{
        fontSize: isMobile ? 14 : 16,
        color: "#666",
        textAlign: "center",
        marginBottom: 20,
        lineHeight: 1.5
      }}>
        {getRoundName(match.round)}: {match.homePsn} vs {match.awayPsn}
        <br />
        {match.homeScore !== null && match.awayScore !== null 
          ? `תוצאה: ${match.homeScore}:${match.awayScore}`
          : "טרם שוחק"
        }
      </div>

      {/* אזור העלאה */}
      <div style={{
        border: success ? "3px solid #28a745" : error ? "3px solid #dc3545" : "3px dashed #FFD700",
        borderRadius: 15,
        padding: isMobile ? 16 : 20,
        textAlign: "center",
        background: success 
          ? "linear-gradient(135deg, rgba(40, 167, 69, 0.1) 0%, rgba(32, 201, 151, 0.1) 100%)"
          : error 
            ? "linear-gradient(135deg, rgba(220, 53, 69, 0.1) 0%, rgba(232, 62, 140, 0.1) 100%)"
            : "linear-gradient(135deg, rgba(255, 215, 0, 0.1) 0%, rgba(255, 165, 0, 0.1) 100%)",
        marginBottom: 16
      }}>
        {success ? (
          <div>
            <div style={{ fontSize: isMobile ? 32 : 48, marginBottom: 12 }}>✅</div>
            <div className="champions-league-player-name" style={{
              fontSize: isMobile ? 16 : 18,
              color: "#28a745",
              fontWeight: 700
            }}>
              התמונה הועלתה בהצלחה!
            </div>
          </div>
        ) : (
          <>
            <div style={{ fontSize: isMobile ? 32 : 48, marginBottom: 12 }}>📷</div>
            <div className="champions-league-player-name" style={{
              fontSize: isMobile ? 16 : 18,
              marginBottom: 12
            }}>
              {file ? "תמונה נבחרה" : "לחץ לבחירת תמונה"}
            </div>
            
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              style={{ display: "none" }}
            />
            
            <button
              onClick={() => inputRef.current?.click()}
              className="champions-league-refresh-button"
              style={{
                padding: isMobile ? "12px 20px" : "15px 30px",
                borderRadius: 30,
                fontSize: isMobile ? 14 : 16,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 10,
                margin: "0 auto 16px"
              }}
            >
              📁 {file ? "בחר תמונה אחרת" : "בחר תמונה"}
            </button>
          </>
        )}
      </div>

      {/* תצוגה מקדימה */}
      {preview && !success && (
        <div style={{
          marginBottom: 16,
          textAlign: "center"
        }}>
          <img
            src={preview}
            alt="תצוגה מקדימה"
            style={{
              maxWidth: "100%",
              maxHeight: isMobile ? 200 : 300,
              borderRadius: 12,
              border: "3px solid #FFD700",
              boxShadow: "0 8px 24px rgba(0, 0, 0, 0.2)"
            }}
          />
          
          {file && (
            <div style={{
              marginTop: 12,
              fontSize: isMobile ? 12 : 14,
              color: "#666"
            }}>
              {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
            </div>
          )}
        </div>
      )}

      {/* הודעות שגיאה */}
      {error && (
        <div style={{
          background: "rgba(220, 53, 69, 0.1)",
          border: "2px solid #dc3545",
          borderRadius: 12,
          padding: isMobile ? 12 : 16,
          marginBottom: 16,
          textAlign: "center"
        }}>
          <div style={{ color: "#dc3545", fontWeight: 600 }}>
            ⚠️ {error}
          </div>
        </div>
      )}

      {/* כפתורי פעולה */}
      {file && !success && (
        <div style={{
          display: "flex",
          gap: 12,
          justifyContent: "center"
        }}>
          <button
            onClick={uploadProof}
            disabled={uploading}
            className="champions-league-refresh-button"
            style={{
              padding: isMobile ? "12px 24px" : "15px 30px",
              borderRadius: 30,
              fontSize: isMobile ? 14 : 16,
              cursor: uploading ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              gap: 10,
              opacity: uploading ? 0.7 : 1
            }}
          >
            {uploading ? "⏳ מעלה..." : "🚀 העלה תמונה"}
          </button>
          
          <button
            onClick={clearFile}
            disabled={uploading}
            style={{
              padding: isMobile ? "12px 20px" : "15px 24px",
              borderRadius: 30,
              fontSize: isMobile ? 14 : 16,
              cursor: uploading ? "not-allowed" : "pointer",
              background: "linear-gradient(135deg, #6c757d 0%, #495057 100%)",
              color: "#fff",
              border: "none",
              fontWeight: 700,
              opacity: uploading ? 0.7 : 1
            }}
          >
            ❌ ביטול
          </button>
        </div>
      )}

      {/* הוראות */}
      <div style={{
        marginTop: 16,
        padding: isMobile ? 12 : 16,
        background: "rgba(0, 123, 255, 0.1)",
        borderRadius: 12,
        border: "2px solid #007BFF"
      }}>
        <div style={{
          fontSize: isMobile ? 12 : 14,
          color: "#007BFF",
          textAlign: "center",
          lineHeight: 1.5
        }}>
          📋 <strong>הוראות:</strong>
          <br />
          • העלה צילום מסך של תוצאת המשחק
          <br />
          • התמונה צריכה להיות ברורה וקריאה
          <br />
          • גודל מקסימלי: 10MB
          <br />
          • פורמטים מותרים: JPG, PNG, WEBP
        </div>
      </div>
    </div>
  );
}
