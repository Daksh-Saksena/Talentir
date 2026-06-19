/**
 * NCERT Textbook URL resolver
 * Covers Grade 1–12, all major CBSE subjects.
 * PDFs are served directly from ncert.nic.in public domain.
 */

export interface TextbookEntry {
  grade: number;
  subject: string;
  title: string;
  /** Direct NCERT PDF URL */
  pdfUrl: string;
  /** Short aliases for voice matching */
  aliases: string[];
  /** Whether Class 10 or 12 board papers are available */
  hasBoardPapers: boolean;
}

// ─── NCERT URL pattern ────────────────────────────────────────────────────────
// https://ncert.nic.in/textbook/pdf/<code>.zip  (zip of chapter PDFs)
// For full-book PDFs: https://ncert.nic.in/ncerts/l/<code>.pdf
// We use the publicly accessible full-book PDFs from NCERT's digital library
// Fallback viewer: https://ncert.nic.in/textbook.php?<code>

const NCERT_BASE = "https://ncert.nic.in/ncerts/l";
const NCERT_VIEWER = "https://ncert.nic.in/textbook.php";

function pdf(code: string) {
  return `${NCERT_BASE}/${code}.pdf`;
}

export const TEXTBOOKS: TextbookEntry[] = [
  // ── Class 1 ─────────────────────────────────────────────────────────────────
  { grade: 1, subject: "Maths", title: "Math Magic – Class 1", pdfUrl: pdf("aemh1"), aliases: ["math magic class 1", "class 1 maths", "grade 1 maths"], hasBoardPapers: false },
  { grade: 1, subject: "English", title: "Marigold – Class 1", pdfUrl: pdf("aerr1"), aliases: ["marigold class 1", "class 1 english", "grade 1 english"], hasBoardPapers: false },
  { grade: 1, subject: "Hindi", title: "Rimjhim – Class 1", pdfUrl: pdf("ahrr1"), aliases: ["rimjhim class 1", "class 1 hindi", "grade 1 hindi"], hasBoardPapers: false },

  // ── Class 2 ─────────────────────────────────────────────────────────────────
  { grade: 2, subject: "Maths", title: "Math Magic – Class 2", pdfUrl: pdf("bemh2"), aliases: ["math magic class 2", "class 2 maths", "grade 2 maths"], hasBoardPapers: false },
  { grade: 2, subject: "English", title: "Marigold – Class 2", pdfUrl: pdf("berr2"), aliases: ["marigold class 2", "class 2 english", "grade 2 english"], hasBoardPapers: false },
  { grade: 2, subject: "Hindi", title: "Rimjhim – Class 2", pdfUrl: pdf("bhrr2"), aliases: ["rimjhim class 2", "class 2 hindi", "grade 2 hindi"], hasBoardPapers: false },

  // ── Class 3 ─────────────────────────────────────────────────────────────────
  { grade: 3, subject: "Maths", title: "Math Magic – Class 3", pdfUrl: pdf("cemh3"), aliases: ["math magic class 3", "class 3 maths", "grade 3 maths"], hasBoardPapers: false },
  { grade: 3, subject: "English", title: "Marigold – Class 3", pdfUrl: pdf("cerr3"), aliases: ["marigold class 3", "class 3 english", "grade 3 english"], hasBoardPapers: false },
  { grade: 3, subject: "Hindi", title: "Rimjhim – Class 3", pdfUrl: pdf("chrr3"), aliases: ["rimjhim class 3", "class 3 hindi", "grade 3 hindi"], hasBoardPapers: false },
  { grade: 3, subject: "EVS", title: "Looking Around – Class 3", pdfUrl: pdf("ceev3"), aliases: ["looking around class 3", "class 3 evs", "grade 3 evs", "environmental science class 3"], hasBoardPapers: false },

  // ── Class 4 ─────────────────────────────────────────────────────────────────
  { grade: 4, subject: "Maths", title: "Math Magic – Class 4", pdfUrl: pdf("demh4"), aliases: ["math magic class 4", "class 4 maths", "grade 4 maths"], hasBoardPapers: false },
  { grade: 4, subject: "English", title: "Marigold – Class 4", pdfUrl: pdf("derr4"), aliases: ["marigold class 4", "class 4 english", "grade 4 english"], hasBoardPapers: false },
  { grade: 4, subject: "Hindi", title: "Rimjhim – Class 4", pdfUrl: pdf("dhrr4"), aliases: ["rimjhim class 4", "class 4 hindi", "grade 4 hindi"], hasBoardPapers: false },
  { grade: 4, subject: "EVS", title: "Looking Around – Class 4", pdfUrl: pdf("deev4"), aliases: ["looking around class 4", "class 4 evs", "grade 4 evs"], hasBoardPapers: false },

  // ── Class 5 ─────────────────────────────────────────────────────────────────
  { grade: 5, subject: "Maths", title: "Math Magic – Class 5", pdfUrl: pdf("eemh5"), aliases: ["math magic class 5", "class 5 maths", "grade 5 maths"], hasBoardPapers: false },
  { grade: 5, subject: "English", title: "Marigold – Class 5", pdfUrl: pdf("eerr5"), aliases: ["marigold class 5", "class 5 english", "grade 5 english"], hasBoardPapers: false },
  { grade: 5, subject: "Hindi", title: "Rimjhim – Class 5", pdfUrl: pdf("ehrr5"), aliases: ["rimjhim class 5", "class 5 hindi", "grade 5 hindi"], hasBoardPapers: false },
  { grade: 5, subject: "EVS", title: "Looking Around – Class 5", pdfUrl: pdf("eeev5"), aliases: ["looking around class 5", "class 5 evs", "grade 5 evs"], hasBoardPapers: false },

  // ── Class 6 ─────────────────────────────────────────────────────────────────
  { grade: 6, subject: "Maths", title: "Mathematics – Class 6", pdfUrl: pdf("femh6"), aliases: ["class 6 maths", "grade 6 maths", "class 6 mathematics"], hasBoardPapers: false },
  { grade: 6, subject: "Science", title: "Science – Class 6", pdfUrl: pdf("fesc6"), aliases: ["class 6 science", "grade 6 science"], hasBoardPapers: false },
  { grade: 6, subject: "Social Science", title: "Social Science – Class 6", pdfUrl: pdf("fess6"), aliases: ["class 6 social science", "grade 6 social science", "class 6 sst"], hasBoardPapers: false },
  { grade: 6, subject: "English", title: "Honeysuckle – Class 6", pdfUrl: pdf("ferr6"), aliases: ["honeysuckle class 6", "class 6 english", "grade 6 english"], hasBoardPapers: false },
  { grade: 6, subject: "Hindi", title: "Vasant – Class 6", pdfUrl: pdf("fhvb6"), aliases: ["vasant class 6", "class 6 hindi", "grade 6 hindi"], hasBoardPapers: false },
  { grade: 6, subject: "Sanskrit", title: "Ruchira – Class 6", pdfUrl: pdf("fsrt6"), aliases: ["ruchira class 6", "class 6 sanskrit"], hasBoardPapers: false },

  // ── Class 7 ─────────────────────────────────────────────────────────────────
  { grade: 7, subject: "Maths", title: "Mathematics – Class 7", pdfUrl: pdf("gemh7"), aliases: ["class 7 maths", "grade 7 maths", "class 7 mathematics"], hasBoardPapers: false },
  { grade: 7, subject: "Science", title: "Science – Class 7", pdfUrl: pdf("gesc7"), aliases: ["class 7 science", "grade 7 science"], hasBoardPapers: false },
  { grade: 7, subject: "Social Science", title: "Social Science – Class 7", pdfUrl: pdf("gess7"), aliases: ["class 7 social science", "grade 7 sst"], hasBoardPapers: false },
  { grade: 7, subject: "English", title: "Honeycomb – Class 7", pdfUrl: pdf("gerr7"), aliases: ["honeycomb class 7", "class 7 english", "grade 7 english"], hasBoardPapers: false },
  { grade: 7, subject: "Hindi", title: "Vasant – Class 7", pdfUrl: pdf("ghvb7"), aliases: ["vasant class 7", "class 7 hindi", "grade 7 hindi"], hasBoardPapers: false },
  { grade: 7, subject: "Sanskrit", title: "Ruchira – Class 7", pdfUrl: pdf("gsrt7"), aliases: ["ruchira class 7", "class 7 sanskrit"], hasBoardPapers: false },

  // ── Class 8 ─────────────────────────────────────────────────────────────────
  { grade: 8, subject: "Maths", title: "Mathematics – Class 8", pdfUrl: pdf("hemh8"), aliases: ["class 8 maths", "grade 8 maths", "class 8 mathematics"], hasBoardPapers: false },
  { grade: 8, subject: "Science", title: "Science – Class 8", pdfUrl: pdf("hesc8"), aliases: ["class 8 science", "grade 8 science"], hasBoardPapers: false },
  { grade: 8, subject: "Social Science", title: "Social Science – Class 8", pdfUrl: pdf("hess8"), aliases: ["class 8 social science", "grade 8 sst"], hasBoardPapers: false },
  { grade: 8, subject: "English", title: "Honeydew – Class 8", pdfUrl: pdf("herr8"), aliases: ["honeydew class 8", "class 8 english", "grade 8 english"], hasBoardPapers: false },
  { grade: 8, subject: "Hindi", title: "Vasant – Class 8", pdfUrl: pdf("hhvb8"), aliases: ["vasant class 8", "class 8 hindi", "grade 8 hindi"], hasBoardPapers: false },
  { grade: 8, subject: "Sanskrit", title: "Ruchira – Class 8", pdfUrl: pdf("hsrt8"), aliases: ["ruchira class 8", "class 8 sanskrit"], hasBoardPapers: false },

  // ── Class 9 ─────────────────────────────────────────────────────────────────
  { grade: 9, subject: "Maths", title: "Mathematics – Class 9", pdfUrl: pdf("iemh1"), aliases: ["class 9 maths", "grade 9 maths", "class 9 mathematics"], hasBoardPapers: false },
  { grade: 9, subject: "Science", title: "Science – Class 9", pdfUrl: pdf("iesc1"), aliases: ["class 9 science", "grade 9 science"], hasBoardPapers: false },
  { grade: 9, subject: "Social Science", title: "Social Science – Class 9", pdfUrl: pdf("iess1"), aliases: ["class 9 social science", "grade 9 sst", "class 9 sst"], hasBoardPapers: false },
  { grade: 9, subject: "English", title: "Beehive – Class 9", pdfUrl: pdf("ierr1"), aliases: ["beehive class 9", "class 9 english", "grade 9 english"], hasBoardPapers: false },
  { grade: 9, subject: "Hindi", title: "Kshitij – Class 9", pdfUrl: pdf("ihhb1"), aliases: ["kshitij class 9", "class 9 hindi", "grade 9 hindi"], hasBoardPapers: false },
  { grade: 9, subject: "Sanskrit", title: "Shemushi – Class 9", pdfUrl: pdf("isrt1"), aliases: ["shemushi class 9", "class 9 sanskrit"], hasBoardPapers: false },
  { grade: 9, subject: "Economics", title: "Economics – Class 9", pdfUrl: pdf("iess4"), aliases: ["class 9 economics", "grade 9 economics"], hasBoardPapers: false },

  // ── Class 10 ────────────────────────────────────────────────────────────────
  { grade: 10, subject: "Maths", title: "Mathematics – Class 10", pdfUrl: pdf("jemh1"), aliases: ["class 10 maths", "grade 10 maths", "class 10 mathematics", "tenth maths"], hasBoardPapers: true },
  { grade: 10, subject: "Science", title: "Science – Class 10", pdfUrl: pdf("jesc1"), aliases: ["class 10 science", "grade 10 science", "tenth science"], hasBoardPapers: true },
  { grade: 10, subject: "Social Science", title: "Social Science – Class 10", pdfUrl: pdf("jess1"), aliases: ["class 10 social science", "grade 10 sst", "class 10 sst", "tenth social science"], hasBoardPapers: true },
  { grade: 10, subject: "English", title: "First Flight – Class 10", pdfUrl: pdf("jerr1"), aliases: ["first flight class 10", "class 10 english", "grade 10 english", "tenth english"], hasBoardPapers: true },
  { grade: 10, subject: "Hindi", title: "Kshitij – Class 10", pdfUrl: pdf("jhhb1"), aliases: ["kshitij class 10", "class 10 hindi", "grade 10 hindi", "tenth hindi"], hasBoardPapers: true },
  { grade: 10, subject: "Sanskrit", title: "Shemushi – Class 10", pdfUrl: pdf("jsrt1"), aliases: ["shemushi class 10", "class 10 sanskrit", "tenth sanskrit"], hasBoardPapers: true },
  { grade: 10, subject: "Economics", title: "Understanding Economic Development – Class 10", pdfUrl: pdf("jess4"), aliases: ["class 10 economics", "grade 10 economics", "tenth economics"], hasBoardPapers: true },

  // ── Class 11 ────────────────────────────────────────────────────────────────
  { grade: 11, subject: "Physics", title: "Physics Part 1 – Class 11", pdfUrl: pdf("keph1"), aliases: ["class 11 physics", "grade 11 physics", "eleventh physics", "class 11 physics part 1"], hasBoardPapers: false },
  { grade: 11, subject: "Physics Part 2", title: "Physics Part 2 – Class 11", pdfUrl: pdf("keph2"), aliases: ["class 11 physics part 2", "eleventh physics part 2"], hasBoardPapers: false },
  { grade: 11, subject: "Chemistry", title: "Chemistry Part 1 – Class 11", pdfUrl: pdf("kech1"), aliases: ["class 11 chemistry", "grade 11 chemistry", "eleventh chemistry", "class 11 chemistry part 1"], hasBoardPapers: false },
  { grade: 11, subject: "Chemistry Part 2", title: "Chemistry Part 2 – Class 11", pdfUrl: pdf("kech2"), aliases: ["class 11 chemistry part 2", "eleventh chemistry part 2"], hasBoardPapers: false },
  { grade: 11, subject: "Maths", title: "Mathematics – Class 11", pdfUrl: pdf("kemh1"), aliases: ["class 11 maths", "grade 11 maths", "eleventh maths", "class 11 mathematics"], hasBoardPapers: false },
  { grade: 11, subject: "Biology", title: "Biology – Class 11", pdfUrl: pdf("kebo1"), aliases: ["class 11 biology", "grade 11 biology", "eleventh biology"], hasBoardPapers: false },
  { grade: 11, subject: "Economics", title: "Indian Economic Development – Class 11", pdfUrl: pdf("keec1"), aliases: ["class 11 economics", "grade 11 economics", "eleventh economics"], hasBoardPapers: false },
  { grade: 11, subject: "History", title: "Themes in World History – Class 11", pdfUrl: pdf("kehh1"), aliases: ["class 11 history", "grade 11 history", "eleventh history"], hasBoardPapers: false },
  { grade: 11, subject: "Geography", title: "Fundamentals of Physical Geography – Class 11", pdfUrl: pdf("kegg1"), aliases: ["class 11 geography", "grade 11 geography", "eleventh geography"], hasBoardPapers: false },
  { grade: 11, subject: "English", title: "Hornbill – Class 11", pdfUrl: pdf("kerh1"), aliases: ["hornbill class 11", "class 11 english", "grade 11 english", "eleventh english"], hasBoardPapers: false },
  { grade: 11, subject: "Accounts", title: "Accountancy Part 1 – Class 11", pdfUrl: pdf("keac1"), aliases: ["class 11 accounts", "class 11 accountancy", "grade 11 accounts"], hasBoardPapers: false },
  { grade: 11, subject: "Business Studies", title: "Business Studies – Class 11", pdfUrl: pdf("kebs1"), aliases: ["class 11 business studies", "grade 11 business studies"], hasBoardPapers: false },

  // ── Class 12 ────────────────────────────────────────────────────────────────
  { grade: 12, subject: "Physics", title: "Physics Part 1 – Class 12", pdfUrl: pdf("leph1"), aliases: ["class 12 physics", "grade 12 physics", "twelfth physics", "class 12 physics part 1"], hasBoardPapers: true },
  { grade: 12, subject: "Physics Part 2", title: "Physics Part 2 – Class 12", pdfUrl: pdf("leph2"), aliases: ["class 12 physics part 2", "twelfth physics part 2"], hasBoardPapers: true },
  { grade: 12, subject: "Chemistry", title: "Chemistry Part 1 – Class 12", pdfUrl: pdf("lech1"), aliases: ["class 12 chemistry", "grade 12 chemistry", "twelfth chemistry", "class 12 chemistry part 1"], hasBoardPapers: true },
  { grade: 12, subject: "Chemistry Part 2", title: "Chemistry Part 2 – Class 12", pdfUrl: pdf("lech2"), aliases: ["class 12 chemistry part 2", "twelfth chemistry part 2"], hasBoardPapers: true },
  { grade: 12, subject: "Maths", title: "Mathematics Part 1 – Class 12", pdfUrl: pdf("lemh1"), aliases: ["class 12 maths", "grade 12 maths", "twelfth maths", "class 12 mathematics"], hasBoardPapers: true },
  { grade: 12, subject: "Maths Part 2", title: "Mathematics Part 2 – Class 12", pdfUrl: pdf("lemh2"), aliases: ["class 12 maths part 2", "twelfth maths part 2"], hasBoardPapers: true },
  { grade: 12, subject: "Biology", title: "Biology – Class 12", pdfUrl: pdf("lebo1"), aliases: ["class 12 biology", "grade 12 biology", "twelfth biology"], hasBoardPapers: true },
  { grade: 12, subject: "Economics", title: "Macroeconomics – Class 12", pdfUrl: pdf("leec1"), aliases: ["class 12 economics", "grade 12 economics", "twelfth economics", "macroeconomics class 12"], hasBoardPapers: true },
  { grade: 12, subject: "History", title: "Themes in Indian History – Class 12", pdfUrl: pdf("lehh1"), aliases: ["class 12 history", "grade 12 history", "twelfth history"], hasBoardPapers: true },
  { grade: 12, subject: "Geography", title: "Fundamentals of Human Geography – Class 12", pdfUrl: pdf("legg1"), aliases: ["class 12 geography", "grade 12 geography", "twelfth geography"], hasBoardPapers: true },
  { grade: 12, subject: "English", title: "Flamingo – Class 12", pdfUrl: pdf("lerh1"), aliases: ["flamingo class 12", "class 12 english", "grade 12 english", "twelfth english"], hasBoardPapers: true },
  { grade: 12, subject: "Accounts", title: "Accountancy Part 1 – Class 12", pdfUrl: pdf("leac1"), aliases: ["class 12 accounts", "class 12 accountancy", "grade 12 accounts"], hasBoardPapers: true },
  { grade: 12, subject: "Business Studies", title: "Business Studies – Class 12", pdfUrl: pdf("lebs1"), aliases: ["class 12 business studies", "grade 12 business studies"], hasBoardPapers: true },
];

/**
 * Fuzzy match a spoken query against all textbooks.
 * Returns the best matching TextbookEntry or null.
 */
export function findTextbook(query: string): TextbookEntry | null {
  const q = query.toLowerCase().trim();

  // 1. Direct alias match
  for (const book of TEXTBOOKS) {
    if (book.aliases.some((a) => q.includes(a))) return book;
  }

  // 2. Grade + subject keyword match
  const gradeMatch = q.match(/(?:class|grade|std|standard)?\s*(\d{1,2})/);
  const grade = gradeMatch ? parseInt(gradeMatch[1]) : null;

  const subjectKeywords: Record<string, string[]> = {
    Physics: ["physics", "phy"],
    Chemistry: ["chemistry", "chem"],
    Maths: ["math", "maths", "mathematics"],
    Biology: ["bio", "biology"],
    Science: ["science", "sci"],
    "Social Science": ["social", "sst", "history", "geography", "civics", "political"],
    English: ["english", "eng"],
    Hindi: ["hindi"],
    Sanskrit: ["sanskrit"],
    Economics: ["economics", "eco"],
    History: ["history"],
    Geography: ["geography", "geo"],
    Accounts: ["accounts", "accountancy"],
    "Business Studies": ["business", "bst"],
    EVS: ["evs", "environmental"],
  };

  let subjectMatch: string | null = null;
  for (const [subj, keys] of Object.entries(subjectKeywords)) {
    if (keys.some((k) => q.includes(k))) {
      subjectMatch = subj;
      break;
    }
  }

  if (grade && subjectMatch) {
    const exact = TEXTBOOKS.find(
      (b) => b.grade === grade && b.subject.toLowerCase().includes(subjectMatch!.toLowerCase())
    );
    if (exact) return exact;
  }

  if (grade) {
    return TEXTBOOKS.find((b) => b.grade === grade) ?? null;
  }
  if (subjectMatch) {
    return TEXTBOOKS.find((b) => b.subject.toLowerCase().includes(subjectMatch!.toLowerCase())) ?? null;
  }

  return null;
}
