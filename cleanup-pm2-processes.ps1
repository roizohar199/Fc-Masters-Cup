# 🧹 FC Masters Cup - PM2 Process Cleanup Script
# סקריפט זה מנקה תהליכי PM2 מיותרים ומשאיר רק את fc-masters

Write-Host "🧹 מתחיל ניקוי תהליכי PM2..." -ForegroundColor Blue

# רשימת תהליכים לעצירה (כל השמות הלא נכונים)
$processesToStop = @(
    "fcmasters",
    "fc-masters-cup", 
    "fc-masters-backend",
    "fc-masters-cup-backend"
)

Write-Host "📋 בודק תהליכי PM2 נוכחיים..." -ForegroundColor Yellow

# בדיקה אם PM2 מותקן
try {
    $pm2List = pm2 list 2>$null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ PM2 לא מותקן או לא זמין" -ForegroundColor Red
        Write-Host "התקן PM2 עם: npm install -g pm2" -ForegroundColor Yellow
        exit 1
    }
} catch {
    Write-Host "❌ PM2 לא מותקן או לא זמין" -ForegroundColor Red
    Write-Host "התקן PM2 עם: npm install -g pm2" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ PM2 זמין" -ForegroundColor Green

# עצירת תהליכים מיותרים
foreach ($processName in $processesToStop) {
    Write-Host "🔍 בודק תהליך: $processName" -ForegroundColor Cyan
    
    try {
        $processExists = pm2 list | Select-String $processName
        if ($processExists) {
            Write-Host "🛑 עוצר תהליך: $processName" -ForegroundColor Yellow
            pm2 stop $processName
            pm2 delete $processName
            Write-Host "✅ תהליך $processName נעצר ונמחק" -ForegroundColor Green
        } else {
            Write-Host "ℹ️  תהליך $processName לא קיים" -ForegroundColor Gray
        }
    } catch {
        Write-Host "⚠️  שגיאה בעת עצירת $processName: $($_.Exception.Message)" -ForegroundColor Yellow
    }
}

# וידוא ש-fc-masters רץ
Write-Host "🔍 בודק תהליך fc-masters..." -ForegroundColor Cyan

try {
    $fcMastersExists = pm2 list | Select-String "fc-masters"
    if ($fcMastersExists) {
        Write-Host "✅ תהליך fc-masters קיים" -ForegroundColor Green
        
        # בדיקה אם הוא רץ
        $fcMastersStatus = pm2 list | Select-String "fc-masters" | Select-String "online"
        if ($fcMastersStatus) {
            Write-Host "✅ תהליך fc-masters רץ" -ForegroundColor Green
        } else {
            Write-Host "⚠️  תהליך fc-masters לא רץ - מפעיל מחדש" -ForegroundColor Yellow
            pm2 restart fc-masters
        }
    } else {
        Write-Host "❌ תהליך fc-masters לא קיים!" -ForegroundColor Red
        Write-Host "🔧 יוצר תהליך fc-masters חדש..." -ForegroundColor Yellow
        
        # בדיקה אם קיים קובץ dist
        if (Test-Path "server/dist/index.js") {
            pm2 start server/dist/index.js --name fc-masters
            Write-Host "✅ תהליך fc-masters נוצר" -ForegroundColor Green
        } else {
            Write-Host "❌ קובץ server/dist/index.js לא קיים!" -ForegroundColor Red
            Write-Host "הרץ קודם: npm run build" -ForegroundColor Yellow
        }
    }
} catch {
    Write-Host "❌ שגיאה בעת בדיקת fc-masters: $($_.Exception.Message)" -ForegroundColor Red
}

# שמירת תצורת PM2
Write-Host "💾 שומר תצורת PM2..." -ForegroundColor Cyan
pm2 save

# הצגת סטטוס סופי
Write-Host "📊 סטטוס PM2 סופי:" -ForegroundColor Blue
pm2 list

Write-Host ""
Write-Host "🎉 ניקוי PM2 הושלם!" -ForegroundColor Green
Write-Host "✅ רק תהליך fc-masters אמור לרוץ עכשיו" -ForegroundColor Green
Write-Host ""
Write-Host "פקודות שימושיות:" -ForegroundColor Cyan
Write-Host "  - צפה בלוגים: pm2 logs fc-masters" -ForegroundColor White
Write-Host "  - הפעל מחדש: pm2 restart fc-masters" -ForegroundColor White
Write-Host "  - סטטוס: pm2 status" -ForegroundColor White
Write-Host "  - עצור: pm2 stop fc-masters" -ForegroundColor White
