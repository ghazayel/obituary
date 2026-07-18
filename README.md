# منشئ النعوة الإسلامية

> **صمم نعوة للفقيد في أقل من دقيقتين**

أداة مجانية بالكامل لتصميم نعوات إسلامية احترافية باللغة العربية. املأ البيانات فقط، وستحصل على معاينة حية للبطاقة الجاهزة للطباعة، ثم حمّلها كصورة PNG عالية الجودة بضغطة واحدة.

[![Live Demo](https://img.shields.io/badge/🌐_Live_Demo-ghazayel.github.io/obituary-2F4A3C?style=for-the-badge)](https://ghazayel.github.io/obituary/)
[![Made with HTML/CSS/JS](https://img.shields.io/badge/Made_with-HTML%2FCSS%2FJS-2F4A3C?style=for-the-badge&logo=html5)](https://github.com/ghazayel/obituary)
[![Arabic](https://img.shields.io/badge/اللغة-العربية-2F4A3C?style=for-the-badge)](https://github.com/ghazayel/obituary)

---

## 🇬🇧 English Summary

**Islamic Obituary (Naawa / نعوة) Generator** — A free, privacy-friendly, client-side web application that lets users create professional Arabic Islamic death announcements in under two minutes. 

- Real-time live preview of an A4 print-ready card
- Automatic Hijri + Gregorian date formatting (with Levantine month names support)
- Gender-aware text generation (pronouns, relations, closing dua)
- Photo upload with rotation, zoom & drag-to-pan editor
- One-click high-resolution PNG export with proper Arabic text shaping and embedded fonts
- Fully functional offline after first load
- No data collection, no backend, no sign-up

**Live Demo:** [https://ghazayel.github.io/obituary/](https://ghazayel.github.io/obituary/)

---

## ✨ المميزات الرئيسية

- **اختيار الجنس** (رجل / امرأة) مع تعديل تلقائي للضمائر وتسميات صلات القرابة
- **جمل افتتاحية** قرآنية جاهزة أو نص مخصص
- **بيانات الفقيد** — الاسم الكامل + اللقب/الكنية (اختياري)
- **صورة الفقيد** — رفع صورة + محرر متقدم (تدوير، تكبير، سحب للتمركز)
- **صلات القرابة** — قائمة ديناميكية (والد/والدة، أبناء/بنات، أشقاء/شقيقات...) قابلة للإضافة والحذف
- **الصلاة والدفن** — تاريخ تلقائي هجري + ميلادي، توقيت بعد الصلاة، اسم المسجد، مكان الدفن (يتولد النص تلقائياً)
- **استقبال التعازي** — فترة زمنية + أماكن منفصلة للرجال والنساء (يتولد النص تلقائياً حسب تاريخ الدفن)
- **دعاء الختام** — يتكيف تلقائياً مع جنس الفقيد
- **معلومات تواصل إضافية** في التذييل (اختياري)
- **معاينة حية** على بطاقة A4 حقيقية المقاس
- **تنزيل PNG** عالي الدقة (جاهز للطباعة أو النشر على وسائل التواصل)
- **دعم كامل للغة العربية** مع خطوط احترافية (Aref Ruqaa + Cairo)
- **يعمل بدون إنترنت** بعد التحميل الأولي

---

## 🚀 كيفية الاستخدام

1. افتح الرابط: [https://ghazayel.github.io/obituary/](https://ghazayel.github.io/obituary/)
2. اختر جنس الفقيد (رجل أو امرأة)
3. املأ الحقول المطلوبة (الاسم + مكان الصلاة إلزاميان)
4. أضف صورة الفقيد إن أردت (مع إمكانية التعديل)
5. راجع المعاينة الحية على اليمين
6. اضغط زر **«تنزيل الصورة PNG»**

> **ملاحظة**: التطبيق يعمل كاملاً في المتصفح ولا يرسل أي بيانات إلى أي خادم.

---

## 💻 التشغيل محلياً (للتطوير أو الاستخدام دون إنترنت)

```bash
# استنساخ المستودع
git clone https://github.com/ghazayel/obituary.git
cd obituary

# طريقة بسيطة (Python)
python -m http.server 8000

# أو باستخدام Node
npx serve .

# ثم افتح http://localhost:8000 في المتصفح
```

أو ببساطة: انقر نقراً مزدوجاً على ملف `index.html` في معظم المتصفحات الحديثة.

---

## 📁 هيكل المشروع

```
obituary/
├── index.html          # الواجهة الرئيسية + المعاينة
├── app.js              # كل المنطق (توليد النصوص، التاريخ الهجري، التصدير، المحرر...)
├── style.css           # التنسيق والتصميم الاحترافي
├── *.woff2             # خطوط عربية محلية (Aref Ruqaa + Cairo)
└── README.md
```

---

## 🛠️ الجوانب التقنية المميزة

- **تحويل التاريخ الهجري** حسابياً مخصص (يطابق الإعلانات الشامية الشائعة)
- **تصدير PNG** باستخدام `html-to-image` للحفاظ على تشكيل الحروف العربية بشكل صحيح
- **تضمين الخطوط** — يفضل الملفات المحلية، وإلا يستخدم Google Fonts كاحتياطي
- **محرر صور** متقدم مع تدوير + تكبير + سحب (يعمل بالماوس واللمس)
- **تصميم متجاوب** — يعمل بشكل ممتاز على الجوال والتابلت
- **لا يعتمد على أي إطار عمل** — HTML + CSS + JavaScript نقي

---

## 🙏 الإهداء

هذا الموقع مُهدى إلى روح **الدكتور غازي غزيّل** وزوجته **جمال ملك**.

---

## 👤 المطور

**محمود غزيّل**  
[Facebook](https://www.facebook.com/ghazayel/)

---

## 🤝 المساهمة

المساهمات مرحب بها!  
يمكنك فتح Issues أو Pull Requests لـ:
- تحسينات في واجهة المستخدم
- إضافة قوالب نعوات جديدة
- دعم لغات أخرى
- إصلاح bugs في تحويل التاريخ أو التصدير

---

**صُنع بـ ❤️ واحترام للتقاليد والتصميم الجميل.**

---

*Version: v2.4.0*
