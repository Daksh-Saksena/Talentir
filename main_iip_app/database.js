const Store = require("electron-store");
const { v4: uuidv4 } = require("uuid");

function getStore(userPath) {
  return new Store({
    cwd: userPath,
    name: "main_iip_app_db",
    defaults: {
      students: [],
      attendance: [],
      attention: [],
      interactions: [],
      seating_plans: [],
    },
  });
}

function openDatabase(userPath) {
  const store = getStore(userPath);

  function getStudents() {
    return store.get("students");
  }

  function saveStudentProfile(profile) {
    const now = new Date().toISOString();
    const students = getStudents();
    if (!profile.id) {
      const id = uuidv4();
      const record = {
        id,
        name: profile.name,
        grade: profile.grade || "unknown",
        seat: profile.seat || "",
        descriptor: profile.descriptor || null,
        updatedAt: now,
      };
      store.set("students", [...students, record]);
      return record;
    }
    const updated = students.map((student) =>
      student.id === profile.id
        ? { ...student, name: profile.name, grade: profile.grade || "unknown", seat: profile.seat || "", descriptor: profile.descriptor || null, updatedAt: now }
        : student
    );
    store.set("students", updated);
    return { ...profile, updatedAt: now };
  }

  function recordAttendance(record) {
    const attendance = store.get("attendance");
    const entry = {
      id: uuidv4(),
      studentId: record.studentId,
      timestamp: record.timestamp,
      status: record.status,
      label: record.label || "detected",
      confidence: record.confidence ?? 0,
    };
    store.set("attendance", [entry, ...attendance].slice(0, 1000));
    return entry;
  }

  function getAttendanceHistory() {
    return store.get("attendance");
  }

  function recordAttention(record) {
    const attention = store.get("attention");
    const entry = {
      id: uuidv4(),
      studentId: record.studentId,
      timestamp: record.timestamp,
      score: record.score,
      orientation: record.orientation,
      gaze: record.gaze,
      remark: record.remark || "",
    };
    store.set("attention", [entry, ...attention].slice(0, 1000));
    return entry;
  }

  function getAttentionMetrics() {
    const attention = store.get("attention");
    const grouped = attention.reduce((acc, entry) => {
      const current = acc[entry.studentId] || { total: 0, samples: 0 };
      current.total += entry.score;
      current.samples += 1;
      acc[entry.studentId] = current;
      return acc;
    }, {});
    return Object.entries(grouped).map(([studentId, data]) => ({ studentId, score: data.total / data.samples, samples: data.samples }));
  }

  function recordInteraction(record) {
    const interactions = store.get("interactions");
    const entry = {
      id: uuidv4(),
      studentId: record.studentId,
      timestamp: record.timestamp,
      duration: record.duration,
      speechLabel: record.speechLabel || "",
      notes: record.notes || "",
    };
    store.set("interactions", [entry, ...interactions].slice(0, 1000));
    return entry;
  }

  function getInteractions() {
    return store.get("interactions");
  }

  function saveSeatingPlan(plan) {
    const plans = store.get("seating_plans");
    const entry = {
      id: plan.id || uuidv4(),
      name: plan.name,
      createdAt: new Date().toISOString(),
      layout: plan.layout || [],
    };
    store.set("seating_plans", [entry, ...plans].slice(0, 100));
    return entry;
  }

  function getSeatingPlans() {
    return store.get("seating_plans");
  }

  return {
    getStudents,
    saveStudentProfile,
    getAttendanceHistory,
    recordAttendance,
    getAttentionMetrics,
    recordAttention,
    getInteractions,
    recordInteraction,
    getSeatingPlans,
    saveSeatingPlan,
  };
}

module.exports = openDatabase;
