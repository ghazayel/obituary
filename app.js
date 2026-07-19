(function(){
"use strict";

/* ============================================================
   ESCAPE FACEBOOK/INSTAGRAM/ETC IN-APP BROWSERS
   These are restricted WebViews, not real browsers — they can
   silently break file downloads no matter what a page tries.
   The only real fix is getting the person into their actual
   system browser. This runs immediately on load, before anything
   else, so it happens as early as possible:

   - Android: the intent:// URL scheme can force-navigate straight
     into the device's normal browser — this is a genuine, silent
     redirect, not just a suggestion, and is the standard technique
     sites use for this exact problem.
   - iOS: Apple does not allow a page to silently hand off to
     Safari from inside another app's WebView — there is no fully
     automatic method. The best available option is the
     "x-safari-https://" URL scheme, which works some of the time
     depending on iOS version, backed by an unmissable full-screen
     prompt with manual instructions as a guaranteed fallback.
   ============================================================ */
(function escapeInAppBrowser(){
  const ua = navigator.userAgent || '';
  const inAppNames = [
    { re: /FBAN|FBAV|FB_IAB/i, name: 'فيسبوك' },
    { re: /Instagram/i, name: 'إنستغرام' },
    { re: /Line\//i, name: 'Line' },
    { re: /MicroMessenger/i, name: 'WeChat' },
    { re: /TikTok/i, name: 'TikTok' },
    { re: /Twitter/i, name: 'Twitter/X' },
  ];
  const match = inAppNames.find(p => p.re.test(ua));
  if(!match) return; // real browser — nothing to do

  const isAndroid = /Android/i.test(ua);
  const isIOS = /iPhone|iPad|iPod/i.test(ua);

  if(isAndroid){
    const bare = location.href.replace(/^https?:\/\//, '');
    const intentUrl = `intent://${bare}#Intent;scheme=https;action=android.intent.action.VIEW;category=android.intent.category.BROWSABLE;end`;
    window.location.href = intentUrl;
    return; // page is navigating away now
  }

  if(isIOS){
    // Show the overlay first (guaranteed to be seen even if the scheme below
    // silently fails), then also attempt the semi-automatic Safari handoff.
    document.addEventListener('DOMContentLoaded', () => {
      const overlay = document.createElement('div');
      overlay.className = 'escape-overlay';
      overlay.innerHTML = `
        <div class="escape-overlay-inner">
          <p class="escape-overlay-title">افتح هذه الصفحة في Safari</p>
          <p>متصفح ${match.name} الداخلي لا يسمح بتنزيل الصور. لإتمام التنزيل، افتح الصفحة في Safari:</p>
          <button type="button" class="btn btn-primary" id="escapeToSafariBtn">فتح في Safari</button>
          <p class="escape-overlay-note">إذا لم يعمل الزر: اضغط على زر المشاركة
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style="vertical-align:-2px"><path d="M12 3v12m0-12 4 4m-4-4-4 4M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
            أسفل الشاشة، ثم اختر "فتح في المتصفح" أو "Open in Safari".</p>
        </div>
      `;
      document.body.appendChild(overlay);
      document.getElementById('escapeToSafariBtn').addEventListener('click', () => {
        window.location.href = location.href.replace(/^https:\/\//, 'x-safari-https://').replace(/^http:\/\//, 'x-safari-http://');
      });
    });
  }
})();


/* ============================================================
   HIJRI DATE CONVERSION
   Arithmetic (tabular) Islamic calendar, public-domain formulas
   (Calendrical Calculations / Fourmilab), epoch nudged by one
   day to match common Levantine mosque-committee announcements.
   ============================================================ */
const ISLAMIC_EPOCH = 1948439.5 - 1;

function gregorianToJD(year, month, day){
  return (367 * year) - Math.floor((7 * (year + Math.floor((month + 9) / 12))) / 4) +
    Math.floor((275 * month) / 9) + day + 1721013.5;
}
function islamicToJD(year, month, day){
  return day + Math.ceil(29.5 * (month - 1)) + (year - 1) * 354 +
    Math.floor((3 + 11 * year) / 30) + ISLAMIC_EPOCH - 1;
}
function jdToIslamic(jd){
  jd = Math.floor(jd) + 0.5;
  const year = Math.floor((30 * (jd - ISLAMIC_EPOCH) + 10646) / 10631);
  let month = Math.min(12, Math.ceil((jd - (29 + islamicToJD(year, 1, 1))) / 29.5) + 1);
  if (month < 1) month = 1;
  const day = jd - islamicToJD(year, month, 1) + 1;
  return { year, month, day: Math.round(day) };
}
function gregorianDateToHijri(dateObj, adjustDays){
  const jd = gregorianToJD(dateObj.getFullYear(), dateObj.getMonth()+1, dateObj.getDate()) + (adjustDays||0);
  return jdToIslamic(jd);
}

const HIJRI_MONTHS = ["محرم","صفر","ربيع الأول","ربيع الآخر","جمادى الأولى","جمادى الآخرة","رجب","شعبان","رمضان","شوال","ذو القعدة","ذو الحجة"];
const WEEKDAYS = ["الأحد","الاثنين","الثلاثاء","الأربعاء","الخميس","الجمعة","السبت"];
const MONTHS_LEVANTINE = ["كانون الثاني","شباط","آذار","نيسان","أيار","حزيران","تموز","آب","أيلول","تشرين الأول","تشرين الثاني","كانون الأول"];
const MONTHS_STANDARD  = ["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];

const ARABIC_DIGITS = ["٠","١","٢","٣","٤","٥","٦","٧","٨","٩"];
function toArabicDigits(n){
  return String(n).replace(/[0-9]/g, d => ARABIC_DIGITS[d]);
}

function parseLocalDate(yyyy_mm_dd){
  if(!yyyy_mm_dd) return null;
  const [y,m,d] = yyyy_mm_dd.split('-').map(Number);
  return new Date(y, m-1, d);
}

function addDays(date, n){
  const d = new Date(date);
  d.setDate(d.getDate()+n);
  return d;
}

function formatGregorian(date, style){
  const months = style === 'standard' ? MONTHS_STANDARD : MONTHS_LEVANTINE;
  return `${toArabicDigits(date.getDate())} ${months[date.getMonth()]} ${toArabicDigits(date.getFullYear())}م`;
}
function formatHijri(date, adjust){
  const h = gregorianDateToHijri(date, adjust);
  return `${toArabicDigits(h.day)} ${HIJRI_MONTHS[h.month-1]} ${toArabicDigits(h.year)}هـ`;
}
function weekdayName(date){ return WEEKDAYS[date.getDay()]; }

function formatTime12(hhmm){
  if(!hhmm) return '';
  let [h,m] = hhmm.split(':').map(Number);
  const suffix = h >= 12 ? 'مساءً' : 'صباحًا';
  let h12 = h % 12; if(h12 === 0) h12 = 12;
  const mm = m === 0 ? '' : `:${String(m).padStart(2,'0')}`;
  return `${toArabicDigits(h12)}${mm} ${suffix}`;
}

/* ============================================================
   DEFAULT RELATION ROWS
   ============================================================ */
const DEFAULT_RELATIONS = [
  { label: "والده", value: "" },
  { label: "والدته", value: "" },
  { label: "أبناؤه", value: "" },
  { label: "بناته", value: "" },
  { label: "أشقاؤه", value: "" },
  { label: "شقيقاته", value: "" },
];

// male <-> female preset label pairs, matched by index, so switching
// gender updates any still-default relation labels automatically
// without touching labels the person has customized themselves.
const MALE_RELATION_LABELS   = ["والده","والدته","أبناؤه","بناته","أشقاؤه","شقيقاته"];
const FEMALE_RELATION_LABELS = ["والدها","والدتها","أبناؤها","بناتها","أشقاؤها","شقيقاتها"];

function swapRelationLabelsForGender(gender){
  const from = gender === 'female' ? MALE_RELATION_LABELS : FEMALE_RELATION_LABELS;
  const to   = gender === 'female' ? FEMALE_RELATION_LABELS : MALE_RELATION_LABELS;
  state.relations.forEach(rel => {
    const idx = from.indexOf(rel.label.trim());
    if(idx !== -1) rel.label = to[idx];
  });
}

const OPENING_PHRASES = [
  "وبشر الصابرين الذين إذا أصابتهم مصيبة قالوا إنا لله وإنا إليه راجعون",
  "سبحان الحي الذي لا يموت",
  "اللهم ألهمنا الصبر والسلوان على مصابنا الجلل",
  "إنا لله وإنا إليه راجعون",
];

/* ============================================================
   STATE
   ============================================================ */
const state = {
  gender: 'male',
  photo: { dataUrl: null, naturalW: 0, naturalH: 0, rotation: 0, zoom: 1, offsetX: 0, offsetY: 0 },
  relations: DEFAULT_RELATIONS.map(r => ({...r})),
  dirty: { notice:false, funeral:false, condolence:false, closing:false },
};

/* ============================================================
   DOM REFS
   ============================================================ */
const $ = id => document.getElementById(id);

const el = {
  genderSwitch: $('genderSwitch'),
  openingSelect: $('openingSelect'),
  openingCustom: $('openingCustom'),
  announcerFamilies: $('announcerFamilies'),
  noticeText: $('noticeText'),
  deceasedName: $('deceasedName'),
  nickname: $('nickname'),
  photoInput: $('photoInput'),
  removePhoto: $('removePhoto'),
  photoEditor: $('photoEditor'),
  photoEditorFrame: $('photoEditorFrame'),
  photoEditorPan: $('photoEditorPan'),
  photoEditorImg: $('photoEditorImg'),
  photoAdjustRow: $('photoAdjustRow'),
  rotateLeft: $('rotateLeft'),
  rotateRight: $('rotateRight'),
  photoZoom: $('photoZoom'),
  relationsList: $('relationsList'),
  addRelation: $('addRelation'),
  prayerDate: $('prayerDate'),
  prayerTime: $('prayerTime'),
  hijriAdjust: $('hijriAdjust'),
  monthStyle: $('monthStyle'),
  mosqueName: $('mosqueName'),
  burialLocation: $('burialLocation'),
  funeralAuto: $('funeralAuto'),
  condolenceFrom: $('condolenceFrom'),
  condolenceTo: $('condolenceTo'),
  condolenceMen: $('condolenceMen'),
  condolenceWomen: $('condolenceWomen'),
  condolenceAuto: $('condolenceAuto'),
  closingAuto: $('closingAuto'),
  footerContact: $('footerContact'),

  outOpening: $('out-opening'),
  outAnnouncer: $('out-announcer'),
  outNotice: $('out-notice'),
  outPhotoWrap: $('out-photo-wrap'),
  outPhotoPan: $('out-photo-pan'),
  outPhoto: $('out-photo'),
  outName: $('out-name'),
  outNickname: $('out-nickname'),
  outRelations: $('out-relations'),
  outFuneralBlock: $('out-funeral-block'),
  outCondolences: $('out-condolences'),
  outClosing: $('out-closing'),
  outContact: $('out-contact'),

  card: $('card'),
  cardContent: $('card-content'),
};

/* ============================================================
   INIT: opening phrase dropdown
   ============================================================ */
OPENING_PHRASES.forEach(p => {
  const opt = document.createElement('option');
  opt.value = p; opt.textContent = p;
  el.openingSelect.appendChild(opt);
});
const customOpt = document.createElement('option');
customOpt.value = '__custom__'; customOpt.textContent = 'نص مخصص…';
el.openingSelect.appendChild(customOpt);

/* ============================================================
   RELATION ROWS (form)
   ============================================================ */
function renderRelationForm(){
  el.relationsList.innerHTML = '';
  state.relations.forEach((rel, idx) => {
    const row = document.createElement('div');
    row.className = 'relation-item';
    row.innerHTML = `
      <button type="button" class="rel-remove" title="حذف هذه الصلة" aria-label="حذف هذه الصلة">×</button>
      <input type="text" class="input rel-label" placeholder="الصلة (مثال: أشقاؤه)" value="${escapeAttr(rel.label)}">
      <input type="text" class="input rel-value" placeholder="الأسماء" value="${escapeAttr(rel.value)}">
    `;
    const [labelInput, valueInput] = row.querySelectorAll('input');
    labelInput.addEventListener('input', () => { rel.label = labelInput.value; renderCard(); });
    valueInput.addEventListener('input', () => { rel.value = valueInput.value; renderCard(); });
    row.querySelector('.rel-remove').addEventListener('click', () => {
      state.relations.splice(idx,1);
      renderRelationForm();
      renderCard();
    });
    el.relationsList.appendChild(row);
  });
}
function escapeAttr(s){ return String(s||'').replace(/"/g,'&quot;'); }
function escapeHtml(s){
  return String(s||'')
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

el.addRelation.addEventListener('click', () => {
  state.relations.push({ label:'', value:'' });
  renderRelationForm();
  renderCard();
});

renderRelationForm();

/* ============================================================
   GENDER SWITCH
   ============================================================ */
el.genderSwitch.addEventListener('click', (e) => {
  const btn = e.target.closest('.seg-btn');
  if(!btn) return;
  [...el.genderSwitch.children].forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  state.gender = btn.dataset.gender;
  swapRelationLabelsForGender(state.gender);
  renderRelationForm();
  regenerateAll();
  renderCard();
});

/* ============================================================
   OPENING PHRASE
   ============================================================ */
el.openingSelect.value = OPENING_PHRASES[0];
el.openingSelect.addEventListener('change', () => {
  if(el.openingSelect.value === '__custom__'){
    el.openingCustom.hidden = false;
    el.openingCustom.focus();
  } else {
    el.openingCustom.hidden = true;
  }
  renderCard();
});
el.openingCustom.addEventListener('input', renderCard);

/* ============================================================
   PHOTO UPLOAD, ROTATE, ZOOM & DRAG-TO-PAN
   The small editor next to the upload field and the photo shown
   in the actual card are two independent DOM nodes that mirror
   the same state, so edits made in the small editor show up
   immediately in the real card without needing to scroll up.
   ============================================================ */
const CARD_FRAME_W = 120, CARD_FRAME_H = 142;     // matches .card-photo-frame in CSS
const EDITOR_FRAME_W = 200, EDITOR_FRAME_H = 237; // matches .photo-editor-frame in CSS (same aspect ratio)
// 1x1 transparent GIF — a safe permanent fallback so these <img> elements
// never sit with an empty/unset src. An empty src resolves to the current
// page's own URL (a relative reference back to "here"), which some export
// tools then try to fetch as if it were an image, and fail.
const BLANK_IMG_SRC = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==';

el.photoInput.addEventListener('change', () => {
  const file = el.photoInput.files[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    const img = new Image();
    img.onload = () => {
      state.photo.dataUrl = reader.result;
      state.photo.naturalW = img.naturalWidth;
      state.photo.naturalH = img.naturalHeight;
      state.photo.rotation = 0;
      state.photo.zoom = 1;
      state.photo.offsetX = 0;
      state.photo.offsetY = 0;
      el.photoZoom.value = 1;
      el.photoEditorImg.src = reader.result;
      el.removePhoto.hidden = false;
      el.photoEditor.hidden = false;
      renderCard();
    };
    img.src = reader.result;
  };
  reader.readAsDataURL(file);
});
el.removePhoto.addEventListener('click', () => {
  state.photo = { dataUrl: null, naturalW: 0, naturalH: 0, rotation: 0, zoom: 1, offsetX: 0, offsetY: 0 };
  el.photoInput.value = '';
  el.outPhoto.src = BLANK_IMG_SRC;
  el.photoEditorImg.src = BLANK_IMG_SRC;
  el.removePhoto.hidden = true;
  el.photoEditor.hidden = true;
  renderCard();
});
el.rotateLeft.addEventListener('click', () => {
  state.photo.rotation = (state.photo.rotation - 90 + 360) % 360;
  state.photo.offsetX = 0;
  state.photo.offsetY = 0;
  renderCard();
});
el.rotateRight.addEventListener('click', () => {
  state.photo.rotation = (state.photo.rotation + 90) % 360;
  state.photo.offsetX = 0;
  state.photo.offsetY = 0;
  renderCard();
});
el.photoZoom.addEventListener('input', () => {
  state.photo.zoom = Number(el.photoZoom.value);
  renderCard();
});

/* ---- drag to pan, via pointer events (works for mouse + touch) ---- */
let dragState = null;
el.photoEditorFrame.addEventListener('pointerdown', (e) => {
  if(!state.photo.dataUrl) return;
  dragState = {
    startX: e.clientX, startY: e.clientY,
    startOffsetX: state.photo.offsetX, startOffsetY: state.photo.offsetY,
  };
  el.photoEditorFrame.classList.add('dragging');
  el.photoEditorFrame.setPointerCapture(e.pointerId);
});
el.photoEditorFrame.addEventListener('pointermove', (e) => {
  if(!dragState) return;
  // editor is shown larger on screen than the true card frame, so convert
  // drag distance in editor pixels down to true card pixels for a 1:1 feel
  const ratio = CARD_FRAME_W / EDITOR_FRAME_W;
  const dx = (e.clientX - dragState.startX) * ratio;
  const dy = (e.clientY - dragState.startY) * ratio;
  state.photo.offsetX = dragState.startOffsetX + dx;
  state.photo.offsetY = dragState.startOffsetY + dy;
  applyPhotoTransform(); // lightweight: skip full renderCard() while dragging
});
function endDrag(e){
  if(!dragState) return;
  dragState = null;
  el.photoEditorFrame.classList.remove('dragging');
}
el.photoEditorFrame.addEventListener('pointerup', endDrag);
el.photoEditorFrame.addEventListener('pointercancel', endDrag);

/* Compute a transform that always covers the fixed photo frame however the
   image is rotated, layer the person's zoom + pan offset on top, and apply
   it to both the small editor and the real card so they stay in sync. */
function applyPhotoTransform(){
  const { naturalW, naturalH, rotation, zoom } = state.photo;
  if(!naturalW || !naturalH) return;

  let effW = naturalW, effH = naturalH;
  if(rotation === 90 || rotation === 270){ [effW, effH] = [effH, effW]; }

  const targets = [
    { frameW: CARD_FRAME_W,   frameH: CARD_FRAME_H,   pan: el.outPhotoPan,      img: el.outPhoto },
    { frameW: EDITOR_FRAME_W, frameH: EDITOR_FRAME_H, pan: el.photoEditorPan,   img: el.photoEditorImg },
  ];

  targets.forEach(({ frameW, frameH, pan, img }) => {
    if(!pan || !img) return;
    const scaleForThisFrame = frameW / CARD_FRAME_W; // editor is drawn bigger than the card
    const coverScale = Math.max(frameW / effW, frameH / effH);
    const finalScale = coverScale * zoom;

    // clamp pan so the image always fully covers its frame (no blank gaps)
    const displayedW = effW * finalScale;
    const displayedH = effH * finalScale;
    const maxOffsetX = Math.max(0, (displayedW - frameW) / 2);
    const maxOffsetY = Math.max(0, (displayedH - frameH) / 2);
    const rawOffsetX = state.photo.offsetX * scaleForThisFrame;
    const rawOffsetY = state.photo.offsetY * scaleForThisFrame;
    const clampedX = Math.max(-maxOffsetX, Math.min(maxOffsetX, rawOffsetX));
    const clampedY = Math.max(-maxOffsetY, Math.min(maxOffsetY, rawOffsetY));

    pan.style.transform = `translate(${clampedX}px, ${clampedY}px)`;
    img.style.width = naturalW + 'px';
    img.style.height = naturalH + 'px';
    img.style.transform = `translate(-50%, -50%) rotate(${rotation}deg) scale(${finalScale})`;
  });

  // store the clamped, frame-independent offset back so the slider/rotate
  // logic and next drag start from a value that's already in-bounds
  const coverScaleCard = Math.max(CARD_FRAME_W / effW, CARD_FRAME_H / effH);
  const finalScaleCard = coverScaleCard * zoom;
  const maxOffXCard = Math.max(0, (effW * finalScaleCard - CARD_FRAME_W) / 2);
  const maxOffYCard = Math.max(0, (effH * finalScaleCard - CARD_FRAME_H) / 2);
  state.photo.offsetX = Math.max(-maxOffXCard, Math.min(maxOffXCard, state.photo.offsetX));
  state.photo.offsetY = Math.max(-maxOffYCard, Math.min(maxOffYCard, state.photo.offsetY));
}

/* ============================================================
   AUTO-TEXT GENERATORS
   ============================================================ */
function buildNotice(){
  const families = el.announcerFamilies.value.trim();
  const isMale = state.gender === 'male';
  const verb = isMale ? 'فقيدهم المرحوم' : 'فقيدتهم المرحومة';
  let text = '';
  if(families) text += `${families}\n`;
  text += `ينعون إليكم بمزيد من الرضى والتسليم بقضائه تعالى وفاة ${verb} بإذنه تعالى`;
  return text;
}

function buildFuneral(){
  const dateVal = el.prayerDate.value;
  const isMale = state.gender === 'male';
  const pronoun = isMale ? 'جثمانه' : 'جثمانها';
  const time = el.prayerTime.value;
  const mosque = el.mosqueName.value.trim() || '___';
  const burial = el.burialLocation.value.trim() || '___';
  const adjust = Number(el.hijriAdjust.value);
  const style = el.monthStyle.value;

  let dateLine = 'الرجاء تحديد تاريخ الصلاة على الجثمان';
  if(dateVal){
    const d = parseLocalDate(dateVal);
    dateLine = `يصلى على ${pronoun} الطاهر عقب صلاة ${time} من يوم ${weekdayName(d)}\n` +
               `الواقع فيه ${formatHijri(d, adjust)} الموافق له ${formatGregorian(d, style)}`;
  }
  return `${dateLine}\nفي ${mosque}\nويوارى الثرى في ${burial}`;
}

function buildCondolence(){
  const dateVal = el.prayerDate.value;
  const from = formatTime12(el.condolenceFrom.value);
  const to = formatTime12(el.condolenceTo.value);
  const men = el.condolenceMen.value.trim() || '___';
  const women = el.condolenceWomen.value.trim() || '___';

  let daysPhrase = 'اليومين التاليين للدفن';
  if(dateVal){
    const d = parseLocalDate(dateVal);
    const d2 = addDays(d,1), d3 = addDays(d,2);
    daysPhrase = `يومي ${weekdayName(d2)} و${weekdayName(d3)}`;
  }
  return `تُقبل التعازي ${daysPhrase} من الساعة ${from} حتى الساعة ${to}\nللرجال في ${men}\nوللنساء في ${women}`;
}

function buildClosing(){
  const isMale = state.gender === 'male';
  return isMale
    ? 'اللهم ارحمه واعف عنه وأكرم نزله ووسع مدخله واجعل قبره روضة من رياض الجنة'
    : 'اللهم ارحمها واعف عنها وأكرم نزلها ووسع مدخلها واجعل قبرها روضة من رياض الجنة';
}

function regenerate(key){
  if(key === 'notice') el.noticeText.value = buildNotice();
  if(key === 'funeral') el.funeralAuto.value = buildFuneral();
  if(key === 'condolence') el.condolenceAuto.value = buildCondolence();
  if(key === 'closing') el.closingAuto.value = buildClosing();
  state.dirty[key] = false;
}
function regenerateAll(){ ['notice','funeral','condolence','closing'].forEach(regenerate); }

document.querySelectorAll('[data-regen]').forEach(btn => {
  btn.addEventListener('click', () => {
    regenerate(btn.dataset.regen);
    renderCard();
  });
});

// mark dirty when user types directly into an auto textarea
[['noticeText','notice'],['funeralAuto','funeral'],['condolenceAuto','condolence'],['closingAuto','closing']]
  .forEach(([id,key]) => {
    el[id].addEventListener('input', () => {
      state.dirty[key] = true;
      renderCard();
    });
  });

// dependency fields that trigger auto-regeneration (only if not dirty)
const noticeDeps = [el.announcerFamilies];
const funeralDeps = [el.prayerDate, el.prayerTime, el.mosqueName, el.burialLocation, el.hijriAdjust, el.monthStyle];
const condolenceDeps = [el.prayerDate, el.condolenceFrom, el.condolenceTo, el.condolenceMen, el.condolenceWomen];

function wireDeps(deps, key){
  deps.forEach(input => {
    input.addEventListener('input', () => {
      if(!state.dirty[key]) regenerate(key);
      renderCard();
    });
  });
}
wireDeps(noticeDeps, 'notice');
wireDeps(funeralDeps, 'funeral');
wireDeps(condolenceDeps, 'condolence');

/* ============================================================
   SIMPLE DIRECT-MAPPED FIELDS
   ============================================================ */
[el.deceasedName, el.nickname, el.footerContact].forEach(input => {
  input.addEventListener('input', renderCard);
});

/* ============================================================
   FIT NAME TEXT EDGE-TO-EDGE (like the printed samples)
   ============================================================ */
function fitTextToWidth(node, maxWidth, minPx, maxPx){
  let lo = minPx, hi = maxPx, best = minPx;
  while(lo <= hi){
    const mid = Math.floor((lo + hi) / 2);
    node.style.fontSize = mid + 'px';
    if(node.scrollWidth <= maxWidth){ best = mid; lo = mid + 1; }
    else { hi = mid - 1; }
  }
  node.style.fontSize = best + 'px';
}
function fitName(){
  const cardWidth = 794;
  const cardPaddingX = 40; // matches .card-content padding
  const maxWidth = cardWidth - (cardPaddingX * 2);
  fitTextToWidth(el.outName, maxWidth, 30, 96);
}

/* ============================================================
   SHRINK CONTENT TO ALWAYS FIT ONE A4 PAGE
   If the filled-in content is taller than the fixed A4 box,
   scale the whole content block down proportionally instead
   of letting the page grow or clipping anything.
   ============================================================ */
function fitContentToPage(){
  const content = el.cardContent;
  content.style.transform = 'none'; // reset to measure true size first
  const target = content.clientHeight;   // fixed to #card's height (100%)
  const needed = content.scrollHeight;   // natural height of all children
  if(needed > target + 1){
    const scale = target / needed;
    content.style.transform = `scale(${scale})`;
  }
}

/* ============================================================
   RENDER CARD
   ============================================================ */
function renderCard(){
  // opening phrase
  const opening = el.openingSelect.value === '__custom__' ? el.openingCustom.value : el.openingSelect.value;
  el.outOpening.textContent = opening;

  // notice (families line is embedded inside notice text via \n; split for display)
  const noticeLines = el.noticeText.value.split('\n');
  if(noticeLines.length > 1){
    el.outAnnouncer.textContent = noticeLines[0];
    el.outAnnouncer.hidden = false;
    el.outNotice.textContent = noticeLines.slice(1).join(' ');
  } else {
    el.outAnnouncer.hidden = true;
    el.outNotice.textContent = noticeLines[0] || '';
  }

  // name
  el.outName.textContent = el.deceasedName.value.trim() || 'الاسم الكامل للفقيد';
  fitName();
  const nick = el.nickname.value.trim();
  el.outNickname.hidden = !nick;
  el.outNickname.textContent = nick ? `(${nick})` : '';

  // photo
  if(state.photo.dataUrl){
    el.outPhotoWrap.hidden = false;
    if(el.outPhoto.src !== state.photo.dataUrl) el.outPhoto.src = state.photo.dataUrl;
    applyPhotoTransform();
  } else {
    el.outPhotoWrap.hidden = true;
    if(el.outPhoto.src !== BLANK_IMG_SRC) el.outPhoto.src = BLANK_IMG_SRC;
  }

  // relations
  el.outRelations.innerHTML = '';
  state.relations.forEach(rel => {
    if(!rel.value.trim()) return;
    const row = document.createElement('div');
    row.className = 'relation-row';
    row.innerHTML = `<span class="relation-label">${escapeHtml(rel.label)}${rel.label ? ' :' : ''}</span><span class="relation-value">${escapeHtml(rel.value)}</span>`;
    el.outRelations.appendChild(row);
  });

  // funeral block
  el.outFuneralBlock.textContent = el.funeralAuto.value;

  // condolences
  el.outCondolences.textContent = el.condolenceAuto.value;

  // closing
  el.outClosing.textContent = el.closingAuto.value;

  // footer contact
  const contact = el.footerContact.value.trim();
  el.outContact.hidden = !contact;
  el.outContact.textContent = contact;

  // make sure everything fits within one fixed A4 page
  fitContentToPage();
}

/* ============================================================
   SCALE THE A4 PREVIEW TO FIT ITS CONTAINER
   ============================================================ */
function scalePreview(){
  const wrap = document.querySelector('.a4-wrap');
  const scale = wrap.clientWidth / 794;
  el.card.style.transform = `scale(${scale})`;
  el.card.style.transformOrigin = 'top right';
  wrap.style.height = (1123 * scale) + 'px';
}
window.addEventListener('resize', scalePreview);

/* ============================================================
   PNG EXPORT
   Uses html-to-image (SVG foreignObject based) instead of
   html2canvas, because html2canvas draws Arabic glyphs one by
   one and breaks letter shaping/ligatures. html-to-image lets
   the browser render the text natively, so Arabic comes out
   correctly joined. Always exports at a fixed A4 pixel size —
   fitContentToPage() already guarantees the content fits.

   html-to-image's *automatic* font embedding scans the page's
   stylesheets for @font-face rules and inlines them — but that
   scan silently fails on a cross-origin stylesheet like Google
   Fonts (reading its CSSOM rules throws a SecurityError), so the
   export can quietly fall back to a generic system font. Two
   strategies are used to fix this, tried in order:

   1) LOCAL FONT FILES (fully reliable): if you've added the
      optional "fonts" folder next to this site (see setup notes),
      those files are same-origin, so embedding them as base64
      never runs into any CORS issue at all.
   2) GOOGLE FONTS FALLBACK: if the local files aren't present,
      fetch the Google Fonts CSS + font files directly and inline
      them the same way. This works as long as the browser allows
      the request (Google Fonts serves CORS-friendly responses),
      but is one extra network dependency at export time.
   ============================================================ */
const LOCAL_FONT_FILES = [
  { family: 'Cairo', weight: '200 1000', format: 'woff2-variations', path: 'fonts/cairo-variable.woff2' },
  { family: 'Aref Ruqaa', weight: '400', format: 'woff2', path: 'fonts/aref-ruqaa-400.woff2' },
  { family: 'Aref Ruqaa', weight: '700', format: 'woff2', path: 'fonts/aref-ruqaa-700.woff2' },
];
const GOOGLE_FONTS_CSS_URL = "https://fonts.googleapis.com/css2?family=Aref+Ruqaa:wght@400;700&family=Cairo:wght@300;400;500;600;700;800;900&display=swap";
let cachedFontEmbedCss = null;

async function blobToDataUrl(blob){
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

async function buildLocalFontEmbedCss(){
  const rules = await Promise.all(LOCAL_FONT_FILES.map(async ({ family, weight, format, path }) => {
    const res = await fetch(path);
    if(!res.ok) throw new Error(`Local font file missing: ${path}`);
    const dataUrl = await blobToDataUrl(await res.blob());
    return `@font-face{font-family:'${family}';font-style:normal;font-weight:${weight};font-display:swap;src:url(${dataUrl}) format('${format}');}`;
  }));
  return rules.join('\n');
}

async function buildGoogleFontEmbedCss(){
  const cssText = await fetch(GOOGLE_FONTS_CSS_URL).then(r => r.text());
  const fontUrls = [...cssText.matchAll(/url\((https:\/\/[^)]+)\)/g)].map(m => m[1]);

  let embedded = cssText;
  await Promise.all(fontUrls.map(async (url) => {
    try{
      const dataUrl = await blobToDataUrl(await fetch(url).then(r => r.blob()));
      embedded = embedded.split(url).join(dataUrl);
    } catch(e){
      console.warn('Could not embed font file, export may fall back for it:', url, e);
    }
  }));
  return embedded;
}

async function buildFontEmbedCss(){
  if(cachedFontEmbedCss) return cachedFontEmbedCss;
  try{
    cachedFontEmbedCss = await buildLocalFontEmbedCss();
    return cachedFontEmbedCss;
  } catch(e){
    console.info('Local font files not found (this is optional), falling back to Google Fonts for the export:', e.message);
  }
  cachedFontEmbedCss = await buildGoogleFontEmbedCss();
  return cachedFontEmbedCss;
}

/* ============================================================
   REQUIRED FIELD VALIDATION
   ============================================================ */
function validateRequiredFields(){
  const requiredFields = [
    { input: el.deceasedName, label: 'الاسم الكامل' },
    { input: el.mosqueName, label: 'مكان الصلاة (المسجد/الجامع)' },
  ];
  const missing = [];
  requiredFields.forEach(({ input, label }) => {
    const fieldLabel = document.querySelector(`label[for="${input.id}"]`);
    const isEmpty = !input.value.trim();
    input.classList.toggle('invalid', isEmpty);
    if(fieldLabel) fieldLabel.classList.toggle('invalid', isEmpty);
    if(isEmpty) missing.push({ input, label });
  });
  return missing;
}
// clear the red "invalid" state the moment the person starts fixing it
[el.deceasedName, el.mosqueName].forEach(input => {
  input.addEventListener('input', () => {
    if(input.value.trim()){
      input.classList.remove('invalid');
      const fieldLabel = document.querySelector(`label[for="${input.id}"]`);
      if(fieldLabel) fieldLabel.classList.remove('invalid');
    }
  });
});

/* ============================================================
   DELIVER THE FINAL IMAGE TO THE PERSON
   Tries strategies in order, each a real fallback for when the
   previous one isn't available or fails:

   1) Web Share API with a file attached — but ONLY on phones/
      tablets. Desktop Chrome/Edge on Windows now also implement
      navigator.share, which would otherwise hijack a normal
      desktop download into an unexpected OS share popup. On
      mobile this is genuinely useful (native Save Image / send
      to an app), so it stays there.
   2) A normal <a download> click on a Blob URL — the default for
      everyone else, behaves like a regular image download.
   3) A fallback panel (open in new tab / copy image / copy link)
      only shown if the direct download demonstrably failed.
   ============================================================ */
function isMobileDevice(){
  return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent || '');
}

async function deliverImage(blob, filename){
  if(isMobileDevice() && navigator.canShare && navigator.share){
    try{
      const file = new File([blob], filename, { type: 'image/png' });
      if(navigator.canShare({ files: [file] })){
        await navigator.share({ files: [file], title: 'نعوة', text: 'صدقة جارية عن روح الدكتور غازي غزيّل وزوجته جمال ملك' });
        return;
      }
    } catch(err){
      if(err && err.name === 'AbortError') return; // person closed the share sheet — not an error
      console.warn('Web Share failed, falling back to direct download:', err);
    }
  }

  const objectUrl = URL.createObjectURL(blob);
  let downloadLikelyWorked = true;
  try{
    const link = document.createElement('a');
    link.download = filename;
    link.href = objectUrl;
    document.body.appendChild(link);
    link.click();
    link.remove();
  } catch(err){
    downloadLikelyWorked = false;
  }

  if(!downloadLikelyWorked){
    showSaveOptionsPanel(objectUrl, blob, filename);
  } else {
    setTimeout(() => URL.revokeObjectURL(objectUrl), 30000);
  }
}

function showSaveOptionsPanel(imageUrl, blob, filename){
  const modal = document.createElement('div');
  modal.className = 'save-modal';
  modal.innerHTML = `
    <div class="save-modal-inner">
      <p>يبدو أن التنزيل المباشر لم ينجح. جرّب إحدى الطرق التالية:</p>

      <button type="button" class="btn btn-primary btn-save-option" id="openImageTab">
        فتح الصورة في نافذة جديدة (ثم اضغط عليها مطوّلًا لحفظها)
      </button>

      <button type="button" class="btn btn-secondary btn-save-option" id="copyImageBtn">
        نسخ الصورة (للصقها في محادثة أو تطبيق آخر)
      </button>

      <button type="button" class="btn btn-secondary btn-save-option" id="copyLinkBtn">
        نسخ رابط هذه الصفحة لفتحه في متصفحك (Chrome / Safari)
      </button>

      <img src="${imageUrl}" alt="النعوة" class="save-modal-img">

      <button type="button" class="btn btn-link" id="closeSaveModal">إغلاق</button>
    </div>
  `;
  document.body.appendChild(modal);

  document.getElementById('openImageTab').addEventListener('click', () => {
    window.open(imageUrl, '_blank');
  });

  document.getElementById('copyImageBtn').addEventListener('click', async () => {
    try{
      if(!navigator.clipboard || !window.ClipboardItem) throw new Error('unsupported');
      await navigator.clipboard.write([ new ClipboardItem({ 'image/png': blob }) ]);
      alert('تم نسخ الصورة. يمكنك الآن لصقها في أي محادثة أو تطبيق ثم حفظها من هناك.');
    } catch(err){
      alert('نسخ الصورة غير مدعوم في هذا المتصفح. جرّب أحد الخيارات الأخرى.');
    }
  });

  document.getElementById('copyLinkBtn').addEventListener('click', async () => {
    try{
      await navigator.clipboard.writeText(location.href);
      alert('تم نسخ رابط الصفحة. الصقه في متصفحك (Chrome أو Safari) ثم أعد تنزيل الصورة من هناك.');
    } catch(err){
      prompt('انسخ هذا الرابط والصقه في متصفحك:', location.href);
    }
  });

  document.getElementById('closeSaveModal').addEventListener('click', () => {
    modal.remove();
    URL.revokeObjectURL(imageUrl);
  });
}

/* Turn any thrown value (Error, DOMException, or a raw failed-resource
   Event — html-to-image sometimes rejects with the image's own error
   Event instead of a proper Error) into a readable string. */
function describeError(err){
  if(!err) return 'خطأ غير معروف';
  if(err instanceof Error) return `${err.name || 'Error'}: ${err.message || '(بلا رسالة)'}`;
  if(typeof Event !== 'undefined' && err instanceof Event){
    const target = err.target;
    const targetInfo = target ? `${target.tagName || ''}${target.src ? ' src=' + String(target.src).slice(0, 80) : ''}` : '';
    return `فشل تحميل مورد أثناء إنشاء الصورة (${err.type}${targetInfo ? ', ' + targetInfo : ''})`;
  }
  try{ return JSON.stringify(err); } catch(e){ return String(err); }
}

/* Try to export with the embedded custom fonts first (best visual match
   to the on-screen preview). If that fails for ANY reason — including
   the oversized-embedded-font-data edge case that can break the
   underlying SVG image render — retry once with no font embedding at
   all, so a font problem never blocks the download entirely. */
async function exportCardToBlob(){
  const baseOptions = {
    width: 794,
    height: 1123,
    pixelRatio: 3,
    backgroundColor: '#ffffff',
    cacheBust: true,
    style: { transform: 'none' },
  };

  let fontEmbedCss;
  try{
    fontEmbedCss = await buildFontEmbedCss();
  } catch(e){
    console.warn('Font embedding failed, exporting without it:', e);
  }

  if(fontEmbedCss){
    try{
      const blob = await htmlToImage.toBlob(el.card, { ...baseOptions, fontEmbedCSS: fontEmbedCss });
      if(blob) return blob;
    } catch(err){
      console.warn('Export with embedded fonts failed, retrying without font embedding:', err);
    }
  }

  // fallback: no custom font embedding — relies on whatever html-to-image
  // manages on its own. Slightly less guaranteed to match the on-screen
  // font exactly, but far more likely to succeed.
  const blob = await htmlToImage.toBlob(el.card, baseOptions);
  if(!blob) throw new Error('لم يتمكن المتصفح من إنشاء الصورة (blob فارغ)');
  return blob;
}

/* Fires a GA4 event if Google Analytics is set up (see index.html for
   setup steps); silently does nothing otherwise, so the site behaves
   identically whether or not analytics is configured. */
function trackEvent(eventName, extra){
  if(typeof gtag === 'function'){
    gtag('event', eventName, extra || {});
  }
}

/* Catch ANY unexpected error anywhere on the page — not just the
   download flow — so problems in other features (photo editor,
   date picking, etc.) are visible too, without needing someone to
   actually report them. Shows up in GA as a "js_error" event with
   the message and location, so it's diagnosable, not just a count. */
window.addEventListener('error', (e) => {
  trackEvent('js_error', {
    event_category: 'error',
    message: String(e.message || '').slice(0, 150),
    location: `${(e.filename || '').split('/').pop()}:${e.lineno || ''}`,
  });
});
window.addEventListener('unhandledrejection', (e) => {
  trackEvent('js_error', {
    event_category: 'error',
    message: 'unhandled promise rejection: ' + describeError(e.reason).slice(0, 150),
  });
});

async function handleDownloadClick(){
  const allDownloadBtns = Array.from(document.querySelectorAll('.download-btn'));
  const originalStates = allDownloadBtns.map(b => b.innerHTML);

  const missing = validateRequiredFields();
  if(missing.length){
    missing[0].input.scrollIntoView({ behavior:'smooth', block:'center' });
    missing[0].input.focus();
    alert(`الرجاء تعبئة الحقول المطلوبة أولًا:\n${missing.map(m => '• ' + m.label).join('\n')}`);
    return;
  }

  trackEvent('download_click', { event_category: 'engagement' });

  allDownloadBtns.forEach(b => { b.disabled = true; b.innerHTML = 'جارٍ التجهيز…'; });

  try{
    if(document.fonts && document.fonts.ready){
      await document.fonts.ready;
    }

    const blob = await exportCardToBlob();
    const nameSlug = (el.deceasedName.value.trim() || 'نعوة').replace(/\s+/g,'_');
    await deliverImage(blob, `نعوة_${nameSlug}.png`);
    trackEvent('download_success', { event_category: 'engagement' });
  } catch(err){
    console.error('PNG export failed:', err);
    trackEvent('download_failed', { event_category: 'engagement', error_detail: describeError(err).slice(0, 100) });
    alert(
      'حدث خطأ أثناء إنشاء الصورة.\n\n' +
      'تفاصيل تقنية (للمساعدة في التشخيص):\n' + describeError(err) + '\n\n' +
      'جرّب تحديث الصفحة والمحاولة مجددًا. إذا تكرر الخطأ، أرسل لي نص "التفاصيل التقنية" أعلاه بالضبط لأتمكن من تحديد السبب.'
    );
  } finally {
    allDownloadBtns.forEach((b, i) => { b.disabled = false; b.innerHTML = originalStates[i]; });
  }
}
document.querySelectorAll('.download-btn').forEach(btn => {
  btn.addEventListener('click', handleDownloadClick);
});


/* ============================================================
   BOOT
   ============================================================ */
regenerateAll();
renderCard();
requestAnimationFrame(scalePreview);

})();
