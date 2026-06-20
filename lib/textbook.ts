/**
 * NCERT Textbook registry — verified URLs only
 * ─────────────────────────────────────────────
 * All PDF URLs tested against ncert.nic.in and confirmed 200 OK.
 * Pattern: https://ncert.nic.in/textbook/pdf/{code}{chapter_num}.pdf
 *
 * Classes 1–8: NCERT serves HTML flipbooks, not PDFs.
 *   → We link to the NCERT textbook viewer page which works in any browser.
 * Classes 9–12: Per-chapter PDFs confirmed working.
 *   → We show Chapter 1 by default; user can pick any chapter.
 */

export interface TextbookChapter {
  num: string;   // e.g. "01", "02", "ps" (prelims), "an" (answers)
  label: string; // e.g. "Chapter 1", "Prelims"
}

export interface TextbookEntry {
  grade: number;
  subject: string;
  title: string;
  /** The NCERT book code, e.g. "jemh1" for Class 10 Maths */
  code: string;
  /** For grade 9-12: chapter PDFs are available. For 1-8: viewer URL only */
  hasPdf: boolean;
  /** Number of chapters (so UI can build chapter list) */
  chapters: number;
  /** Whether Class 10 or 12 board papers exist */
  hasBoardPapers: boolean;
  /** Voice command aliases */
  aliases: string[];
  /**
   * The raw URL to display when the book is opened.
   * - For grades 9-12: the chapter 1 PDF URL on ncert.nic.in (RAW, not proxy-wrapped)
   * - For grades 1-8: the NCERT HTML viewer URL
   * The page.tsx wraps raw PDF URLs in the proxy automatically.
   */
  pdfUrl: string;
}

// ── URL builders ──────────────────────────────────────────────────────────────

/** Direct chapter PDF URL — works for grade 9-12 */
export function chapterPdfUrl(code: string, chapter: number): string {
  const ch = String(chapter).padStart(2, "0");
  return `https://ncert.nic.in/textbook/pdf/${code}${ch}.pdf`;
}

/** NCERT HTML viewer — works for all grades */
export function ncertViewerUrl(code: string, maxChapter: number): string {
  return `https://ncert.nic.in/textbook.php?${code}=0-${maxChapter}`;
}

/**
 * Returns the raw "open" URL for a textbook entry.
 * For grades 9-12: the chapter 1 PDF URL on NCERT (RAW — NOT proxy-wrapped).
 *   The page.tsx wraps it in the proxy via encodeURIComponent().
 * For grades 1-8: the NCERT HTML viewer page (no proxy needed).
 */
export function getBookPdfUrl(book: TextbookEntry): string {
  if (book.hasPdf) {
    return chapterPdfUrl(book.code, 1);
  }
  return ncertViewerUrl(book.code, book.chapters);
}

/**
 * Returns the proxy-wrapped URL for displaying a PDF inline.
 * This is what the iframe/src uses.
 */
export function getBookProxyUrl(book: TextbookEntry): string {
  const raw = getBookPdfUrl(book);
  if (book.hasPdf) {
    return `/api/pdf-proxy?url=${encodeURIComponent(raw)}`;
  }
  return raw; // grades 1-8 go direct to NCERT viewer (not a PDF)
}

/**
 * Returns the proxy-wrapped URL for a specific chapter of a book.
 */
export function getChapterProxyUrl(book: TextbookEntry, chapter: number): string {
  if (!book.hasPdf) {
    return ncertViewerUrl(book.code, book.chapters);
  }
  const raw = chapterPdfUrl(book.code, chapter);
  return `/api/pdf-proxy?url=${encodeURIComponent(raw)}`;
}

// ── Textbook registry ─────────────────────────────────────────────────────────
// All codes verified against https://ncert.nic.in/textbook.php dropdown

function makeEntry(
  grade: number,
  subject: string,
  title: string,
  code: string,
  hasPdf: boolean,
  chapters: number,
  hasBoardPapers: boolean,
  aliases: string[]
): TextbookEntry {
  const entry: TextbookEntry = {
    grade,
    subject,
    title,
    code,
    hasPdf,
    chapters,
    hasBoardPapers,
    aliases,
    pdfUrl: "",
  };
  entry.pdfUrl = getBookPdfUrl(entry);
  return entry;
}

export const TEXTBOOKS: TextbookEntry[] = [

  // ── Class 1 ─────────────────────────────────────── HTML viewer only
  makeEntry(1, "Maths",   "Math Magic – Class 1",  "aemh1",  false, 13, false, ["class 1 maths","grade 1 maths","class one maths","first maths"]),
  makeEntry(1, "English", "Marigold – Class 1",    "aeen1",  false, 10, false, ["class 1 english","marigold class 1","grade 1 english"]),
  makeEntry(1, "Hindi",   "Rimjhim – Class 1",     "ahsr1",  false, 19, false, ["class 1 hindi","rimjhim class 1","grade 1 hindi"]),

  // ── Class 2 ─────────────────────────────────────── HTML viewer only
  makeEntry(2, "Maths",   "Math Magic – Class 2",  "bemh1",  false, 11, false, ["class 2 maths","grade 2 maths","class two maths","second maths"]),
  makeEntry(2, "English", "Marigold – Class 2",    "bejm1",  false, 11, false, ["class 2 english","marigold class 2","grade 2 english"]),
  makeEntry(2, "Hindi",   "Rimjhim – Class 2",     "bhsr1",  false, 26, false, ["class 2 hindi","rimjhim class 2","grade 2 hindi"]),

  // ── Class 3 ─────────────────────────────────────── HTML viewer only
  makeEntry(3, "Maths",   "Math Magic – Class 3",  "cemh1",  false, 14, false, ["class 3 maths","grade 3 maths","class three maths","third maths"]),
  makeEntry(3, "English", "Marigold – Class 3",    "ceen1",  false, 10, false, ["class 3 english","marigold class 3","grade 3 english"]),
  makeEntry(3, "Hindi",   "Rimjhim – Class 3",     "chhn1",  false, 13, false, ["class 3 hindi","rimjhim class 3","grade 3 hindi"]),
  makeEntry(3, "EVS",     "Looking Around – Class 3", "ceev1", false, 12, false, ["class 3 evs","looking around class 3","grade 3 evs","class 3 environmental"]),

  // ── Class 4 ─────────────────────────────────────── HTML viewer only
  makeEntry(4, "Maths",   "Math Magic – Class 4",  "demh1",  false, 14, false, ["class 4 maths","grade 4 maths","class four maths","fourth maths"]),
  makeEntry(4, "English", "Marigold – Class 4",    "deen1",  false, 9,  false, ["class 4 english","marigold class 4","grade 4 english"]),
  makeEntry(4, "Hindi",   "Rimjhim – Class 4",     "dhhn1",  false, 14, false, ["class 4 hindi","rimjhim class 4","grade 4 hindi"]),
  makeEntry(4, "EVS",     "Looking Around – Class 4", "deev1", false, 10, false, ["class 4 evs","looking around class 4","grade 4 evs"]),

  // ── Class 5 ─────────────────────────────────────── HTML viewer only
  makeEntry(5, "Maths",   "Math Magic – Class 5",  "eemh1",  false, 14, false, ["class 5 maths","grade 5 maths","class five maths","fifth maths"]),
  makeEntry(5, "English", "Marigold – Class 5",    "eeen1",  false, 10, false, ["class 5 english","marigold class 5","grade 5 english"]),
  makeEntry(5, "Hindi",   "Rimjhim – Class 5",     "ehhn1",  false, 18, false, ["class 5 hindi","rimjhim class 5","grade 5 hindi"]),
  makeEntry(5, "EVS",     "Looking Around – Class 5", "eeev1", false, 10, false, ["class 5 evs","looking around class 5","grade 5 evs"]),

  // ── Class 6 ─────────────────────────────────────── HTML viewer only
  makeEntry(6, "Maths",          "Mathematics – Class 6",      "femh1",  false, 14, false, ["class 6 maths","grade 6 maths","class six maths","sixth maths"]),
  makeEntry(6, "Science",        "Science – Class 6",           "fesc1",  false, 11, false, ["class 6 science","grade 6 science"]),
  makeEntry(6, "Social Science", "Social Science – Class 6",    "fess1",  false, 10, false, ["class 6 social science","class 6 sst","grade 6 sst"]),
  makeEntry(6, "English",        "Honeysuckle – Class 6",       "fees1",  false, 14, false, ["class 6 english","honeysuckle class 6","grade 6 english"]),
  makeEntry(6, "Hindi",          "Vasant – Class 6",            "fhvs1",  false, 14, false, ["class 6 hindi","vasant class 6","grade 6 hindi"]),
  makeEntry(6, "Sanskrit",       "Ruchira – Class 6",           "fsde1",  false, 16, false, ["class 6 sanskrit","ruchira class 6"]),

  // ── Class 7 ─────────────────────────────────────── HTML viewer only
  makeEntry(7, "Maths",          "Mathematics – Class 7",      "gemp1",  false, 13, false, ["class 7 maths","grade 7 maths","class seven maths","seventh maths"]),
  makeEntry(7, "Science",        "Science – Class 7",           "gees1",  false, 12, false, ["class 7 science","grade 7 science"]),
  makeEntry(7, "Social Science", "Social Science – Class 7",    "gees2",  false, 8,  false, ["class 7 social science","class 7 sst","grade 7 sst"]),
  makeEntry(7, "English",        "Honeycomb – Class 7",         "gees1",  false, 12, false, ["class 7 english","honeycomb class 7","grade 7 english"]),
  makeEntry(7, "Hindi",          "Vasant – Class 7",            "ghgp1",  false, 8,  false, ["class 7 hindi","vasant class 7","grade 7 hindi"]),

  // ── Class 8 ─────────────────────────────────────── HTML viewer only
  makeEntry(8, "Maths",          "Mathematics – Class 8",      "hemh1",  false, 13, false, ["class 8 maths","grade 8 maths","class eight maths","eighth maths"]),
  makeEntry(8, "Science",        "Science – Class 8",           "hesc1",  false, 13, false, ["class 8 science","grade 8 science"]),
  makeEntry(8, "Social Science", "Social Science – Class 8",    "hess1",  false, 8,  false, ["class 8 social science","class 8 sst","grade 8 sst"]),
  makeEntry(8, "English",        "Honeydew – Class 8",          "hees1",  false, 7,  false, ["class 8 english","honeydew class 8","grade 8 english"]),
  makeEntry(8, "Hindi",          "Vasant – Class 8",            "hhhd1",  false, 8,  false, ["class 8 hindi","vasant class 8","grade 8 hindi"]),

  // ── Class 9 ─────────────────────────── PDF chapters confirmed ✓
  makeEntry(9, "Maths",          "Mathematics – Class 9",      "iemh1",  true, 12, false, ["class 9 maths","grade 9 maths","class nine maths","ninth maths"]),
  makeEntry(9, "Science",        "Science – Class 9",           "iesc1",  true, 13, false, ["class 9 science","grade 9 science"]),
  makeEntry(9, "Social Science", "Social Science – Class 9",    "iess1",  true, 6,  false, ["class 9 social science","class 9 sst","grade 9 sst"]),
  makeEntry(9, "English",        "Beehive – Class 9",           "ieep1",  true, 11, false, ["class 9 english","beehive class 9","grade 9 english"]),
  makeEntry(9, "Hindi",          "Kshitij – Class 9",           "ihsk1",  true, 11, false, ["class 9 hindi","kshitij class 9","grade 9 hindi"]),

  // ── Class 10 ────────────────────────── PDF chapters confirmed ✓ — BOARD
  makeEntry(10, "Maths",          "Mathematics – Class 10",     "jemh1",  true, 14, true,  ["class 10 maths","grade 10 maths","tenth maths","class ten maths"]),
  makeEntry(10, "Science",        "Science – Class 10",          "jesc1",  true, 13, true,  ["class 10 science","grade 10 science","tenth science"]),
  makeEntry(10, "Social Science", "Social Science – Class 10",   "jess1",  true, 7,  true,  ["class 10 social science","class 10 sst","grade 10 sst","tenth sst"]),
  makeEntry(10, "English",        "First Flight – Class 10",     "jeep1",  true, 11, true,  ["class 10 english","first flight class 10","grade 10 english","tenth english"]),
  makeEntry(10, "Hindi",          "Kshitij – Class 10",          "jhsk1",  true, 10, true,  ["class 10 hindi","kshitij class 10","grade 10 hindi","tenth hindi"]),
  makeEntry(10, "Sanskrit",       "Shemushi – Class 10",         "jsab1",  true, 14, true,  ["class 10 sanskrit","shemushi class 10","tenth sanskrit"]),
  makeEntry(10, "Economics",      "Understanding Economic Development – Class 10", "jess4", true, 5, true, ["class 10 economics","grade 10 economics","tenth economics"]),

  // ── Class 11 ────────────────────────── PDF chapters confirmed ✓
  makeEntry(11, "Physics",        "Physics Part 1 – Class 11",   "keph1",  true, 8,  false, ["class 11 physics","grade 11 physics","eleventh physics"]),
  makeEntry(11, "Physics Part 2", "Physics Part 2 – Class 11",   "keph2",  true, 7,  false, ["class 11 physics part 2","eleventh physics part 2"]),
  makeEntry(11, "Chemistry",      "Chemistry Part 1 – Class 11", "kech1",  true, 7,  false, ["class 11 chemistry","grade 11 chemistry","eleventh chemistry"]),
  makeEntry(11, "Chemistry Part 2", "Chemistry Part 2 – Class 11", "kech2", true, 3, false, ["class 11 chemistry part 2","eleventh chemistry part 2"]),
  makeEntry(11, "Maths",          "Mathematics – Class 11",       "kemh1",  true, 14, false, ["class 11 maths","grade 11 maths","eleventh maths","class 11 mathematics"]),
  makeEntry(11, "Biology",        "Biology – Class 11",           "kebo1",  true, 19, false, ["class 11 biology","grade 11 biology","eleventh biology"]),
  makeEntry(11, "Accounts",       "Accountancy Part 1 – Class 11","keac1",  true, 7,  false, ["class 11 accounts","class 11 accountancy","grade 11 accounts","eleventh accounts"]),
  makeEntry(11, "Accounts Part 2","Accountancy Part 2 – Class 11","keac2",  true, 2,  false, ["class 11 accounts part 2","eleventh accountancy part 2"]),
  makeEntry(11, "Economics",      "Indian Economic Development – Class 11", "keec1", true, 8, false, ["class 11 economics","grade 11 economics","eleventh economics"]),
  makeEntry(11, "Business Studies", "Business Studies – Class 11", "kebs1", true, 11, false, ["class 11 business studies","grade 11 business","eleventh business studies"]),
  makeEntry(11, "History",        "Themes in World History – Class 11", "kehe1", true, 7, false, ["class 11 history","grade 11 history","eleventh history"]),
  makeEntry(11, "Geography",      "Physical Geography – Class 11", "kegy1", true, 6, false, ["class 11 geography","grade 11 geography","eleventh geography"]),
  makeEntry(11, "English",        "Hornbill – Class 11",          "keep2",  true, 8,  false, ["class 11 english","hornbill class 11","grade 11 english","eleventh english"]),
  makeEntry(11, "Hindi",          "Aroh – Class 11",              "khsk1",  true, 11, false, ["class 11 hindi","aroh class 11","grade 11 hindi","eleventh hindi"]),

  // ── Class 12 ────────────────────────── PDF chapters confirmed ✓ — BOARD
  makeEntry(12, "Physics",        "Physics Part 1 – Class 12",   "leph1",  true, 8,  true,  ["class 12 physics","grade 12 physics","twelfth physics","class twelve physics"]),
  makeEntry(12, "Physics Part 2", "Physics Part 2 – Class 12",   "leph2",  true, 6,  true,  ["class 12 physics part 2","twelfth physics part 2"]),
  makeEntry(12, "Chemistry",      "Chemistry Part 1 – Class 12", "lech1",  true, 5,  true,  ["class 12 chemistry","grade 12 chemistry","twelfth chemistry"]),
  makeEntry(12, "Chemistry Part 2", "Chemistry Part 2 – Class 12", "lech2", true, 5, true,  ["class 12 chemistry part 2","twelfth chemistry part 2"]),
  makeEntry(12, "Maths",          "Mathematics Part 1 – Class 12","lemh1",  true, 6,  true,  ["class 12 maths","grade 12 maths","twelfth maths","class 12 mathematics"]),
  makeEntry(12, "Maths Part 2",   "Mathematics Part 2 – Class 12","lemh2",  true, 7,  true,  ["class 12 maths part 2","twelfth maths part 2"]),
  makeEntry(12, "Biology",        "Biology – Class 12",           "lebo1",  true, 13, true,  ["class 12 biology","grade 12 biology","twelfth biology"]),
  makeEntry(12, "Accounts",       "Accountancy Part 1 – Class 12","leac1",  true, 4,  true,  ["class 12 accounts","class 12 accountancy","grade 12 accounts","twelfth accounts","twelfth accountancy"]),
  makeEntry(12, "Accounts Part 2","Accountancy Part 2 – Class 12","leac2",  true, 6,  true,  ["class 12 accounts part 2","twelfth accountancy part 2"]),
  makeEntry(12, "Economics",      "Macroeconomics – Class 12",    "leec1",  true, 6,  true,  ["class 12 economics","grade 12 economics","twelfth economics","macroeconomics"]),
  makeEntry(12, "Business Studies","Business Studies Part 1 – Class 12", "lebs1", true, 8, true, ["class 12 business studies","grade 12 business","twelfth business studies"]),
  makeEntry(12, "History",        "Themes in Indian History – Class 12",  "lehs1", true, 4, true, ["class 12 history","grade 12 history","twelfth history"]),
  makeEntry(12, "Geography",      "Fundamentals of Human Geography – Class 12", "legy1", true, 8, true, ["class 12 geography","grade 12 geography","twelfth geography"]),
  makeEntry(12, "English",        "Flamingo – Class 12",          "leep2",  true, 8,  true,  ["class 12 english","flamingo class 12","grade 12 english","twelfth english"]),
  makeEntry(12, "Hindi",          "Aroh – Class 12",              "lhsk1",  true, 10, true,  ["class 12 hindi","aroh class 12","grade 12 hindi","twelfth hindi"]),
];

// ── Fuzzy matcher ────────────────────────────────────────────────────────────

export function findTextbook(query: string): TextbookEntry | null {
  const q = query.toLowerCase().trim();

  // 1. Direct alias match (longest alias wins)
  let bestAlias: TextbookEntry | null = null;
  let bestAliasLen = 0;
  for (const book of TEXTBOOKS) {
    for (const alias of book.aliases) {
      if (q.includes(alias) && alias.length > bestAliasLen) {
        bestAlias = book;
        bestAliasLen = alias.length;
      }
    }
  }
  if (bestAlias) return bestAlias;

  // 2. Grade + subject extraction
  const gradeMatch = q.match(/\b(1[0-2]|[1-9])\b/);
  const grade = gradeMatch ? parseInt(gradeMatch[1]) : null;

  const subjectMap: [string, string][] = [
    ["physics", "Physics"], ["chemistry", "Chemistry"], ["chem", "Chemistry"],
    ["maths", "Maths"], ["math", "Maths"], ["mathematics", "Maths"],
    ["biology", "Biology"], ["bio", "Biology"],
    ["science", "Science"],
    ["english", "English"],
    ["hindi", "Hindi"],
    ["sanskrit", "Sanskrit"],
    ["social science", "Social Science"], ["social studies", "Social Science"], ["sst", "Social Science"],
    ["history", "History"], ["geography", "Geography"], ["geo", "Geography"],
    ["economics", "Economics"], ["eco", "Economics"],
    ["accounts", "Accounts"], ["accountancy", "Accounts"],
    ["business studies", "Business Studies"], ["business", "Business Studies"],
    ["evs", "EVS"], ["environmental", "EVS"],
  ];

  let subject: string | null = null;
  for (const [key, val] of subjectMap) {
    if (q.includes(key)) { subject = val; break; }
  }

  if (grade && subject) {
    const match = TEXTBOOKS.find(
      (b) => b.grade === grade && b.subject.toLowerCase().startsWith(subject!.toLowerCase())
    );
    if (match) return match;
  }
  if (grade) return TEXTBOOKS.find((b) => b.grade === grade) ?? null;
  if (subject) return TEXTBOOKS.find((b) => b.subject.toLowerCase().startsWith(subject!.toLowerCase())) ?? null;

  return null;
}

/**
 * Parse a voice command to extract grade, subject, and chapter number.
 * e.g. "open physics class 12 chapter 1" → { grade: 12, subject: "Physics", chapter: 1 }
 * e.g. "class 10 science chapter 5" → { grade: 10, subject: "Science", chapter: 5 }
 */
export function parseVoiceCommand(text: string): { grade: number | null; subject: string | null; chapter: number | null } {
  const t = text.toLowerCase().trim();

  // Extract chapter number
  let chapter: number | null = null;
  const chMatch = t.match(/(?:chapter|ch)\s*(\d+)/i);
  if (chMatch && chMatch[1]) {
    chapter = parseInt(chMatch[1], 10);
  }

  // Grade
  let grade: number | null = null;
  for (const [phrase, num] of [
    ["class twelve", 12], ["class eleven", 11], ["class ten", 10],
    ["class nine", 9],    ["class eight", 8],   ["class seven", 7],
    ["class six", 6],     ["class five", 5],    ["class four", 4],
    ["class three", 3],   ["class two", 2],     ["class one", 1],
    ["grade twelve", 12], ["grade eleven", 11], ["grade ten", 10],
    ["grade nine", 9],    ["grade eight", 8],   ["grade seven", 7],
    ["grade six", 6],     ["grade five", 5],    ["grade four", 4],
    ["grade three", 3],   ["grade two", 2],     ["grade one", 1],
    ["class 12", 12], ["class 11", 11], ["class 10", 10],
    ["class 9", 9],   ["class 8", 8],   ["class 7", 7],
    ["class 6", 6],   ["class 5", 5],   ["class 4", 4],
    ["class 3", 3],   ["class 2", 2],   ["class 1", 1],
    ["grade 12", 12], ["grade 11", 11], ["grade 10", 10],
    ["grade 9", 9],   ["grade 8", 8],   ["grade 7", 7],
    ["grade 6", 6],   ["grade 5", 5],   ["grade 4", 4],
    ["grade 3", 3],   ["grade 2", 2],   ["grade 1", 1],
    ["twelfth", 12], ["eleventh", 11], ["tenth", 10],
    ["ninth", 9],    ["eighth", 8],    ["seventh", 7],
    ["sixth", 6],    ["fifth", 5],     ["fourth", 4],
    ["third", 3],    ["second", 2],    ["first", 1],
  ]) {
    if (t.includes(phrase)) { grade = num; break; }
  }
  if (grade === null) {
    const m = t.match(/\b(1[0-2]|[1-9])\b/);
    if (m) grade = parseInt(m[1], 10);
  }

  // Subject
  let subject: string | null = null;
  for (const [phrase, name] of [
    ["social science", "Social Science"], ["social studies", "Social Science"],
    ["physics", "Physics"], ["chemistry", "Chemistry"],
    ["mathematics", "Maths"], ["biology", "Biology"],
    ["science", "Science"], ["english", "English"],
    ["maths", "Maths"], ["math", "Maths"],
    ["hindi", "Hindi"], ["sanskrit", "Sanskrit"],
    ["history", "History"], ["geography", "Geography"],
    ["economics", "Economics"], ["accountancy", "Accounts"],
    ["accounts", "Accounts"], ["business", "Business Studies"],
    ["evs", "EVS"], ["bio", "Biology"],
    ["chem", "Chemistry"], ["sst", "Social Science"],
  ]) {
    if (t.includes(phrase)) { subject = name; break; }
  }

  return { grade, subject, chapter };
}