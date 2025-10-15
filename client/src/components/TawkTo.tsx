import { useEffect } from "react";

interface TawkToProps {
  propertyId?: string;
  widgetId?: string;
}

export default function TawkTo({ 
  propertyId, 
  widgetId = "default" 
}: TawkToProps) {
  useEffect(() => {
    // אם אין Property ID מוגדר, לא טוענים את הסקריפט
    if (!propertyId || propertyId === "YOUR_PROPERTY_ID") {
      console.log("[TawkTo] ⚠️ Tawk.to Property ID not configured. Skipping chat widget.");
      console.log("[TawkTo] 💡 To enable chat support:");
      console.log("[TawkTo]    1. Sign up at https://www.tawk.to/");
      console.log("[TawkTo]    2. Create a property and get your Property ID");
      console.log("[TawkTo]    3. Add TAWK_PROPERTY_ID to your .env file");
      console.log("[TawkTo]    4. Pass it to <TawkTo propertyId={propertyId} />");
      return;
    }

    // בדיקה אם הסקריפט כבר טעון
    if ((window as any).Tawk_API) {
      return;
    }

    console.log(`[TawkTo] 🚀 Loading Tawk.to chat widget with Property ID: ${propertyId}`);

    // הגדרת Tawk_API
    (window as any).Tawk_API = (window as any).Tawk_API || {};
    (window as any).Tawk_LoadStart = new Date();

    // יצירת הסקריפט
    const script = document.createElement("script");
    script.async = true;
    script.src = `https://embed.tawk.to/${propertyId}/${widgetId}`;
    script.charset = "UTF-8";
    script.setAttribute("crossorigin", "*");

    // הוספת הסקריפט לדף
    const firstScript = document.getElementsByTagName("script")[0];
    if (firstScript && firstScript.parentNode) {
      firstScript.parentNode.insertBefore(script, firstScript);
    }

    // התאמה אישית לעברית - מימין לשמאל
    (window as any).Tawk_API.onLoad = function() {
      console.log("[TawkTo] ✅ Tawk.to loaded successfully");
      
      // התאמות אישיות (אופציונלי)
      // (window as any).Tawk_API.setAttributes({
      //   'name': 'שם המשתמש',
      //   'email': 'user@example.com'
      // });
    };

    // ניקוי בעת unmount
    return () => {
      // הסרת הסקריפט אם הקומפוננטה נהרסת
      const scripts = document.querySelectorAll(`script[src^="https://embed.tawk.to"]`);
      scripts.forEach(s => s.remove());
      
      // ניקוי האובייקטים הגלובליים
      delete (window as any).Tawk_API;
      delete (window as any).Tawk_LoadStart;
    };
  }, [propertyId, widgetId]);

  // הקומפוננטה לא מרנדרת כלום - הסקריפט מוסיף את הווידג'ט
  return null;
}

