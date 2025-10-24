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
            תקנון רשמי – טורניר FC25/FC26 לסוני 5
          </h1>
          <p style={{ fontSize: 16, color: "#666", marginTop: 12 }}>
            האתר המארגן: FC Masters Cup • שם האירוע: טורניר FC25/26 לסוני 5
          </p>
          <p style={{ fontSize: 14, color: "#888", marginTop: 8 }}>
            כתובת האתר: www.k-rstudio.com
          </p>
        </div>

        <div style={{ direction: "rtl", lineHeight: 1.8 }}>
          {/* מטרת הטורניר */}
          <section style={{ marginBottom: 40 }}>
            <h2 style={{
              fontSize: 28,
              fontWeight: 700,
              color: "#667eea",
              marginBottom: 20,
              paddingBottom: 12,
              borderBottom: "3px solid #667eea"
            }}>
              1. מטרת הטורניר
            </h2>
            <ul style={{ fontSize: 16, color: "#333", paddingRight: 20 }}>
              <li style={{ marginBottom: 12 }}>
                הטורניר נועד לעודד משחק הוגן ותחרות ספורטיבית בין שחקני FIFA/FC בישראל.
              </li>
              <li style={{ marginBottom: 12 }}>
                הטורניר מבוסס על כישרון וביצועים בלבד — ללא הגרלות, מזל או הימור מכל סוג.
              </li>
            </ul>
          </section>

          {/* דמי הרשמה ופרסים */}
          <section style={{ marginBottom: 40 }}>
            <h2 style={{
              fontSize: 28,
              fontWeight: 700,
              color: "#667eea",
              marginBottom: 20,
              paddingBottom: 12,
              borderBottom: "3px solid #667eea"
            }}>
              2. דמי הרשמה ופרסים
            </h2>
            <ul style={{ fontSize: 16, color: "#333", paddingRight: 20 }}>
              <li style={{ marginBottom: 12 }}>
                דמי ההשתתפות בטורניר: <strong>50 ש"ח למשתתף</strong>, תשלום בביט/פייבוקס.
              </li>
              <li style={{ marginBottom: 12 }}>
                <strong>פרסים:</strong>
                <ul style={{ marginTop: 8, paddingRight: 20 }}>
                  <li style={{ marginBottom: 8 }}>
                    🥇 <strong>מקום ראשון</strong> – 500 ש"ח בהעברה בביט/פייבוקס.
                  </li>
                </ul>
              </li>
              <li style={{ marginBottom: 12 }}>
                דמי ההשתתפות נועדו לכיסוי הוצאות ניהול, פיתוח, תחזוקה שוטפת ופרסים בלבד.
              </li>
            </ul>
          </section>

          {/* אופן ההרשמה */}
          <section style={{ marginBottom: 40 }}>
            <h2 style={{
              fontSize: 28,
              fontWeight: 700,
              color: "#667eea",
              marginBottom: 20,
              paddingBottom: 12,
              borderBottom: "3px solid #667eea"
            }}>
              3. אופן ההרשמה
            </h2>
            <ul style={{ fontSize: 16, color: "#333", paddingRight: 20 }}>
              <li style={{ marginBottom: 12 }}>
                יש להירשם דרך אתר FC Masters Cup.
              </li>
              <li style={{ marginBottom: 12 }}>
                התשלום יתבצע מראש דרך פלטפורמות מאובטחות (לדוגמה: PayBox, Bit).
              </li>
              <li style={{ marginBottom: 12 }}>
                כאשר ירשמו 16 שחקנים, הטורניר ייפתח.
              </li>
              <li style={{ marginBottom: 12 }}>
                לאחר התשלום, המשתתף יקבל אישור הרשמה במייל או בהודעה.
              </li>
            </ul>
          </section>

          {/* מבנה המשחקים */}
          <section style={{ marginBottom: 40 }}>
            <h2 style={{
              fontSize: 28,
              fontWeight: 700,
              color: "#667eea",
              marginBottom: 20,
              paddingBottom: 12,
              borderBottom: "3px solid #667eea"
            }}>
              4. מבנה המשחקים
            </h2>
            <ul style={{ fontSize: 16, color: "#333", paddingRight: 20 }}>
              <li style={{ marginBottom: 12 }}>
                המשחקים יתנהלו בפורמט נוק-אאוט (Knockout) — כל שלב הוא משחק בודד או סדרת משחקים כפי שיוחלט מראש.
              </li>
              <li style={{ marginBottom: 12 }}>
                כל שחקן יקבל יריב בהתאם להגרלה שנעשית על בסיס רשימת המשתתפים בלבד, ללא מרכיב של מזל.
              </li>
              <li style={{ marginBottom: 12 }}>
                הניצחון נקבע לפי תוצאות המשחק בפועל ב־FC25/FC26.
              </li>
              <li style={{ marginBottom: 12 }}>
                במקרה של תוצאה שווה — תתקיים הארכה ו/או דו-קרב פנדלים בהתאם לכללי המשחק.
              </li>
            </ul>
          </section>

          {/* כללי התנהגות */}
          <section style={{ marginBottom: 40 }}>
            <h2 style={{
              fontSize: 28,
              fontWeight: 700,
              color: "#667eea",
              marginBottom: 20,
              paddingBottom: 12,
              borderBottom: "3px solid #667eea"
            }}>
              5. כללי התנהגות
            </h2>
            <ul style={{ fontSize: 16, color: "#333", paddingRight: 20 }}>
              <li style={{ marginBottom: 12 }}>
                כל שחקן מחויב לשמור על שפה והתנהגות מכבדת.
              </li>
              <li style={{ marginBottom: 12 }}>
                שימוש בבאגים, פריצות, או כל דרך לא הוגנת – יגרור פסילה מיידית.
              </li>
              <li style={{ marginBottom: 12 }}>
                ההחלטות של צוות הניהול והשיפוט הן סופיות ואינן ניתנות לערעור.
              </li>
            </ul>
          </section>

          {/* חיבור אינטרנט וניתוקים */}
          <section style={{ marginBottom: 40 }}>
            <h2 style={{
              fontSize: 28,
              fontWeight: 700,
              color: "#ff9800",
              marginBottom: 20,
              paddingBottom: 12,
              borderBottom: "3px solid #ff9800"
            }}>
              6. חיבור אינטרנט וניתוקים
            </h2>
            <div style={{
              background: "#fff3e0",
              padding: 20,
              borderRadius: 12,
              border: "2px solid #ff9800",
              marginBottom: 20
            }}>
              <p style={{ fontSize: 18, fontWeight: 700, color: "#e65100", margin: 0 }}>
                ⚠️ חשוב מאוד - אין החזר כספי במקרה של ניתוקים!
              </p>
            </div>
            <ul style={{ fontSize: 16, color: "#333", paddingRight: 20 }}>
              <li style={{ marginBottom: 12 }}>
                השתתפות בטורניר מחייבת חיבור אינטרנט יציב ואמין ללא ניתוקים.
              </li>
              <li style={{ marginBottom: 12 }}>
                <strong style={{ color: "#e65100" }}>במהלך המשחקים אין החזר כספי בכל מקרה של ניתוק מכל סוג שהוא</strong> —
                בין אם מדובר בניתוק אינטרנט, בעיה בקונסולה, או ניתוק יזום על ידי אחד הצדדים.
              </li>
              <li style={{ marginBottom: 12 }}>
                במקרה של ניתוק במהלך המשחק, השחקן יודח אוטומטית מהטורניר.
              </li>
              <li style={{ marginBottom: 12 }}>
                האחריות המלאה לחיבור האינטרנט וליציבות הרשת מוטלת על המשתתף בלבד.
              </li>
            </ul>
          </section>

          {/* ביטולים והחזרים */}
          <section style={{ marginBottom: 40 }}>
            <h2 style={{
              fontSize: 28,
              fontWeight: 700,
              color: "#667eea",
              marginBottom: 20,
              paddingBottom: 12,
              borderBottom: "3px solid #667eea"
            }}>
              7. ביטולים והחזרים
            </h2>
            <ul style={{ fontSize: 16, color: "#333", paddingRight: 20 }}>
              <li style={{ marginBottom: 12 }}>
                משתתף רשאי לבטל את השתתפותו עד 48 שעות לפני פתיחת הטורניר ולקבל החזר מלא.
              </li>
              <li style={{ marginBottom: 12 }}>
                לאחר פתיחת המשחקים לא יינתן החזר, למעט במקרים חריגים שיאושרו על ידי המארגן.
              </li>
            </ul>
          </section>

          {/* אחריות ופטור */}
          <section style={{ marginBottom: 40 }}>
            <h2 style={{
              fontSize: 28,
              fontWeight: 700,
              color: "#667eea",
              marginBottom: 20,
              paddingBottom: 12,
              borderBottom: "3px solid #667eea"
            }}>
              8. אחריות ופטור
            </h2>
            <ul style={{ fontSize: 16, color: "#333", paddingRight: 20 }}>
              <li style={{ marginBottom: 12 }}>
                הטורניר נערך כפעילות ספורטיבית פרטית שאינה הימור או משחק מזל.
              </li>
              <li style={{ marginBottom: 12 }}>
                המארגן אינו אחראי לתקלות טכניות הקשורות בקונסולה, ברשת או בציוד השחקן.
              </li>
              <li style={{ marginBottom: 12 }}>
                ההשתתפות הינה באחריות המשתתף בלבד.
              </li>
            </ul>
          </section>

          {/* זכויות מדיה */}
          <section style={{ marginBottom: 40 }}>
            <h2 style={{
              fontSize: 28,
              fontWeight: 700,
              color: "#667eea",
              marginBottom: 20,
              paddingBottom: 12,
              borderBottom: "3px solid #667eea"
            }}>
              9. זכויות מדיה
            </h2>
            <ul style={{ fontSize: 16, color: "#333", paddingRight: 20 }}>
              <li style={{ marginBottom: 12 }}>
                המשתתפים מאשרים למארגן להשתמש בתמונות, הקלטות ווידאו ממשחקי הטורניר לצורכי שיווק ופרסום ברשתות החברתיות, ללא תמורה נוספת.
              </li>
            </ul>
          </section>

          {/* אישור התקנון */}
          <section style={{ marginBottom: 40 }}>
            <h2 style={{
              fontSize: 28,
              fontWeight: 700,
              color: "#667eea",
              marginBottom: 20,
              paddingBottom: 12,
              borderBottom: "3px solid #667eea"
            }}>
              10. אישור התקנון
            </h2>
            <ul style={{ fontSize: 16, color: "#333", paddingRight: 20 }}>
              <li style={{ marginBottom: 12 }}>
                הרשמה לטורניר מהווה אישור מלא לתקנון זה ולכל תנאיו.
              </li>
              <li style={{ marginBottom: 12 }}>
                אי עמידה באחד התנאים עלולה להביא לפסילה ללא החזר כספי.
              </li>
            </ul>
          </section>

          {/* פרטי יצירת קשר */}
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
              11. פרטי יצירת קשר
            </h2>
            <p style={{ fontSize: 16, color: "#1565C0", marginBottom: 12 }}>
              לשאלות, הבהרות או בעיות טכניות, ניתן לפנות אלינו:
            </p>
            <p style={{ fontSize: 16, color: "#1565C0", fontWeight: 600 }}>
              📧 fcmasters9@gmail.com
            </p>
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

