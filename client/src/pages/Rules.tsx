import React from "react";
import { Link } from "react-router-dom";

export default function Rules() {
  return (
    <div style={{
      minHeight: "100vh",
      padding: 24,
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
    }}>
      <div style={{
        maxWidth: 900,
        margin: "0 auto",
        backgroundColor: "#fff",
        borderRadius: 20,
        padding: 40,
        boxShadow: "0 20px 60px rgba(0, 0, 0, 0.2)"
      }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>📋</div>
          <h1 style={{ fontSize: 36, fontWeight: 800, color: "#333", margin: 0 }}>
            תקנון משחק ושימוש
          </h1>
          <p style={{ fontSize: 16, color: "#666", marginTop: 12 }}>
            FC Masters Cup • PS5 • FC25/FC26
          </p>
        </div>

        <div style={{ direction: "rtl", lineHeight: 1.8 }}>
          {/* כללי */}
          <section style={{ marginBottom: 40 }}>
            <h2 style={{
              fontSize: 28,
              fontWeight: 700,
              color: "#667eea",
              marginBottom: 20,
              paddingBottom: 12,
              borderBottom: "3px solid #667eea"
            }}>
              1️⃣ כללי
            </h2>
            <ul style={{ fontSize: 16, color: "#333", paddingRight: 20 }}>
              <li style={{ marginBottom: 12 }}>
                הטורניר פתוח לכל השחקנים שנרשמו לאתר ואושרו על ידי הנהלת הטורניר.
              </li>
              <li style={{ marginBottom: 12 }}>
                הטורניר מתקיים על קונסולת <strong>PS5</strong> בלבד.
              </li>
              <li style={{ marginBottom: 12 }}>
                המשחקים הרשמיים: <strong>FC25</strong> ו-<strong>FC26</strong>.
              </li>
              <li style={{ marginBottom: 12 }}>
                הטורניר מורכב מ-16 שחקנים בפורמט נוקאאוט (הפסד = הדחה).
              </li>
            </ul>
          </section>

          {/* הרשמה והשתתפות */}
          <section style={{ marginBottom: 40 }}>
            <h2 style={{
              fontSize: 28,
              fontWeight: 700,
              color: "#667eea",
              marginBottom: 20,
              paddingBottom: 12,
              borderBottom: "3px solid #667eea"
            }}>
              2️⃣ הרשמה והשתתפות
            </h2>
            <ul style={{ fontSize: 16, color: "#333", paddingRight: 20 }}>
              <li style={{ marginBottom: 12 }}>
                על השחקן להירשם דרך האתר ולספק כתובת אימייל תקפה.
              </li>
              <li style={{ marginBottom: 12 }}>
                לאחר ההרשמה, השחקן יקבל מייל אישור עם פרטים נוספים.
              </li>
              <li style={{ marginBottom: 12 }}>
                ההשתתפות בטורניר כפופה לתשלום דמי רשום (אם קיימים).
              </li>
              <li style={{ marginBottom: 12 }}>
                שחקן שזכה בפרס שני בטורניר קודם יקבל זיכוי אוטומטי לטורניר הבא.
              </li>
            </ul>
          </section>

          {/* חוקי המשחק */}
          <section style={{ marginBottom: 40 }}>
            <h2 style={{
              fontSize: 28,
              fontWeight: 700,
              color: "#667eea",
              marginBottom: 20,
              paddingBottom: 12,
              borderBottom: "3px solid #667eea"
            }}>
              3️⃣ חוקי המשחק
            </h2>
            <ul style={{ fontSize: 16, color: "#333", paddingRight: 20 }}>
              <li style={{ marginBottom: 12 }}>
                כל משחק מתקיים במתכונת <strong>משחק יחיד (1v1)</strong>.
              </li>
              <li style={{ marginBottom: 12 }}>
                משך המשחק: <strong>2 מחצית של 6 דקות</strong> (12 דקות סה"כ).
              </li>
              <li style={{ marginBottom: 12 }}>
                בקרת שחקן: בהתאם להגדרות ברירת המחדל של המשחק.
              </li>
              <li style={{ marginBottom: 12 }}>
                אסור להשתמש בקבוצות Ultimate Team - רק קבוצות רגילות.
              </li>
              <li style={{ marginBottom: 12 }}>
                במקרה של תיקו, יתקיים <strong>הארכה ובעיטות עונשין</strong> עד לקביעת מנצח.
              </li>
            </ul>
          </section>

          {/* הגשת תוצאות */}
          <section style={{ marginBottom: 40 }}>
            <h2 style={{
              fontSize: 28,
              fontWeight: 700,
              color: "#ff9800",
              marginBottom: 20,
              paddingBottom: 12,
              borderBottom: "3px solid #ff9800"
            }}>
              4️⃣ הגשת תוצאות והוכחות - חשוב במיוחד! ⚠️
            </h2>
            <div style={{
              background: "#fff3e0",
              padding: 20,
              borderRadius: 12,
              border: "2px solid #ff9800",
              marginBottom: 20
            }}>
              <p style={{ fontSize: 18, fontWeight: 700, color: "#e65100", margin: 0 }}>
                חובה להעלות וידאו של המחצית השנייה!
              </p>
            </div>
            <ul style={{ fontSize: 16, color: "#333", paddingRight: 20 }}>
              <li style={{ marginBottom: 12 }}>
                לאחר כל משחק, <strong>שני השחקנים</strong> חייבים להגיש את התוצאה דרך האתר.
              </li>
              <li style={{ marginBottom: 12 }}>
                <strong style={{ color: "#e65100" }}>חובה להעלות וידאו של המחצית השנייה של המשחק</strong> כהוכחה לתוצאה.
              </li>
              <li style={{ marginBottom: 12 }}>
                הוידאו חייב להיות <strong>רציף וללא עריכה</strong>, ולהראות את התוצאה הסופית בבירור.
              </li>
              <li style={{ marginBottom: 12 }}>
                פורמטים מקובלים: MP4, MOV, AVI. גודל מקסימלי: 500MB.
              </li>
              <li style={{ marginBottom: 12 }}>
                <strong style={{ color: "#c62828" }}>שחקן שלא יעלה וידאו יודח מהטורניר ללא החזר כספי!</strong>
              </li>
              <li style={{ marginBottom: 12 }}>
                במקרה של אי התאמה בתוצאות, הנהלת הטורניר תבדק את הוידאו ותכריע.
              </li>
            </ul>
          </section>

          {/* מחלוקות */}
          <section style={{ marginBottom: 40 }}>
            <h2 style={{
              fontSize: 28,
              fontWeight: 700,
              color: "#667eea",
              marginBottom: 20,
              paddingBottom: 12,
              borderBottom: "3px solid #667eea"
            }}>
              5️⃣ מחלוקות ובוררות
            </h2>
            <ul style={{ fontSize: 16, color: "#333", paddingRight: 20 }}>
              <li style={{ marginBottom: 12 }}>
                במקרה של מחלוקת בנוגע לתוצאה, יש להעלות תלונה דרך מערכת המחלוקות באתר.
              </li>
              <li style={{ marginBottom: 12 }}>
                הנהלת הטורניר תבדוק את הוידאו שהועלה ותכריע תוך 48 שעות.
              </li>
              <li style={{ marginBottom: 12 }}>
                החלטת הנהלת הטורניר היא סופית ומחייבת.
              </li>
              <li style={{ marginBottom: 12 }}>
                שחקן שיוכח שהעלה וידאו מזויף או ערוך יודח מהטורניר ויושעה לצמיתות.
              </li>
            </ul>
          </section>

          {/* פרסים */}
          <section style={{ marginBottom: 40 }}>
            <h2 style={{
              fontSize: 28,
              fontWeight: 700,
              color: "#667eea",
              marginBottom: 20,
              paddingBottom: 12,
              borderBottom: "3px solid #667eea"
            }}>
              6️⃣ פרסים
            </h2>
            <ul style={{ fontSize: 16, color: "#333", paddingRight: 20 }}>
              <li style={{ marginBottom: 12 }}>
                <strong>פרס ראשון:</strong> סכום הפרס יוגדר בתחילת כל טורניר (בדרך כלל 1,000 ₪).
              </li>
              <li style={{ marginBottom: 12 }}>
                <strong>פרס שני:</strong> סכום הפרס יוגדר בתחילת כל טורניר (בדרך כלל 500 ₪).
              </li>
              <li style={{ marginBottom: 12 }}>
                זוכה בפרס שני יקבל זיכוי של 60 ₪ לטורניר הבא.
              </li>
              <li style={{ marginBottom: 12 }}>
                הפרסים ישולמו תוך 7 ימי עסקים לאחר סיום הטורניר.
              </li>
            </ul>
          </section>

          {/* התנהגות ספורטיבית */}
          <section style={{ marginBottom: 40 }}>
            <h2 style={{
              fontSize: 28,
              fontWeight: 700,
              color: "#667eea",
              marginBottom: 20,
              paddingBottom: 12,
              borderBottom: "3px solid #667eea"
            }}>
              7️⃣ התנהגות ספורטיבית
            </h2>
            <ul style={{ fontSize: 16, color: "#333", paddingRight: 20 }}>
              <li style={{ marginBottom: 12 }}>
                אסורה כל התנהגות לא ספורטיבית, כולל קללות, העלבות או הטרדות.
              </li>
              <li style={{ marginBottom: 12 }}>
                אסור להשתמש בתוכנות עזר, צ'יטים או כל אמצעי לא הוגן אחר.
              </li>
              <li style={{ marginBottom: 12 }}>
                הפרת הכללים תגרור להשעיה מידית והדחה מהטורניר.
              </li>
              <li style={{ marginBottom: 12 }}>
                הנהלת הטורניר שומרת לעצמה את הזכות להרחיק שחקן מהטורניר בכל עת.
              </li>
            </ul>
          </section>

          {/* תנאי שימוש באתר */}
          <section style={{ marginBottom: 40 }}>
            <h2 style={{
              fontSize: 28,
              fontWeight: 700,
              color: "#667eea",
              marginBottom: 20,
              paddingBottom: 12,
              borderBottom: "3px solid #667eea"
            }}>
              8️⃣ תנאי שימוש באתר
            </h2>
            <ul style={{ fontSize: 16, color: "#333", paddingRight: 20 }}>
              <li style={{ marginBottom: 12 }}>
                המשתמש מתחייב לשמור על סודיות פרטי ההתחברות שלו.
              </li>
              <li style={{ marginBottom: 12 }}>
                אסור לשתף חשבון עם משתמשים אחרים.
              </li>
              <li style={{ marginBottom: 12 }}>
                הנהלת האתר אינה אחראית לאובדן מידע או נזקים שייגרמו מהשימוש באתר.
              </li>
              <li style={{ marginBottom: 12 }}>
                הנהלת האתר שומרת את הזכות לשנות את התקנון בכל עת.
              </li>
            </ul>
          </section>

          {/* יצירת קשר */}
          <section style={{
            background: "linear-gradient(135deg, #e3f2fd 0%, #fff 100%)",
            padding: 24,
            borderRadius: 12,
            border: "2px solid #2196F3"
          }}>
            <h2 style={{
              fontSize: 24,
              fontWeight: 700,
              color: "#1976D2",
              marginBottom: 16
            }}>
              📞 יצירת קשר
            </h2>
            <p style={{ fontSize: 16, color: "#1565C0", marginBottom: 12 }}>
              לשאלות, הבהרות או בעיות טכניות, ניתן לפנות אלינו:
            </p>
            <ul style={{ fontSize: 15, color: "#1565C0", paddingRight: 20 }}>
              <li>דרך קבוצת הטלגרם הרשמית של הטורניר</li>
              <li>דרך מערכת המחלוקות באתר</li>
              <li>במייל הרשום באתר</li>
            </ul>
          </section>
        </div>

        <div style={{
          marginTop: 40,
          paddingTop: 24,
          borderTop: "2px solid #f0f0f0",
          textAlign: "center"
        }}>
          <p style={{ fontSize: 14, color: "#999", marginBottom: 20 }}>
            בהצלחה בטורנירים! 🏆⚽
          </p>
          <Link
            to="/"
            style={{
              display: "inline-block",
              padding: "14px 32px",
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              color: "#fff",
              textDecoration: "none",
              borderRadius: 10,
              fontWeight: 700,
              fontSize: 16,
              boxShadow: "0 4px 15px rgba(102, 126, 234, 0.4)"
            }}
          >
            חזור לדף הבית
          </Link>
        </div>
      </div>
    </div>
  );
}

