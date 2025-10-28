// test-email-hostinger.mjs
import { sendMail, verifySmtp } from './dist/services/mailer.js';

// הגדרת משתני סביבה - הגדרות השרת
process.env.SMTP_HOST = 'smtp.hostinger.com';
process.env.SMTP_PORT = '587';
process.env.SMTP_SECURE = 'false';
process.env.SMTP_USER = 'fcmasterscup@fcmasterscup.com';
process.env.SMTP_PASS = 'Roizohar1985!';
process.env.EMAIL_FROM = 'FC Masters Cup <fcmasterscup@fcmasterscup.com>';
process.env.SITE_URL = 'https://www.fcmasterscup.com';

async function testEmail() {
  try {
    console.log('🧪 Testing HOSTINGER SMTP...');
    
    // בדיקת חיבור
    const verifyResult = await verifySmtp();
    console.log('✅ SMTP Verify:', verifyResult);
    
    if (!verifyResult) {
      console.error('❌ SMTP verification failed');
      return;
    }
    
    // שליחת מייל בדיקה - מייל בחירה לטורניר
    console.log('📤 Sending tournament selection email...');
    const result = await sendMail({
      to: 'fcmasters9@gmail.com',
      subject: '🎉 נבחרת להשתתף בטורניר: FC Masters Cup',
      html: `
        <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 16px;">
          <div style="background: white; padding: 40px; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.2);">
            <h1 style="color: #28a745; text-align: center; font-size: 32px; margin-bottom: 20px;">
              🎉 מזל טוב! נבחרת להשתתף!
            </h1>
            
            <div style="background: linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%); padding: 20px; border-radius: 10px; margin: 20px 0; border-right: 4px solid #28a745;">
              <p style="font-size: 18px; color: #333; line-height: 1.8; margin: 0;">
                שלום <strong>שחקן יקר</strong>,<br><br>
                <strong>נבחרת להשתתף בטורניר "FC Masters Cup"!</strong> 🏆
              </p>
            </div>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin: 20px 0; border: 1px solid #e9ecef;">
              <h3 style="color: #495057; font-size: 18px; margin: 0 0 15px 0;">📋 פרטי הטורניר:</h3>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                <div>
                  <p style="margin: 0; color: #6c757d; font-size: 14px;">🏆 שם הטורניר:</p>
                  <p style="margin: 5px 0 0 0; color: #333; font-weight: 600;">FC Masters Cup</p>
                </div>
                <div>
                  <p style="margin: 0; color: #6c757d; font-size: 14px;">🥇 פרס ראשון:</p>
                  <p style="margin: 5px 0 0 0; color: #333; font-weight: 600;">500 ₪</p>
                </div>
              </div>
            </div>
            
            <div style="margin: 30px 0;">
              <h2 style="color: #667eea; font-size: 22px; margin-bottom: 15px;">📋 מה הלאה?</h2>
              <ul style="color: #555; font-size: 16px; line-height: 2;">
                <li>הטורניר יתחיל בקרוב - הישאר ערני לעדכונים</li>
                <li>הכן את הקונסולה והכישורים שלך ל-FC25/FC26</li>
                <li>התכונן להתחרות מול השחקנים הטובים ביותר</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin-top: 40px;">
              <a href="https://www.fcmasterscup.com" style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 18px; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);">
                כניסה לאתר 🎮
              </a>
            </div>
            
            <div style="margin-top: 40px; padding-top: 20px; border-top: 2px solid #f0f0f0; text-align: center;">
              <p style="color: #999; font-size: 14px; margin: 5px 0;">
                בהצלחה בטורניר! 🏆
              </p>
              <p style="color: #999; font-size: 12px; margin: 5px 0;">
                FC Masters Cup • PS5 • FC25/FC26
              </p>
            </div>
          </div>
        </div>
      `
    });
    
    console.log('✅ Email sent successfully!');
    console.log('📧 Result:', JSON.stringify(result, null, 2));
    
  } catch (error) {
    console.error('❌ Email test failed:', error);
  }
}

testEmail();
