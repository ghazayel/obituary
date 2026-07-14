(function(){
"use strict";

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
  "وبشرى الصابرين الذين إذا أصابتهم مصيبة قالوا إنا لله وإنا إليه راجعون",
  "سبحان الحي الذي لا يموت",
  "اللهم ألهمنا الصبر والسلوان على مصابنا الجلل",
  "إنا لله وإنا إليه راجعون",
];

/* ============================================================
   STATE
   ============================================================ */
const state = {
  gender: 'male',
  photo: { dataUrl: null, naturalW: 0, naturalH: 0, rotation: 0, zoom: 1 },
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
      <input type="text" class="input rel-label" placeholder="الصلة (مثال: أشقاؤه)" value="${escapeAttr(rel.label)}">
      <input type="text" class="input rel-value" placeholder="الأسماء" value="${escapeAttr(rel.value)}">
      <button type="button" class="rel-remove" title="حذف" aria-label="حذف">×</button>
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
   PHOTO UPLOAD, ROTATE & ZOOM
   ============================================================ */
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
      el.photoZoom.value = 1;
      el.removePhoto.hidden = false;
      el.photoAdjustRow.hidden = false;
      renderCard();
    };
    img.src = reader.result;
  };
  reader.readAsDataURL(file);
});
el.removePhoto.addEventListener('click', () => {
  state.photo = { dataUrl: null, naturalW: 0, naturalH: 0, rotation: 0, zoom: 1 };
  el.photoInput.value = '';
  el.removePhoto.hidden = true;
  el.photoAdjustRow.hidden = true;
  renderCard();
});
el.rotateLeft.addEventListener('click', () => {
  state.photo.rotation = (state.photo.rotation - 90 + 360) % 360;
  renderCard();
});
el.rotateRight.addEventListener('click', () => {
  state.photo.rotation = (state.photo.rotation + 90) % 360;
  renderCard();
});
el.photoZoom.addEventListener('input', () => {
  state.photo.zoom = Number(el.photoZoom.value);
  renderCard();
});

/* Compute a transform that always covers the fixed photo frame,
   however the image is rotated, then layers the person's zoom on top. */
function applyPhotoTransform(){
  const frameW = 120, frameH = 142; // matches .card-photo-frame in CSS
  const { naturalW, naturalH, rotation, zoom } = state.photo;
  if(!naturalW || !naturalH) return;
  let effW = naturalW, effH = naturalH;
  if(rotation === 90 || rotation === 270){ [effW, effH] = [effH, effW]; }
  const coverScale = Math.max(frameW / effW, frameH / effH);
  const finalScale = coverScale * zoom;
  el.outPhoto.style.width = naturalW + 'px';
  el.outPhoto.style.height = naturalH + 'px';
  el.outPhoto.style.transform =
    `translate(-50%, -50%) rotate(${rotation}deg) scale(${finalScale})`;
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
   ============================================================ */
$('downloadBtn').addEventListener('click', async () => {
  const btn = $('downloadBtn');
  const originalHTML = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = 'جارٍ التجهيز…';

  try{
    // make sure Cairo / Aref Ruqaa are fully loaded before capturing,
    // otherwise the export can silently fall back to a system font
    if(document.fonts && document.fonts.ready){
      await document.fonts.ready;
    }

    const dataUrl = await htmlToImage.toPng(el.card, {
      width: 794,
      height: 1123,
      pixelRatio: 3,
      backgroundColor: '#ffffff',
      cacheBust: true,
      style: { transform: 'none' }, // ignore the on-screen preview scale, keep true A4 size
    });
    const link = document.createElement('a');
    const nameSlug = (el.deceasedName.value.trim() || 'نعوة').replace(/\s+/g,'_');
    link.download = `نعوة_${nameSlug}.png`;
    link.href = dataUrl;
    link.click();
  } catch(err){
    console.error(err);
    alert('حدث خطأ أثناء إنشاء الصورة. حاول مجددًا.');
  } finally {
    btn.disabled = false;
    btn.innerHTML = originalHTML;
  }
});

/* ============================================================
   BOOT
   ============================================================ */
regenerateAll();
renderCard();
requestAnimationFrame(scalePreview);

})();
