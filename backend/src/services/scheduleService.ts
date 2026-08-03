// Lógica pura de cálculo de horarios (sin acceso a DB ni a Express), para poder testearla aislada.

export interface TimeRange {
  startTime: string; // 'HH:mm' o 'HH:mm:ss'
  endTime: string;
}

export interface ExceptionRange extends Partial<TimeRange> {
  isBlocked: boolean;
}

export interface MinuteRange {
  start: number;
  end: number;
}

export interface Slot {
  startTime: string; // 'HH:mm'
  endTime: string;
  startMinutes: number;
  endMinutes: number;
}

export function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

export function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60)
    .toString()
    .padStart(2, '0');
  const m = (minutes % 60).toString().padStart(2, '0');
  return `${h}:${m}`;
}

function subtractRange(windows: MinuteRange[], block: MinuteRange): MinuteRange[] {
  const result: MinuteRange[] = [];
  for (const w of windows) {
    if (block.end <= w.start || block.start >= w.end) {
      result.push(w);
      continue;
    }
    if (block.start > w.start) {
      result.push({ start: w.start, end: Math.min(block.start, w.end) });
    }
    if (block.end < w.end) {
      result.push({ start: Math.max(block.end, w.start), end: w.end });
    }
  }
  return result.filter((w) => w.end > w.start);
}

function mergeAndSort(windows: MinuteRange[]): MinuteRange[] {
  const sorted = [...windows].sort((a, b) => a.start - b.start);
  const merged: MinuteRange[] = [];
  for (const w of sorted) {
    const last = merged[merged.length - 1];
    if (last && w.start <= last.end) {
      last.end = Math.max(last.end, w.end);
    } else {
      merged.push({ ...w });
    }
  }
  return merged;
}

/** Ventanas de tiempo (en minutos) en las que un profesional está disponible ese día. */
export function computeDayWindows(availabilities: TimeRange[], exceptions: ExceptionRange[]): MinuteRange[] {
  const blocksWholeDay = exceptions.some((e) => e.isBlocked && !e.startTime && !e.endTime);
  if (blocksWholeDay) return [];

  let windows: MinuteRange[] = availabilities.map((a) => ({
    start: timeToMinutes(a.startTime),
    end: timeToMinutes(a.endTime),
  }));

  for (const e of exceptions) {
    if (e.isBlocked && e.startTime && e.endTime) {
      windows = subtractRange(windows, { start: timeToMinutes(e.startTime), end: timeToMinutes(e.endTime) });
    }
  }
  for (const e of exceptions) {
    if (!e.isBlocked && e.startTime && e.endTime) {
      windows.push({ start: timeToMinutes(e.startTime), end: timeToMinutes(e.endTime) });
    }
  }

  return mergeAndSort(windows);
}

function generateCandidateSlots(windows: MinuteRange[], durationMinutes: number): MinuteRange[] {
  const slots: MinuteRange[] = [];
  for (const w of windows) {
    let cursor = w.start;
    while (cursor + durationMinutes <= w.end) {
      slots.push({ start: cursor, end: cursor + durationMinutes });
      cursor += durationMinutes;
    }
  }
  return slots;
}

function excludeBusy(slots: MinuteRange[], busyRanges: MinuteRange[]): MinuteRange[] {
  return slots.filter((s) => !busyRanges.some((b) => s.start < b.end && b.start < s.end));
}

export function computeAvailableSlots(params: {
  availabilities: TimeRange[];
  exceptions: ExceptionRange[];
  busyRanges: MinuteRange[];
  durationMinutes: number;
}): Slot[] {
  const windows = computeDayWindows(params.availabilities, params.exceptions);
  const candidates = generateCandidateSlots(windows, params.durationMinutes);
  const free = excludeBusy(candidates, params.busyRanges);

  return free.map((s) => ({
    startMinutes: s.start,
    endMinutes: s.end,
    startTime: minutesToTime(s.start),
    endTime: minutesToTime(s.end),
  }));
}
