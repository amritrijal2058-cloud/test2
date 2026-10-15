/**************************************************************
 * STATE, CONSTANTS & THEME PALETTE
 **************************************************************/
const STORAGE_KEY = 'habit_pulse_dashboard_v1';
const DAYS_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const THEMES = {
    emerald: {
        name: 'Emerald',
        emoji: '💪',
        bgActive: 'bg-emerald-500',
        borderActive: 'border-emerald-400',
        textActive: 'text-emerald-400',
        softBg: 'bg-emerald-500/15',
        softBorder: 'border-emerald-500/30',
        barColor: 'bg-emerald-400',
        ring: 'ring-emerald-500/40'
    },
    amber: {
        name: 'Amber',
        emoji: '⚡',
        bgActive: 'bg-amber-400',
        borderActive: 'border-amber-300',
        textActive: 'text-amber-400',
        softBg: 'bg-amber-500/15',
        softBorder: 'border-amber-500/30',
        barColor: 'bg-amber-400',
        ring: 'ring-amber-500/40'
    },
    violet: {
        name: 'Violet',
        emoji: '💻',
        bgActive: 'bg-violet-500',
        borderActive: 'border-violet-400',
        textActive: 'text-violet-400',
        softBg: 'bg-violet-500/15',
        softBorder: 'border-violet-500/30',
        barColor: 'bg-violet-400',
        ring: 'ring-violet-500/40'
    },
    rose: {
        name: 'Rose',
        emoji: '✨',
        bgActive: 'bg-rose-500',
        borderActive: 'border-rose-400',
        textActive: 'text-rose-400',
        softBg: 'bg-rose-500/15',
        softBorder: 'border-rose-500/30',
        barColor: 'bg-rose-400',
        ring: 'ring-rose-500/40'
    },
    cyan: {
        name: 'Cyan',
        emoji: '💧',
        bgActive: 'bg-cyan-400',
        borderActive: 'border-cyan-300',
        textActive: 'text-cyan-400',
        softBg: 'bg-cyan-500/15',
        softBorder: 'border-cyan-500/30',
        barColor: 'bg-cyan-400',
        ring: 'ring-cyan-500/40'
    }
};

const THEME_KEYS = Object.keys(THEMES);
let selectedModalTheme = 'emerald';
let quickThemeIndex = 0;

// Current day of week index (0 = Mon ... 6 = Sun)
function getCurrentDayIndex() {
    const jsDay = new Date().getDay();
    return jsDay === 0 ? 6 : jsDay - 1;
}

const todayIndex = getCurrentDayIndex();
let focusedDayIndex = todayIndex;

function getDefaultHabits() {
    const makeProgress = (pattern) => {
        return DAYS_SHORT.map((_, idx) => idx <= todayIndex ? Boolean(pattern[idx]) : false);
    };

    return [
        { id: 'hab-1', name: 'Upper Body Workout', category: 'Fitness', meta: '45m hypertrophy', theme: 'emerald', emoji: '💪', days: makeProgress([1, 1, 0, 1, 1, 0, 1]) },
        { id: 'hab-2', name: 'Creatine & Protein', category: 'Nutrition', meta: '5g + 30g whey', theme: 'amber', emoji: '⚡', days: makeProgress([1, 1, 1, 1, 1, 1, 1]) },
        { id: 'hab-3', name: 'Python/SQL Study', category: 'Learning', meta: '1 hr deep work', theme: 'violet', emoji: '💻', days: makeProgress([1, 0, 1, 1, 1, 0, 0]) },
        { id: 'hab-4', name: 'Skincare Routine', category: 'Wellness', meta: 'AM + PM SPF/Retinol', theme: 'rose', emoji: '✨', days: makeProgress([1, 1, 1, 0, 1, 1, 1]) },
        { id: 'hab-5', name: 'Hydration (3L Water)', category: 'Health', meta: '3,000 ml', theme: 'cyan', emoji: '💧', days: makeProgress([1, 1, 1, 1, 0, 1, 1]) }
    ];
}

let habits = [];

/**************************************************************
 * LOCAL STORAGE PERSISTENCE
 **************************************************************/
function loadHabits() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) {
                habits = parsed;
                return;
            }
        }
    } catch (err) {
        console.error('Failed to read habits from localStorage:', err);
    }
    habits = getDefaultHabits();
    saveHabits();
}

function saveHabits() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(habits));
    } catch (err) {
        console.error('Failed to save habits to localStorage:', err);
    }
}

/**************************************************************
 * STREAK & ANALYTICS CALCULATIONS
 **************************************************************/
function calculateStreak(daysArray) {
    let currentRun = 0;
    let maxRun = 0;
    for (let i = 0; i < 7; i++) {
        if (daysArray[i]) {
            currentRun++;
            if (currentRun > maxRun) maxRun = currentRun;
        } else if (i <= todayIndex) {
            currentRun = 0;
        }
    }
    return maxRun;
}

function getWeekDates() {
    const now = new Date();
    const currentDay = now.getDay();
    const diffToMonday = currentDay === 0 ? -6 : 1 - currentDay;
    const monday = new Date(now);
    monday.setDate(now.getDate() + diffToMonday);

    return DAYS_SHORT.map((label, idx) => {
        const d = new Date(monday);
        d.setDate(monday.getDate() + idx);
        return {
            label,
            dateNum: d.getDate(),
            isToday: idx === todayIndex
        };
    });
}

/**************************************************************
 * UI RENDERING
 **************************************************************/
function renderHeaderDate() {
    const now = new Date();
    const options = { weekday: 'short', month: 'short', day: 'numeric' };
    document.getElementById('currentDateDisplay').textContent =
        now.toLocaleDateString(undefined, options) + ' • Week View';
}

function renderStatsAndChart() {
    const totalHabits = habits.length;
    const weekDates = getWeekDates();

    const completedToday = habits.filter(h => h.days[todayIndex]).length;
    const todayPct = totalHabits > 0 ? Math.round((completedToday / totalHabits) * 100) : 0;

    document.getElementById('todayScoreText').textContent = `${completedToday}/${totalHabits}`;
    document.getElementById('todayProgressBar').style.width = `${todayPct}%`;

    const totalPossibleWeek = totalHabits * 7;
    let totalChecksWeek = 0;
    let bestStreak = 0;
    let perfectDaysCount = 0;

    habits.forEach(h => {
        const s = calculateStreak(h.days);
        if (s > bestStreak) bestStreak = s;
        h.days.forEach(done => {
            if (done) totalChecksWeek++;
        });
    });

    const weeklyPct = totalPossibleWeek > 0 ? Math.round((totalChecksWeek / totalPossibleWeek) * 100) : 0;
    document.getElementById('weeklyPercentText').textContent = `${weeklyPct}%`;
    document.getElementById('weeklySubText').textContent = `${totalChecksWeek} of ${totalPossibleWeek} check-ins`;

    const chartContainer = document.getElementById('weeklyChartContainer');
    chartContainer.innerHTML = '';

    weekDates.forEach((dayObj, dIdx) => {
        const completedOnDay = habits.filter(h => h.days[dIdx]).length;
        const pct = totalHabits > 0 ? Math.round((completedOnDay / totalHabits) * 100) : 0;
        if (totalHabits > 0 && completedOnDay === totalHabits) {
            perfectDaysCount++;
        }

        const isFocused = dIdx === focusedDayIndex;
        const isPerfect = totalHabits > 0 && completedOnDay === totalHabits;

        let barColorClass = 'bg-zinc-700';
        if (isPerfect) {
            barColorClass = 'bg-gradient-to-t from-emerald-500 to-teal-300 shadow-lg shadow-emerald-500/20';
        } else if (completedOnDay > 0) {
            barColorClass = 'bg-gradient-to-t from-sky-500 to-cyan-300';
        }

        const barHeight = totalHabits === 0 ? 8 : Math.max(10, pct);

        const col = document.createElement('button');
        col.type = 'button';
        col.onclick = () => {
            focusedDayIndex = dIdx;
            renderStatsAndChart();
        };
        col.className = `group flex flex-col items-center justify-end h-full rounded-xl p-1 transition select-none ${
            isFocused ? 'bg-zinc-800/90 ring-1 ring-zinc-700' : 'hover:bg-zinc-800/40'
        }`;

        col.innerHTML = `
            <span class="text-[10px] font-bold ${
                isPerfect ? 'text-emerald-400' : completedOnDay > 0 ? 'text-zinc-300' : 'text-zinc-500'
            } mb-1">
                ${completedOnDay}/${totalHabits}
            </span>
            <div class="w-full max-w-[28px] h-20 bg-zinc-950 rounded-lg p-0.5 flex items-end overflow-hidden border border-zinc-800/80">
                <div class="w-full rounded-md bar-transition ${barColorClass}" style="height: ${barHeight}%"></div>
            </div>
            <div class="mt-1.5 flex flex-col items-center">
                <span class="text-[11px] font-bold ${
                    dayObj.isToday ? 'text-emerald-400' : isFocused ? 'text-white' : 'text-zinc-400'
                }">${dayObj.label}</span>
                <span class="text-[9px] font-semibold ${
                    dayObj.isToday ? 'bg-emerald-500/20 text-emerald-300 px-1.5 rounded-full' : 'text-zinc-500'
                }">${dayObj.dateNum}</span>
            </div>
        `;
        chartContainer.appendChild(col);
    });

    document.getElementById('bestStreakText').textContent = bestStreak;
    document.getElementById('perfectDaysText').textContent = `${perfectDaysCount} perfect ${perfectDaysCount === 1 ? 'day' : 'days'}`;
    document.getElementById('habitCountBadge').textContent = totalHabits;
}

function renderHabitsList() {
    const container = document.getElementById('habitsListContainer');
    const emptyState = document.getElementById('emptyState');
    const weekDates = getWeekDates();

    if (habits.length === 0) {
        container.innerHTML = '';
        emptyState.classList.remove('hidden');
        return;
    }

    emptyState.classList.add('hidden');
    container.innerHTML = '';

    habits.forEach((habit) => {
        const theme = THEMES[habit.theme] || THEMES.emerald;
        const weeklyCount = habit.days.filter(Boolean).length;
        const streak = calculateStreak(habit.days);
        const weeklyRate = Math.round((weeklyCount / 7) * 100);

        const card = document.createElement('div');
        card.className = 'bg-zinc-900/95 border border-zinc-800/90 rounded-2xl p-4 shadow-lg transition hover:border-zinc-700/80';

        let dayButtonsHTML = '';
        weekDates.forEach((dObj, dIdx) => {
            const isChecked = Boolean(habit.days[dIdx]);
            const isToday = dObj.isToday;

            const btnClasses = isChecked
                ? `${theme.bgActive} text-zinc-950 font-extrabold shadow-md`
                : isToday
                ? 'bg-zinc-800/90 text-zinc-200 border border-zinc-600/80'
                : 'bg-zinc-950/90 text-zinc-500 border border-zinc-800/90 hover:border-zinc-700';

            dayButtonsHTML += `
                <button
                    type="button"
                    onclick="toggleHabitDay('${habit.id}', ${dIdx}, this)"
                    aria-label="Toggle ${escapeHTML(habit.name)} for ${dObj.label}"
                    class="flex flex-col items-center justify-center py-2 rounded-xl transition active:scale-90 select-none ${btnClasses}"
                >
                    <span class="text-[10px] uppercase tracking-tighter ${isChecked ? 'text-zinc-950/80 font-bold' : 'text-zinc-400'}">
                        ${dObj.label}
                    </span>
                    <div class="mt-1 w-5 h-5 rounded-full flex items-center justify-center">
                        ${
                            isChecked
                                ? `<svg class="w-4 h-4 stroke-[3] text-zinc-950" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>`
                                : `<span class="text-[11px] font-semibold ${isToday ? 'text-white' : 'text-zinc-500'}">${dObj.dateNum}</span>`
                        }
                    </div>
                </button>
            `;
        });

        card.innerHTML = `
            <div class="flex items-start justify-between gap-2 mb-3">
                <div class="flex items-center gap-3 min-w-0">
                    <div class="w-10 h-10 rounded-xl ${theme.softBg} border ${theme.softBorder} flex items-center justify-center text-lg shrink-0">
                        ${habit.emoji || theme.emoji}
                    </div>
                    <div class="min-w-0">
                        <div class="flex items-center gap-2">
                            <h3 class="text-sm font-bold text-white truncate">${escapeHTML(habit.name)}</h3>
                        </div>
                        <div class="flex items-center gap-2 mt-0.5 text-[11px] text-zinc-400">
                            <span class="font-medium text-zinc-300">${escapeHTML(habit.category || 'Daily')}</span>
                            ${habit.meta ? `<span>•</span><span class="truncate">${escapeHTML(habit.meta)}</span>` : ''}
                        </div>
                    </div>
                </div>

                <div class="flex items-center gap-1.5 shrink-0">
                    <div class="flex items-center gap-1 px-2.5 py-1 rounded-full bg-zinc-950 border border-zinc-800 text-xs font-bold ${streak > 0 ? theme.textActive : 'text-zinc-500'}" title="Best streak this week">
                        <i data-lucide="flame" class="w-3.5 h-3.5 ${streak > 0 ? 'fill-current' : ''}"></i>
                        <span>${streak}d</span>
                    </div>
                    <button
                        type="button"
                        onclick="requestDeleteHabit('${habit.id}')"
                        class="p-1.5 rounded-xl text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition"
                        title="Delete habit"
                    >
                        <i data-lucide="trash-2" class="w-4 h-4"></i>
                    </button>
                </div>
            </div>

            <div class="grid grid-cols-7 gap-1.5">
                ${dayButtonsHTML}
            </div>

            <div class="mt-3 flex items-center justify-between gap-3">
                <div class="w-full bg-zinc-950 h-1.5 rounded-full overflow-hidden border border-zinc-800/60">
                    <div class="${theme.barColor} h-full rounded-full transition-all duration-300" style="width: ${weeklyRate}%"></div>
                </div>
                <span class="text-[11px] font-bold text-zinc-400 shrink-0">${weeklyCount}/7 days</span>
            </div>
        `;

        container.appendChild(card);
    });

    lucide.createIcons();
}

function renderAll() {
    renderStatsAndChart();
    renderHabitsList();
}

/**************************************************************
 * USER INTERACTIONS & ACTIONS
 **************************************************************/
function toggleHabitDay(habitId, dayIdx, btnElement) {
    const habit = habits.find(h => h.id === habitId);
    if (!habit) return;

    habit.days[dayIdx] = !habit.days[dayIdx];
    focusedDayIndex = dayIdx;
    saveHabits();

    renderAll();
    if (habit.days[dayIdx]) {
        showToast(`${habit.emoji} ${habit.name} logged!`);
    }
}

function markAllToday() {
    if (habits.length === 0) return;
    const allDone = habits.every(h => h.days[todayIndex]);
    habits.forEach(h => {
        h.days[todayIndex] = !allDone;
    });
    focusedDayIndex = todayIndex;
    saveHabits();
    renderAll();
    showToast(allDone ? 'Cleared today\'s check-ins' : 'All goals completed for today! 🔥');
}

function cycleQuickColor() {
    quickThemeIndex = (quickThemeIndex + 1) % THEME_KEYS.length;
    const themeKey = THEME_KEYS[quickThemeIndex];
    const theme = THEMES[themeKey];
    document.getElementById('quickEmojiDisplay').textContent = theme.emoji;
}

function handleQuickAdd(e) {
    e.preventDefault();
    const input = document.getElementById('quickHabitInput');
    const name = input.value.trim();
    if (!name) return;

    const themeKey = THEME_KEYS[quickThemeIndex];
    const theme = THEMES[themeKey];

    const newHabit = {
        id: 'hab-' + Date.now(),
        name,
        category: 'Custom',
        meta: 'Daily goal',
        theme: themeKey,
        emoji: theme.emoji,
        days: [false, false, false, false, false, false, false]
    };

    habits.unshift(newHabit);
    saveHabits();
    renderAll();
    input.value = '';
    showToast(`Added "${name}"`);
}

/**************************************************************
 * MODAL MANAGEMENT (ADD & CONFIRMATION)
 **************************************************************/
function renderColorPicker() {
    const grid = document.getElementById('colorPickerGrid');
    grid.innerHTML = '';
    THEME_KEYS.forEach(key => {
        const t = THEMES[key];
        const isSelected = key === selectedModalTheme;
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.onclick = () => {
            selectedModalTheme = key;
            renderColorPicker();
        };
        btn.className = `flex flex-col items-center justify-center py-2 rounded-xl border text-xs font-semibold transition ${
            isSelected
                ? `${t.softBg} ${t.borderActive} text-white ring-2 ${t.ring}`
                : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
        }`;
        btn.innerHTML = `
            <span class="text-base">${t.emoji}</span>
            <span class="text-[10px] mt-0.5">${t.name}</span>
        `;
        grid.appendChild(btn);
    });
}

function openAddModal() {
    selectedModalTheme = 'emerald';
    renderColorPicker();
    document.getElementById('modalHabitName').value = '';
    document.getElementById('modalHabitMeta').value = '';
    const modal = document.getElementById('addModal');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    setTimeout(() => document.getElementById('modalHabitName').focus(), 100);
}

function closeAddModal() {
    const modal = document.getElementById('addModal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
}

function handleModalAdd(e) {
    e.preventDefault();
    const name = document.getElementById('modalHabitName').value.trim();
    const category = document.getElementById('modalHabitCategory').value;
    const meta = document.getElementById('modalHabitMeta').value.trim() || 'Daily target';
    if (!name) return;

    const theme = THEMES[selectedModalTheme] || THEMES.emerald;
    const newHabit = {
        id: 'hab-' + Date.now(),
        name,
        category,
        meta,
        theme: selectedModalTheme,
        emoji: theme.emoji,
        days: [false, false, false, false, false, false, false]
    };

    habits.unshift(newHabit);
    saveHabits();
    renderAll();
    closeAddModal();
    showToast(`Created "${name}"`);
}

function requestDeleteHabit(habitId) {
    const habit = habits.find(h => h.id === habitId);
    if (!habit) return;

    const modal = document.getElementById('confirmModal');
    document.getElementById('confirmModalTitle').textContent = `Delete "${habit.name}"?`;
    document.getElementById('confirmModalDesc').textContent =
        'This will remove this habit and its weekly streak history from your dashboard.';

    const confirmBtn = document.getElementById('confirmModalActionBtn');
    confirmBtn.textContent = 'Delete Habit';
    confirmBtn.onclick = () => {
        habits = habits.filter(h => h.id !== habitId);
        saveHabits();
        renderAll();
        closeConfirmModal();
        showToast('Habit deleted');
    };

    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

function openResetModal() {
    const modal = document.getElementById('confirmModal');
    document.getElementById('confirmModalTitle').textContent = 'Restore Default Habits?';
    document.getElementById('confirmModalDesc').textContent =
        'This will reset your dashboard to the 5 default habits (Upper Body Workout, Creatine & Protein, Python/SQL Study, Skincare, Hydration).';

    const confirmBtn = document.getElementById('confirmModalActionBtn');
    confirmBtn.textContent = 'Restore Defaults';
    confirmBtn.onclick = () => {
        restoreDefaults();
        closeConfirmModal();
    };

    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

function closeConfirmModal() {
    const modal = document.getElementById('confirmModal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
}

function restoreDefaults() {
    habits = getDefaultHabits();
    saveHabits();
    renderAll();
    showToast('Default habits restored');
}

/**************************************************************
 * UTILITIES
 **************************************************************/
let toastTimeout = null;
function showToast(message) {
    const toast = document.getElementById('toast');
    document.getElementById('toastMessage').textContent = message;
    toast.classList.remove('opacity-0', '-translate-y-2');
    toast.classList.add('opacity-100', 'translate-y-0');

    if (toastTimeout) clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
        toast.classList.remove('opacity-100', 'translate-y-0');
        toast.classList.add('opacity-0', '-translate-y-2');
    }, 2200);
}

function escapeHTML(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

window.addEventListener('DOMContentLoaded', () => {
    renderHeaderDate();
    loadHabits();
    renderAll();
    lucide.createIcons();
});
