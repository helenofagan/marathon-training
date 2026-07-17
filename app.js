// NYC Marathon — 18-Week Training Plan
// Each week: Mon start date, then workouts placed Tue (tempo), Wed (easy),
// Thu (med-easy), Sun (long run). Mon/Fri/Sat default to rest unless overridden.

const STORAGE_KEY = 'marathonPlanProgress';
const RACE_DATE = '2026-11-01';

const WEEKS = [
  { mon: '2026-06-29', long: { miles: 8, note: '' }, tempo: { miles: 4, note: '@ 9:00' }, easy: { miles: 5 }, medEasy: { miles: 5 } },
  { mon: '2026-07-06', long: { miles: 9, note: '' }, tempo: { miles: 4, note: '@ 9:00' }, easy: { miles: 5 }, medEasy: { miles: 6 } },
  { mon: '2026-07-13', long: { miles: 6, note: '' }, tempo: { miles: 4, note: '@ 8:55' }, easy: { miles: 5 }, medEasy: { miles: 5 } },
  { mon: '2026-07-20', long: { miles: 11, note: '' }, tempo: { miles: 5, note: '@ 8:55' }, easy: { miles: 5 }, medEasy: { miles: 6 } },
  { mon: '2026-07-27', long: { miles: 12, note: '' }, tempo: { miles: 5, note: '@ 8:50' }, easy: { miles: 6 }, medEasy: { miles: 7 } },
  { mon: '2026-08-03', long: { miles: 9, note: '' }, tempo: { miles: 4, note: '@ 8:45' }, easy: { miles: 5 }, medEasy: { miles: 6 } },
  { mon: '2026-08-10', long: { miles: 14, note: '' }, tempo: { miles: 6, note: '@ 8:45' }, easy: { miles: 6 }, medEasy: { miles: 8 } },
  { mon: '2026-08-17', long: { miles: 15, note: '' }, tempo: { miles: 6, note: '@ 8:40' }, easy: { miles: 6 }, medEasy: { miles: 8 } },
  { mon: '2026-08-24', long: { miles: 13.1, label: 'Half Marathon', special: true }, tempo: { miles: 5, note: 'easy' }, easy: { miles: 5 }, medEasy: { miles: 5 } },
  { mon: '2026-08-31', long: { miles: 17, note: '' }, tempo: { miles: 7, note: '@ 8:40' }, easy: { miles: 7 }, medEasy: { miles: 9 } },
  { mon: '2026-09-07', long: { miles: 18, note: '' }, tempo: { miles: 7, note: '@ 8:35' }, easy: { miles: 7 }, medEasy: { miles: 9 } },
  { mon: '2026-09-14', long: { miles: 13, note: '' }, tempo: { miles: 5, note: '' }, easy: { miles: 6 }, medEasy: { miles: 7 } },
  { mon: '2026-09-21', long: { miles: 20, note: '' }, tempo: { miles: 8, note: '@ 8:35' }, easy: { miles: 7 }, medEasy: { miles: 10 } },
  { mon: '2026-09-28', long: { miles: 12, note: '' }, tempo: { miles: 6, note: '@ 8:30' }, easy: { miles: 6 }, medEasy: { miles: 8 } },
  { mon: '2026-10-05', long: { miles: 20, note: '' }, tempo: { miles: 5, note: 'easy' }, easy: { miles: 5 }, medEasy: { miles: 6 } },
  { mon: '2026-10-12', long: { miles: 12, note: '' }, tempo: { miles: 4, note: 'pace' }, easy: { miles: 5 }, medEasy: { miles: 5 } },
  { mon: '2026-10-19', long: { miles: 8, note: '' }, tempo: { miles: 3, note: 'shakeout' }, easy: { miles: 4 }, medEasy: null },
  { mon: '2026-10-26', long: { miles: 26.2, label: 'NYC Marathon', special: true }, tempo: null, easy: null, medEasy: { miles: 3, note: 'shakeout', dayOffset: 3 } },
];

function addDays(isoDate, days) {
  const d = new Date(isoDate + 'T00:00:00');
  d.setDate(d.getDate() + days);
  return d;
}

function isoOf(d) {
  return d.toISOString().slice(0, 10);
}

function fmtShort(d) {
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase();
}

function todayISO() {
  return isoOf(new Date());
}

function loadProgress() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch {
    return {};
  }
}

function saveProgress(progress) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}

function buildDays(week, index) {
  const days = [];

  const slots = [
    { key: 'rest0', offset: 0, type: 'rest', label: 'Rest' },
    { key: 'tempo', offset: 1, type: 'tempo', workout: week.tempo, label: 'Tempo' },
    { key: 'easy', offset: 2, type: 'easy', workout: week.easy, label: 'Easy' },
    { key: 'medEasy', offset: (week.medEasy && week.medEasy.dayOffset) || 3, type: 'medEasy', workout: week.medEasy, label: 'Med-Easy' },
    { key: 'rest4', offset: 4, type: 'rest', label: 'Rest' },
    { key: 'rest5', offset: 5, type: 'rest', label: 'Rest' },
    { key: 'long', offset: 6, type: 'long', workout: week.long, label: week.long.label || 'Long Run' },
  ];

  const byOffset = new Map();
  for (const slot of slots) {
    if (slot.type === 'rest') {
      if (!byOffset.has(slot.offset)) byOffset.set(slot.offset, slot);
    } else if (slot.workout) {
      byOffset.set(slot.offset, slot);
    } else if (!byOffset.has(slot.offset)) {
      byOffset.set(slot.offset, { key: slot.key, offset: slot.offset, type: 'rest', label: 'Rest' });
    }
  }

  for (let offset = 0; offset < 7; offset++) {
    const slot = byOffset.get(offset) || { offset, type: 'rest', label: 'Rest' };
    const date = addDays(week.mon, offset);
    const iso = isoOf(date);
    const w = slot.workout;
    days.push({
      id: `w${index}-${iso}`,
      iso,
      date,
      type: slot.type,
      label: w && w.label ? w.label : slot.label,
      miles: w ? w.miles : null,
      note: w ? w.note : '',
      special: !!(w && w.special),
    });
  }

  return days;
}

function computeStats(weeksData, progress, today) {
  let totalMiles = 0;
  let totalRuns = 0;
  let doneRuns = 0;
  let doneMiles = 0;

  for (const week of weeksData) {
    for (const day of week.days) {
      if (day.type === 'rest') continue;
      const done = !!progress[day.id];
      const missed = day.iso < today && !done;
      if (missed) continue;
      totalRuns++;
      totalMiles += day.miles;
      if (done) {
        doneRuns++;
        doneMiles += day.miles;
      }
    }
  }

  return { totalMiles, totalRuns, doneRuns, doneMiles };
}

function render() {
  const progress = loadProgress();
  const today = todayISO();

  const weeksData = WEEKS.map((week, i) => ({
    index: i + 1,
    mon: week.mon,
    days: buildDays(week, i + 1),
  }));

  const currentWeekIndex = weeksData.findIndex((w) => {
    const start = w.days[0].iso;
    const end = w.days[6].iso;
    return today >= start && today <= end;
  });

  const stats = computeStats(weeksData, progress, today);
  renderStats(stats, currentWeekIndex, weeksData.length);
  renderCalendar(weeksData, progress, today, currentWeekIndex);

  if (currentWeekIndex >= 0) {
    requestAnimationFrame(() => {
      const el = document.querySelector(`[data-week-index="${currentWeekIndex}"]`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }
}

function renderStats(stats, currentWeekIndex, totalWeeks) {
  const el = document.getElementById('stats');
  const weekLabel = currentWeekIndex >= 0 ? `WK ${currentWeekIndex + 1}/${totalWeeks}` : '—';
  const pct = stats.totalRuns ? Math.round((stats.doneRuns / stats.totalRuns) * 100) : 0;

  el.innerHTML = `
    <div class="stat">
      <span class="stat-value">${weekLabel}</span>
      <span class="stat-label">On Deck</span>
    </div>
    <div class="stat">
      <span class="stat-value">${stats.doneRuns}<span class="stat-of">/${stats.totalRuns}</span></span>
      <span class="stat-label">Runs Logged</span>
    </div>
    <div class="stat">
      <span class="stat-value">${Math.round(stats.doneMiles * 10) / 10}<span class="stat-of">/${Math.round(stats.totalMiles)}</span></span>
      <span class="stat-label">Miles</span>
    </div>
    <div class="stat">
      <span class="stat-value">${pct}<span class="stat-of">%</span></span>
      <span class="stat-label">Complete</span>
    </div>
  `;
}

function typeClass(type) {
  return `type-${type}`;
}

function dayCellHTML(day, isToday, progress, today) {
  const done = !!progress[day.id];
  const isRest = day.type === 'rest';
  const isMissed = !isRest && !done && day.iso < today;
  const classes = ['day', typeClass(day.type)];
  if (isToday) classes.push('is-today');
  if (done) classes.push('is-done');
  if (day.special) classes.push('is-special');
  if (isRest) classes.push('is-rest');
  if (isMissed) classes.push('is-missed');

  const milesText = day.miles != null ? `${day.miles}mi` : '';
  const note = day.note ? ` ${day.note}` : '';

  return `
    <button
      type="button"
      class="${classes.join(' ')}"
      data-day-id="${day.id}"
      ${isRest ? 'disabled' : ''}
      aria-pressed="${done}"
    >
      <span class="day-dow">${day.date.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase()}</span>
      <span class="day-date">${fmtShort(day.date)}</span>
      <span class="day-workout">
        ${day.special ? `<span class="day-flag">${day.miles === 26.2 ? '🏁' : '⚡'}</span>` : ''}
        <span class="day-label">${day.label}</span>
        ${milesText ? `<span class="day-miles">${milesText}${note}</span>` : ''}
      </span>
      ${!isRest ? `<span class="day-check" aria-hidden="true">${done ? '✓' : ''}</span>` : ''}
    </button>
  `;
}

function renderCalendar(weeksData, progress, today, currentWeekIndex) {
  const el = document.getElementById('calendar');
  el.innerHTML = weeksData
    .map((week, i) => {
      const isCurrent = i === currentWeekIndex;
      const isPast = week.days[6].iso < today;
      const rangeLabel = `${fmtShort(week.days[0].date)} – ${fmtShort(week.days[6].date)}`;
      return `
        <section class="week-card ${isCurrent ? 'is-current' : ''} ${isPast ? 'is-past' : ''}" data-week-index="${i}">
          <header class="week-header">
            <span class="week-num">Week <em>${week.index}</em></span>
            <span class="week-range">${rangeLabel}</span>
            ${isCurrent ? '<span class="week-badge">This Week</span>' : ''}
          </header>
          <div class="week-days">
            ${week.days.map((day) => dayCellHTML(day, day.iso === today, progress, today)).join('')}
          </div>
        </section>
      `;
    })
    .join('');

  el.querySelectorAll('.day:not(.is-rest)').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.dayId;
      const progress = loadProgress();
      progress[id] = !progress[id];
      if (!progress[id]) delete progress[id];
      saveProgress(progress);
      render();
    });
  });
}

document.addEventListener('DOMContentLoaded', render);
