import React, { useState, useRef } from "react";

interface UploaderProps {
  onFileSelect: (file: File | null) => void;
  accept?: string;
  label?: string;
  required?: boolean;
}

export default function Uploader({ 
  onFileSelect, 
  accept = "image/*", 
  label = "העלה צילום מסך",
  required = false 
}: UploaderProps) {
  const [fileName, setFileName] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    
    if (file) {
      setFileName(file.name);
      onFileSelect(file);

      // Create preview for images and videos
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (event) => {
          setPreview(event.target?.result as string);
        };
        reader.readAsDataURL(file);
      } else if (file.type.startsWith("video/")) {
        const reader = new FileReader();
        reader.onload = (event) => {
          setPreview(event.target?.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        setPreview(null);
      }
    } else {
      setFileName(null);
      setPreview(null);
      onFileSelect(null);
    }
  };

  const clearFile = () => {
    setFileName(null);
    setPreview(null);
    onFileSelect(null);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  return (
    <div style={{
      border: "3px dashed #e0e0e0",
      borderRadius: 12,
      padding: 20,
      textAlign: "center",
      background: "linear-gradient(135deg, #fafafa 0%, #fff 100%)",
      direction: "rtl",
      transition: "all 0.3s"
    }}
    onMouseEnter={e => e.currentTarget.style.borderColor = "#667eea"}
    onMouseLeave={e => e.currentTarget.style.borderColor = "#e0e0e0"}
    >
      <div style={{ marginBottom: 12 }}>
        <label style={{ 
          fontWeight: 700, 
          fontSize: 15,
          color: "#333"
        }}>
          {label}
          {required && <span style={{ color: "#f44336", marginRight: 4 }}>*</span>}
        </label>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        style={{ display: "none" }}
        id="file-upload"
      />

      {!fileName ? (
        <label
          htmlFor="file-upload"
          style={{
            display: "inline-block",
            padding: "14px 28px",
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            color: "#fff",
            borderRadius: 10,
            cursor: "pointer",
            fontWeight: 700,
            fontSize: 15,
            transition: "all 0.3s",
            boxShadow: "0 4px 15px rgba(102, 126, 234, 0.3)"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.boxShadow = "0 6px 20px rgba(102, 126, 234, 0.4)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "0 4px 15px rgba(102, 126, 234, 0.3)";
          }}
        >
          📁 בחר קובץ
        </label>
      ) : (
        <div>
          <div style={{
            padding: 14,
            background: "#fff",
            border: "2px solid #43e97b",
            borderRadius: 10,
            marginBottom: 12,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            direction: "rtl",
            boxShadow: "0 2px 8px rgba(67, 233, 123, 0.15)"
          }}>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              overflow: "hidden",
              flex: 1
            }}>
              <span style={{ fontSize: 24 }}>✅</span>
              <span style={{
                fontSize: 14,
                fontWeight: 600,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                color: "#333"
              }}>
                {fileName}
              </span>
            </div>
            <button
              onClick={clearFile}
              style={{
                padding: "8px 16px",
                background: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 700,
                boxShadow: "0 2px 8px rgba(250, 112, 154, 0.3)",
                transition: "all 0.2s"
              }}
              onMouseEnter={e => e.currentTarget.style.transform = "scale(1.05)"}
              onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
            >
              ✕ הסר
            </button>
          </div>

          {preview && (
            <div style={{
              marginTop: 12,
              border: "2px solid #e0e0e0",
              borderRadius: 10,
              overflow: "hidden",
              background: "#fff",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)"
            }}>
              {fileName && fileName.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                <img
                  src={preview}
                  alt="תצוגה מקדימה"
                  style={{
                    maxWidth: "100%",
                    maxHeight: 250,
                    display: "block",
                    margin: "0 auto"
                  }}
                />
              ) : fileName && fileName.match(/\.(mp4|mov|avi|webm)$/i) ? (
                <video
                  src={preview}
                  controls
                  style={{
                    maxWidth: "100%",
                    maxHeight: 250,
                    display: "block",
                    margin: "0 auto"
                  }}
                >
                  הדפדפן שלך לא תומך בתצוגת וידאו.
                </video>
              ) : null}
            </div>
          )}
        </div>
      )}

      <div style={{
        marginTop: 12,
        fontSize: 12,
        color: required ? "#c62828" : "#666",
        fontWeight: required ? 700 : 500
      }}>
        {required && accept.includes("video") 
          ? "⚠️ חובה להעלות וידאו של המחצית השנייה! ללא הוכחה תודח מהמשחק!" 
          : required 
          ? "⚠️ חובה להעלות צילום מסך של Match Facts" 
          : "📷 אופציונלי"}
      </div>
    </div>
  );
}
