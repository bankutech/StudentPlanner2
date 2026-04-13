import React, { createContext, useContext, useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";

const STORAGE_KEY = "studyos_react_v1";
const calculateLevel = (xp) => Math.floor(Math.sqrt(xp / 100)) + 1;
const normalizeKey = (s) => String(s ?? "").trim().toLowerCase();
const sanitizeYouTubeVideoId = (v) => {
  const s = String(v ?? "").trim();
  // Capture a typical 11-char YouTube id even if older data stored extra params.
  return s.match(/([a-zA-Z0-9_-]{11})/)?.[1] || null;
};

const defaultState = {
  userName: "Student",
  isAuthenticated: false,
  xp: 0,
  level: 1,
  tasks: [
    {
      id: uuidv4(),
      title: "Kick off your all-in-one planner",
      day: (new Date().getDay() + 6) % 7,
      subject: "General",
      priority: "high",
      deadline: new Date().toISOString().slice(0, 10),
      recurring: "none",
      done: false,
      minutesSpent: 0,
    },
  ],
  subjects: ["General"],
  habits: [
    { id: uuidv4(), name: "Morning Revision", done: false },
    { id: uuidv4(), name: "Problem Solving", done: false },
    { id: uuidv4(), name: "Exercise", done: false },
    { id: uuidv4(), name: "No Phone Study", done: false }
  ],
  habitLogs: {}, // date: { habitId: true/false }
  progress: { General: 0 },
  goals: [],
  focusSeconds: 0,
  pomodoroMode: "deep", // 'deep', 'short', 'long'
  pomodoroSecondsLeft: 25 * 60,
  pomodoroRunning: false,
  pomodoros: [], // history log
  notes: [
    { id: uuidv4(), title: "Semester Orientation", content: "# Welcome to StudyOS\nThis is your space for notes." }
  ],
  flashcards: [
    { id: uuidv4(), q: "What is Time Complexity?", a: "The computational complexity that describes the amount of computer time it takes to run an algorithm." }
  ],
  exams: [{ id: uuidv4(), title: "Midterm", date: new Date().toISOString().slice(0, 10) }],
  grades: [], // { id, name, val, credits }
  resources: [], // { id, title, url, tag }
  studyTube: [], // { id, videoId, title, notes }
  moods: [], // { date, val }
  revisionLogs: [],
  taskHistory: [],
  semesterGoal: "Finish this semester with consistent deep-work sessions.",
  timeBlocks: [
    { id: uuidv4(), label: "Deep Work", time: "08:00 - 10:00" },
    { id: uuidv4(), label: "Revision", time: "19:00 - 20:00" },
  ],
};

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState;
    const merged = { ...defaultState, ...JSON.parse(raw) };

    // Clean up persisted duplicates / stale fields so the UI is consistent.
    const subjects = Array.isArray(merged.subjects) ? merged.subjects : [];
    const habits = Array.isArray(merged.habits) ? merged.habits : [];
    const studyTube = Array.isArray(merged.studyTube) ? merged.studyTube : [];

    // Sanitize userName if it holds a rogue URL
    let cleanedUserName = merged.userName;
    if (typeof cleanedUserName === "string" && cleanedUserName.includes("http")) {
      cleanedUserName = "Student";
    }

    const uniqBy = (arr, getKey) => {
      const seen = new Set();
      const out = [];
      for (const item of arr) {
        const key = normalizeKey(getKey(item));
        if (!key || seen.has(key)) continue;
        seen.add(key);
        out.push(item);
      }
      return out;
    };

    // Drop legacy demo subjects; keep list non-empty with "General".
    const REMOVED_SUBJECT_KEYS = new Set([
      "daa",
      "dbms",
      "artificial intelligence",
      "mathematics",
    ]);
    let cleanedSubjects = uniqBy(subjects, (s) => s).filter(
      (s) => !REMOVED_SUBJECT_KEYS.has(normalizeKey(s))
    );
    if (cleanedSubjects.length === 0) cleanedSubjects = ["General"];

    const cleanedHabits = uniqBy(habits, (h) => h?.name);

    const cleanedStudyTube = (() => {
      const seen = new Set();
      const out = [];
      for (const v of studyTube) {
        const videoId = sanitizeYouTubeVideoId(v?.videoId) ?? v?.videoId ?? null;
        const key = normalizeKey(videoId);
        if (!key || seen.has(key)) continue;
        seen.add(key);
        out.push({ ...v, videoId });
      }
      return out;
    })();

    const rawProgress =
      merged.progress && typeof merged.progress === "object" ? merged.progress : {};
    const cleanedProgress = { ...rawProgress };
    REMOVED_SUBJECT_KEYS.forEach((k) => {
      const match = Object.keys(cleanedProgress).find((key) => normalizeKey(key) === k);
      if (match) delete cleanedProgress[match];
    });
    if (Object.keys(cleanedProgress).length === 0) cleanedProgress.General = 0;

    const migratedTasks = Array.isArray(merged.tasks)
      ? merged.tasks.map((t) => {
          if (!t || !t.subject) return t;
          return REMOVED_SUBJECT_KEYS.has(normalizeKey(t.subject))
            ? { ...t, subject: "General" }
            : t;
        })
      : merged.tasks;

    return {
      ...merged,
      userName: cleanedUserName,
      subjects: cleanedSubjects,
      habits: cleanedHabits,
      studyTube: cleanedStudyTube,
      progress: cleanedProgress,
      tasks: migratedTasks,
      level: calculateLevel(merged.xp),
    };
  } catch {
    return defaultState;
  }
}

const PlannerContext = createContext();

export function PlannerProvider({ children }) {
  const [state, setState] = useState(loadState);

  // Sync to localstorage & level calculation
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const value = {
    state,
    setState,
    updateState: (updates) => setState((prev) => ({ ...prev, ...updates })),
    
    // Core Actions Wrapper
    gainXP: (amount) => setState((prev) => {
      const xp = prev.xp + amount;
      return { ...prev, xp, level: calculateLevel(xp) };
    }),

    // Task actions
    addTask: (task) => setState((prev) => {
      const xpGained = 10;
      const xp = prev.xp + xpGained;
      return {
        ...prev,
        xp,
        level: calculateLevel(xp),
        tasks: [...prev.tasks, { ...task, id: uuidv4(), done: false, minutesSpent: 0 }]
      };
    }),
    toggleTask: (id) => setState((prev) => {
      let xpGained = 0;
      const tasks = prev.tasks.map((t) => {
        if(t.id === id) {
          if(!t.done) xpGained = 50; // Marking complete
          return { ...t, done: !t.done };
        }
        return t;
      });
      const xp = prev.xp + xpGained;
      return { ...prev, xp, level: calculateLevel(xp), tasks };
    }),
    deleteTask: (id) => setState((prev) => ({ ...prev, tasks: prev.tasks.filter((t) => t.id !== id) })),
    
    rescheduleMissedTasks: () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const nextDate = tomorrow.toISOString().slice(0, 10);
      setState((prev) => ({
        ...prev,
        tasks: prev.tasks.map((t) => {
          if (!t.done && t.deadline < new Date().toISOString().slice(0, 10)) {
            return { ...t, deadline: nextDate, day: (tomorrow.getDay() + 6) % 7 };
          }
          return t;
        }),
      }));
    },

    addSubject: (subject) => {
      const trimmed = String(subject ?? "").trim();
      const key = normalizeKey(trimmed);
      if (!key) return;
      setState((prev) => {
        const exists = prev.subjects.some((s) => normalizeKey(s) === key);
        if (exists) return prev;
        return { ...prev, subjects: [...prev.subjects, trimmed] };
      });
    },

    // Habits
    addHabit: (name) => {
      const trimmed = String(name ?? "").trim();
      const key = normalizeKey(trimmed);
      if (!key) return;
      setState((prev) => {
        const exists = prev.habits.some((h) => normalizeKey(h.name) === key);
        if (exists) return prev;
        return { ...prev, habits: [...prev.habits, { id: uuidv4(), name: trimmed, done: false }] };
      });
    },
    toggleHabit: (id) => setState((prev) => {
      let xpGained = 0;
      const habits = prev.habits.map((h) => {
        if(h.id === id) {
           if(!h.done) xpGained = 20;
           return { ...h, done: !h.done };
        }
        return h;
      });
      const xp = prev.xp + xpGained;
      return { ...prev, xp, level: calculateLevel(xp), habits };
    }),

    // Notes
    addNote: (title) => {
      const newNote = { id: uuidv4(), title: title || "Untitled Note", content: "" };
      setState((prev) => ({ ...prev, notes: [...prev.notes, newNote] }));
      return newNote.id;
    },
    updateNote: (id, content) => {
      setState((prev) => ({
        ...prev,
        notes: prev.notes.map(n => n.id === id ? { ...n, content } : n)
      }));
    },
    
    // StudyTube
    addStudyTubeVideo: (url, videoId, title) => {
      // `videoId` is preferred so we can reliably dedupe (including when URLs include extra params).
      const parsedVideoId = videoId ?? (() => {
        const match = String(url ?? "").match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com|youtu\.be)\/(?:watch\?v=|embed\/|)([^&\n?#]+)/);
        return match?.[1] || null;
      })();
      if (!parsedVideoId) return;

      setState((prev) => {
        const existing = prev.studyTube.find((v) => v.videoId === parsedVideoId);
        if (existing) {
          // Keep list unique; optionally refresh placeholder title.
          if (!existing.title || existing.title === "New Video") {
            return {
              ...prev,
              studyTube: prev.studyTube.map((v) =>
                v.id === existing.id ? { ...v, title: title || v.title } : v
              ),
            };
          }
          return prev;
        }

        return {
          ...prev,
          studyTube: [
            ...prev.studyTube,
            { id: uuidv4(), videoId: parsedVideoId, title: title || "New Video", notes: "" },
          ],
        };
      });
    },
    updateStudyTubeNote: (id, notes) => {
      setState(prev => ({
         ...prev,
         studyTube: prev.studyTube.map(v => v.id === id ? { ...v, notes } : v)
      }));
    },
    deleteStudyTubeVideo: (id) => {
      setState(prev => ({
         ...prev,
         studyTube: prev.studyTube.filter(v => v.id !== id)
      }));
    },

    resetAll: () => {
      if (window.confirm("CRITICAL: Reset all planner data?")) {
        setState(defaultState);
      }
    }
  };

  return <PlannerContext.Provider value={value}>{children}</PlannerContext.Provider>;
}

export function usePlanner() {
  return useContext(PlannerContext);
}
