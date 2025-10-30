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
            תקנון רשמי ומשפטי – טורניר FC25/FC26 לסוני 5
          </h1>
          <div style={{ fontSize: 16, color: "#666", marginTop: 12, lineHeight: 1.6 }}>
            <p style={{ margin: "8px 0" }}><strong>המארגן:</strong> FC Masters Cup</p>
            <p style={{ margin: "8px 0" }}><strong>כתובת האתר:</strong> www.fcmasterscup.com</p>
            <p style={{ margin: "8px 0" }}><strong>שם האירוע:</strong> טורניר FC25/26 לסוני 5</p>
          </div>
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
                הטורניר נועד לעודד משחק הוגן, תחרותיות ספורטיבית, וקהילת גיימרים איכותית בישראל.
              </li>
              <li style={{ marginBottom: 12 }}>
                הטורניר מבוסס על כישרון וביצועים בלבד ואינו כולל מרכיב של הגרלה, הימור או מזל מכל סוג שהוא.
              </li>
            </ul>
          </section>

          {/* דמי השתתפות ופרסים */}
          <section style={{ marginBottom: 40 }}>
            <h2 style={{
              fontSize: 28,
              fontWeight: 700,
              color: "#667eea",
              marginBottom: 20,
              paddingBottom: 12,
              borderBottom: "3px solid #667eea"
            }}>
              2. דמי השתתפות ופרסים
            </h2>
            <ul style={{ fontSize: 16, color: "#333", paddingRight: 20 }}>
              <li style={{ marginBottom: 12 }}>
                דמי ההשתתפות בטורניר עומדים על <strong>50 ש"ח למשתתף</strong>, המשולמים מראש באמצעות אפליקציות תשלום מאובטחות.
              </li>
              <li style={{ marginBottom: 12 }}>
                <strong>הפרסים יחולקו כדלקמן:</strong>
                <ul style={{ marginTop: 8, paddingRight: 20 }}>
                  <li style={{ marginBottom: 8 }}>
                    🥇 <strong>מקום ראשון</strong> – 500 ש"ח בהעברה באמצעות Bit.
                  </li>
                </ul>
              </li>
              <li style={{ marginBottom: 12 }}>
                דמי ההשתתפות מיועדים לכיסוי הוצאות ניהול, הפקה, פיתוח, תחזוקה ופרסים בלבד.
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
                ההרשמה תתבצע באמצעות טופס באתר FC Masters Cup בלבד.
              </li>
              <li style={{ marginBottom: 12 }}>
                התשלום יבוצע מראש ובאמצעות פלטפורמות מאובטחות כאמור לעיל.
              </li>
              <li style={{ marginBottom: 12 }}>
                הטורניר ייפתח עם רישום של 16 משתתפים מאושרים לפחות.
              </li>
              <li style={{ marginBottom: 12 }}>
                עם השלמת התשלום, המשתתף יקבל אישור הרשמה במייל או בהודעת טקסט רשמית מהמארגן.
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
                המשחקים ייערכו בשיטת Knockout (נוק-אאוט) – שלב ההדחה הישירה.
              </li>
              <li style={{ marginBottom: 12 }}>
                כל מפגש יתקיים במשחק בודד בכל שלב משלבי הטורניר.
              </li>
              <li style={{ marginBottom: 12 }}>
                מצב המשחק הוא <strong>Kick Off</strong> ולא Ultimate Team.
              </li>
              <li style={{ marginBottom: 12 }}>
                הצמדת היריבים תיעשה על בסיס רשימת המשתתפים בלבד ובאופן שוויוני, ללא שיקול של מזל.
              </li>
              <li style={{ marginBottom: 12 }}>
                במקרה של שוויון בתוצאה – תתקיים הארכה ו/או דו־קרב פנדלים לפי כללי המשחק הרשמי.
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
                המשתתפים מחויבים לשמור על התנהגות מכבדת, שפה נאותה ויחס ספורטיבי כלפי יריביהם.
              </li>
              <li style={{ marginBottom: 12 }}>
                כל שימוש בפריצות, באגים, או כל דרך לא הוגנת אחרת – יגרור פסילה מיידית ללא החזר כספי.
              </li>
              <li style={{ marginBottom: 12 }}>
                החלטות צוות הניהול והשיפוט של הטורניר הינן סופיות ואינן ניתנות לערעור.
              </li>
            </ul>
          </section>

          {/* חיבור אינטרנט וניתוקים */}
          <section style={{ marginBottom: 40 }}>
            <h2 style={{
              fontSize: 28,
              fontWeight: 700,
              color: "#667eea",
              marginBottom: 20,
              paddingBottom: 12,
              borderBottom: "3px solid #667eea"
            }}>
              6. חיבור אינטרנט וניתוקים
            </h2>
            <ul style={{ fontSize: 16, color: "#333", paddingRight: 20 }}>
              <li style={{ marginBottom: 12 }}>
                ⚠️ <strong>אין החזר כספי במקרה של ניתוקים מכל סוג שהוא.</strong>
              </li>
              <li style={{ marginBottom: 12 }}>
                על כל משתתף לוודא חיבור אינטרנט יציב ואמין במהלך המשחקים.
              </li>
              <li style={{ marginBottom: 12 }}>
                במקרה של ניתוק (בין אם בשל תקלה, ניתוק יזום, או בעיה בקונסולה) — השחקן יפסל מהטורניר.
              </li>
              <li style={{ marginBottom: 12 }}>
                האחריות המלאה על תקינות החיבור והרשת מוטלת על המשתתף בלבד.
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
                ניתן לבטל השתתפות עד 48 שעות לפני פתיחת הטורניר ולקבל החזר מלא.
              </li>
              <li style={{ marginBottom: 12 }}>
                לאחר פתיחת המשחקים – לא יינתן החזר כספי בכלל.
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
                הטורניר מהווה פעילות ספורטיבית פרטית ואינו מהווה הימור, הגרלה או משחק מזל.
              </li>
              <li style={{ marginBottom: 12 }}>
                המארגן לא יישא באחריות לכל תקלה טכנית, נזק או אובדן הנובע מהשתתפות בטורניר, לרבות תקלות ברשת, בקונסולה או בציוד השחקן.
              </li>
              <li style={{ marginBottom: 12 }}>
                ההשתתפות בטורניר הינה על אחריות המשתתף בלבד.
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
                בהשתתפותם בטורניר, המשתתפים מעניקים למארגן רשות להשתמש בתמונות, הקלטות, שידורים חיים או סרטוני וידאו מן המשחקים לצורכי שיווק, פרסום וקידום בכל מדיה שהיא – לרבות רשתות חברתיות, אתרי אינטרנט ופרסומים מסחריים – ללא תמורה נוספת וללא הגבלת זמן.
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
                ההרשמה לטורניר מהווה אישור והסכמה מלאה לכלל סעיפי התקנון.
              </li>
              <li style={{ marginBottom: 12 }}>
                אי עמידה באחד מהתנאים עלולה להביא לפסילה מיידית ללא החזר כספי.
              </li>
              <li style={{ marginBottom: 12 }}>
                המארגן שומר לעצמו את הזכות לעדכן את התקנון מעת לעת בהתאם לצרכים ולמדיניות האתר, והעדכון יפורסם באתר באופן פומבי.
              </li>
            </ul>
          </section>

          {/* קישור חזרה */}
          <div style={{ textAlign: "center", marginTop: 40, paddingTop: 30, borderTop: "2px solid #f0f0f0" }}>
            <Link 
              to="/" 
              style={{
                display: "inline-block",
                padding: "16px 32px",
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                color: "white",
                textDecoration: "none",
                borderRadius: 12,
                fontWeight: 700,
                fontSize: 18,
                boxShadow: "0 4px 15px rgba(102, 126, 234, 0.4)",
                transition: "all 0.3s ease"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 6px 20px rgba(102, 126, 234, 0.5)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 4px 15px rgba(102, 126, 234, 0.4)";
              }}
            >
              🏠 חזרה לעמוד הראשי
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}