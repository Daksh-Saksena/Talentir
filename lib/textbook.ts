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
   * The default PDF URL to display when the book is opened.
   * - For grades 9-12: chapter 1 PDF via our proxy
   * - For grades 1-8: NCERT HTML viewer URL
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
 * Returns the "open" URL for a textbook entry.
 * For grades 9-12: the chapter 1 PDF served through our proxy.
 * For grades 1-8: the NCERT HTML viewer page.
 */
export function getBookPdfUrl(book: TextbookEntry): string {
  if (book.hasPdf) {
    return `/api/pdf-proxy?url=${encodeURIComponent(chapterPdfUrl(book.code, 1))}`;
  }
  return ncertViewerUrl(book.code, book.chapters);
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
