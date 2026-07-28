/**
 * Local Image Library — Grade 11 Accountancy Journal Chapter
 *
 * Priority: Local library first → Internet fallback.
 * Scoring: Semantic keyword overlap (filename + tags) vs search query.
 * Diversity: Tracks shown images per lesson; avoids repetition; rotates equally-scored images.
 */

export interface LocalImage {
  filename: string;               // actual file name in /public/pics/
  url: string;                    // relative URL served by Next.js
  tags: string[];                 // semantic tags for matching
}

// ── Image catalogue ──────────────────────────────────────────────────────────
// Each entry has filename, served URL, and a rich tag set for semantic matching.
export const LOCAL_IMAGES: LocalImage[] = [
  // T-Accounts & Ledger
  { filename: "T account accounting.jpg", url: "/pics/T account accounting.jpg",
    tags: ["t account", "t-account", "ledger", "debit", "credit", "double entry", "accounting format", "dr cr", "chart of accounts"] },
  { filename: "accounting T chart.png", url: "/pics/accounting T chart.png",
    tags: ["t chart", "t account", "ledger format", "debit", "credit", "accounting structure"] },
  { filename: "ledger accounting illustration.jpeg", url: "/pics/ledger accounting illustration.jpeg",
    tags: ["ledger", "account book", "t-account", "posting", "balance", "accounting ledger", "journal to ledger"] },
  { filename: "accounting ledger book.webp", url: "/pics/accounting ledger book.webp",
    tags: ["ledger book", "ledger", "account book", "balance sheet", "record", "books of account"] },

  // Journal & Journal Entries
  { filename: "general journal accounting.webp", url: "/pics/general journal accounting.webp",
    tags: ["journal", "general journal", "journal entry", "accounting entry", "book of original entry"] },
  { filename: "journal entry example.png", url: "/pics/journal entry example.png",
    tags: ["journal entry", "journal", "debit", "credit", "accounting entry", "example", "narration"] },
  { filename: "journal format accounting.jpg", url: "/pics/journal format accounting.jpg",
    tags: ["journal format", "journal", "columns", "date narration", "accounting format", "entry format"] },
  { filename: "journal page accounting.jpeg", url: "/pics/journal page accounting.jpeg",
    tags: ["journal page", "journal book", "ledger folio", "accounting entry", "handwritten journal"] },
  { filename: "accounting journal book.webp", url: "/pics/accounting journal book.webp",
    tags: ["journal book", "journal", "book of account", "accounting book", "original entry"] },
  { filename: "bookkeeping journal.jpg", url: "/pics/bookkeeping journal.jpg",
    tags: ["bookkeeping", "journal", "record", "book of accounts", "financial record"] },
  { filename: "journal voucher.webp", url: "/pics/journal voucher.webp",
    tags: ["voucher", "journal voucher", "source document", "evidence", "transaction document"] },

  // Debit & Credit / Double Entry
  { filename: "debit and credit accounting.png", url: "/pics/debit and credit accounting.png",
    tags: ["debit", "credit", "dr cr", "accounting rules", "double entry", "golden rules"] },
  { filename: "debit credit balance.jpeg", url: "/pics/debit credit balance.jpeg",
    tags: ["debit", "credit", "balance", "account balance", "t-account balance", "trial balance"] },
  { filename: "debit credit classroom.jpeg", url: "/pics/debit credit classroom.jpeg",
    tags: ["debit", "credit", "classroom", "teaching", "accounting class", "golden rules", "explanation"] },
  { filename: "debit credit illustration.jpeg", url: "/pics/debit credit illustration.jpeg",
    tags: ["debit", "credit", "illustration", "dr cr", "accounting concept", "golden rules illustration"] },
  { filename: "debit credit infographic.jpeg", url: "/pics/debit credit infographic.jpeg",
    tags: ["debit", "credit", "infographic", "rules", "golden rules", "dr cr rules", "visual summary"] },
  { filename: "double entry accounting diagram.jpeg", url: "/pics/double entry accounting diagram.jpeg",
    tags: ["double entry", "bookkeeping", "diagram", "debit credit", "two sides", "equation"] },
  { filename: "double entry bookkeeping.jpg", url: "/pics/double entry bookkeeping.jpg",
    tags: ["double entry", "bookkeeping", "books of account", "record", "journal", "system"] },
  { filename: "accounting rules infographic.jpeg", url: "/pics/accounting rules infographic.jpeg",
    tags: ["rules", "golden rules", "real account", "personal account", "nominal account", "infographic", "three types"] },

  // Accounting Equation
  { filename: "accounting equation diagram.png", url: "/pics/accounting equation diagram.png",
    tags: ["accounting equation", "assets liabilities capital", "equation", "balance sheet equation", "owner equity"] },
  { filename: "bookkeeping concepts.png", url: "/pics/bookkeeping concepts.png",
    tags: ["bookkeeping", "concepts", "overview", "accounting basics", "assets liabilities", "double entry concept"] },

  // Books, Documents, Records
  { filename: "accounting notebook.avif", url: "/pics/accounting notebook.avif",
    tags: ["notebook", "account book", "record", "writing", "manual", "financial record"] },
  { filename: "accounting paperwork.jpeg", url: "/pics/accounting paperwork.jpeg",
    tags: ["paperwork", "documents", "financial documents", "accounting office", "desk", "record"] },
  { filename: "accounting records office.jpg", url: "/pics/accounting records office.jpg",
    tags: ["records", "office", "accounting office", "files", "archive", "books of account"] },
  { filename: "accounting register.webp", url: "/pics/accounting register.webp",
    tags: ["register", "account register", "record", "financial register", "cashbook"] },
  { filename: "financial accounting documents.png", url: "/pics/financial accounting documents.png",
    tags: ["financial documents", "balance sheet", "statement", "report", "accounting documents"] },
  { filename: "financial records book.jpeg", url: "/pics/financial records book.jpeg",
    tags: ["financial records", "book", "accounts", "data", "historical record", "financial book"] },
  { filename: "manual bookkeeping.jpg", url: "/pics/manual bookkeeping.jpg",
    tags: ["manual bookkeeping", "handwritten", "book", "traditional accounting", "pen writing ledger"] },

  // Bookkeeper / Accountant at Work
  { filename: "accountant writing journal entries.png", url: "/pics/accountant writing journal entries.png",
    tags: ["accountant", "writing", "journal entry", "recording", "bookkeeper", "professional"] },
  { filename: "bookkeeper working.jpeg", url: "/pics/bookkeeper working.jpeg",
    tags: ["bookkeeper", "working", "accountant", "desk", "calculator", "professional accounting"] },

  // Cash Transactions
  { filename: "cash payment.jpg", url: "/pics/cash payment.jpg",
    tags: ["cash payment", "cash", "payment", "money paid", "cash transaction", "purchase cash"] },
  { filename: "cash received.jpeg", url: "/pics/cash recieved.jpeg",
    tags: ["cash received", "cash receipt", "income", "money received", "sales cash"] },
  { filename: "cash deposit.jpg", url: "/pics/cash deposit.jpg",
    tags: ["cash deposit", "bank deposit", "money deposited", "deposit", "savings"] },
  { filename: "cash withdraw.avif", url: "/pics/cash withdraw.avif",
    tags: ["cash withdrawal", "withdraw", "money out", "ATM", "bank withdrawal", "drawing"] },
  { filename: "cash register.jpeg", url: "/pics/cash register.jpeg",
    tags: ["cash register", "POS", "sales", "retail", "checkout", "cash transaction", "till"] },
  { filename: "indian rupee cash.jpg", url: "/pics/indian rupee cash.jpg",
    tags: ["rupee", "cash", "indian currency", "money", "notes", "currency"] },
  { filename: "money exchange.webp", url: "/pics/money exchange.webp",
    tags: ["money exchange", "transfer", "payment", "currency", "transaction"] },

  // Bank & Cheque
  { filename: "bank counter customer transaction.jpeg", url: "/pics/bank counter customer transaction.jpeg",
    tags: ["bank", "counter", "transaction", "banking", "customer bank", "bank account"] },
  { filename: "business cheque being signed.webp", url: "/pics/business cheque being signed.webp",
    tags: ["cheque", "check", "signed cheque", "payment instrument", "bank cheque", "cheque transaction"] },
  { filename: "business online banking laptop.jpg", url: "/pics/business online banking laptop.jpg",
    tags: ["online banking", "digital payment", "laptop", "bank transfer", "internet banking"] },

  // Business Transactions & Invoices
  { filename: "business invoice document on desk.jpg", url: "/pics/business invoice document on desk.jpg",
    tags: ["invoice", "bill", "document", "purchase invoice", "sales invoice", "business document", "source document"] },
  { filename: "business transaction record.png", url: "/pics/business transaction record.png",
    tags: ["transaction", "record", "business transaction", "accounting entry", "ledger entry"] },
  { filename: "business handshake signing contract.jpeg", url: "/pics/business handshake signing contract.jpeg",
    tags: ["contract", "deal", "agreement", "signing", "business deal", "trade"] },
  { filename: "supplier invoice close up.jpg", url: "/pics/supplier invoice close up.jpg",
    tags: ["supplier invoice", "invoice", "vendor bill", "purchase invoice", "creditor invoice"] },

  // Purchase / Sale / Inventory
  { filename: "business procurement.jpg", url: "/pics/business procurement.jpg",
    tags: ["procurement", "purchasing", "buying", "purchase", "goods purchased", "inventory purchase"] },
  { filename: "receiving inventory.jpg", url: "/pics/receiving inventory.jpg",
    tags: ["inventory", "goods received", "stock received", "receiving goods", "warehouse incoming"] },
  { filename: "retail store inventory shelves.jpeg", url: "/pics/retail store inventory shelves.jpeg",
    tags: ["inventory", "stock", "retail", "shelves", "goods", "store inventory"] },
  { filename: "shopkeeper handing product to customer.jpeg", url: "/pics/shopkeeper handing product to customer.jpeg",
    tags: ["sale", "selling", "shopkeeper", "customer", "retail sale", "goods sold", "transaction sale"] },
  { filename: "customer paying at retail checkout.jpeg", url: "/pics/customer paying at retail checkout.jpeg",
    tags: ["sale", "customer paying", "checkout", "retail sale", "cash sale", "sales transaction"] },
  { filename: "point of sale terminal checkout.jpeg", url: "/pics/point of sale terminal checkout.jpeg",
    tags: ["POS", "point of sale", "checkout", "retail", "sale", "card payment", "billing"] },

  // Supplier / Warehouse / Delivery
  { filename: "supplier delivering goods.jpeg", url: "/pics/supplier delivering goods.jpeg",
    tags: ["supplier", "vendor", "delivering", "goods delivery", "purchase", "trade payable"] },
  { filename: "supplier delivering boxes to warehouse.avif", url: "/pics/supplier delivering boxes to warehouse.avif",
    tags: ["supplier", "warehouse", "delivery", "boxes", "goods received", "consignment"] },
  { filename: "warehouse delivery.jpeg", url: "/pics/warehouse delivery.jpeg",
    tags: ["warehouse", "delivery", "goods", "stock", "logistics", "inventory received"] },
  { filename: "warehouse shelves full of inventory.jpg", url: "/pics/warehouse shelves full of inventory.jpg",
    tags: ["warehouse", "inventory", "stock", "shelves", "storage", "goods in stock"] },

  // Capital / Owner / Equity
  { filename: "entrepreneur funding business.webp", url: "/pics/entrepreneur funding business.webp",
    tags: ["capital", "owner investing", "entrepreneur", "funding", "equity", "capital introduced", "proprietor"] },
  { filename: "equity investment illustration.jpeg", url: "/pics/equity investment illustration.jpeg",
    tags: ["equity", "investment", "capital", "owner equity", "shareholder", "capital contribution"] },

  // Salary / Employee
  { filename: "employee receiving salary paycheck.webp", url: "/pics/employee receiving salary paycheck.webp",
    tags: ["salary", "wages", "paycheck", "employee", "payment to staff", "salary expense", "payroll"] },

  // Office / Building
  { filename: "commercial office building exterior.jpeg", url: "/pics/commercial office building exterior.jpeg",
    tags: ["office", "building", "premises", "commercial property", "business premises", "rent", "fixed asset"] },
  { filename: "office furniture delivery.jpeg", url: "/pics/office furniture delivery.jpeg",
    tags: ["furniture", "office furniture", "asset purchase", "desk", "chair", "fixed asset", "furniture purchased"] },
];

// ── Semantic scorer ──────────────────────────────────────────────────────────

/**
 * Tokenise a string into lower-case words (splits on spaces, hyphens, underscores, dots).
 */
function tokenise(str: string): string[] {
  // Ignore common short stop words that cause false positive matches
  const stopWords = new Set(["the", "and", "for", "with", "from", "into", "during", "including", "until", "against", "among", "throughout", "despite", "towards", "upon", "concerning", "about", "what", "how", "why", "when", "where", "who", "which", "that", "this", "these", "those", "can", "could", "would", "should", "will", "shall", "may", "might", "must", "have", "has", "had", "doing", "does", "did", "are", "was", "were", "been", "being", "business", "work", "working", "example", "concept", "illustration", "diagram", "infographic"]);
  return str.toLowerCase().split(/[\s\-_.,()/]+/).filter(t => t.length > 2 && !stopWords.has(t));
}

/**
 * Score a single image against a search query.
 * Returns 0–1; higher = more relevant.
 */
export function scoreImage(image: LocalImage, query: string): number {
  const qTokens = new Set(tokenise(query));
  if (qTokens.size === 0) return 0;

  const imageText = [image.filename, ...image.tags].join(" ");
  const imgTokens = tokenise(imageText);
  if (imgTokens.length === 0) return 0;

  let matched = 0;
  for (const t of imgTokens) {
    if (qTokens.has(t)) matched++;
  }

  // Award phrase bonus ONLY if an actual multi-word tag is contained in the query
  const lowerQuery = query.toLowerCase();
  let phraseBonus = 0;
  for (const tag of image.tags) {
    if (tag.length > 4 && lowerQuery.includes(tag.toLowerCase())) {
      phraseBonus += 2;
    }
  }

  const total = qTokens.size + imgTokens.length;
  return Math.min(1, (matched * 2.5 + phraseBonus) / total);
}

// ── Lesson-level image history (in-memory, reset on page load) ───────────────

const shownImages: string[] = [];    // filenames shown this lesson, in order
let lastUsedIndexMap: Record<string, number> = {}; // tracks last index for rotation

/**
 * Record that an image was shown.
 */
export function recordShownImage(filename: string): void {
  shownImages.push(filename);
  lastUsedIndexMap[filename] = (lastUsedIndexMap[filename] ?? -1) + 1;
}

/**
 * Reset history (call at session start).
 */
export function resetImageHistory(): void {
  shownImages.length = 0;
  lastUsedIndexMap = {};
}

/**
 * How recently (in steps back) was this image shown? Returns Infinity if never shown.
 */
function recencyScore(filename: string): number {
  for (let i = shownImages.length - 1; i >= 0; i--) {
    if (shownImages[i] === filename) return shownImages.length - 1 - i;
  }
  return Infinity;
}

// ── Main search function ─────────────────────────────────────────────────────

const SIMILARITY_THRESHOLD = 0.25;   // minimum score to use local image

export interface LocalImageResult {
  image: LocalImage;
  score: number;
  source: "local";
}

/**
 * Search the local library for the best image matching `query`.
 * Applies diversity rules (never repeat immediately, prefers least recently used).
 * Returns null if no image passes the threshold (caller should fall back to internet).
 */
export function searchLocalLibrary(
  query: string,
  currentImageFilename?: string | null
): LocalImageResult | null {
  if (!query.trim()) return null;

  // Score all images
  const scored = LOCAL_IMAGES
    .map(img => ({ image: img, score: scoreImage(img, query) }))
    .filter(({ score }) => score >= SIMILARITY_THRESHOLD)
    .sort((a, b) => b.score - a.score);

  if (scored.length === 0) return null;

  const topScore = scored[0].score;
  // Candidates within 20% of the top score (treat as equally good)
  const candidates = scored.filter(({ score }) => score >= topScore * 0.8);

  // Among candidates, pick the one with the highest recency score (least recently used)
  // and that isn't the currently displayed image
  let best = candidates[0];
  let bestRecency = -Infinity;

  for (const candidate of candidates) {
    const filename = candidate.image.filename;
    if (filename === currentImageFilename) continue; // never show same image twice in a row
    const recency = recencyScore(filename);
    if (recency > bestRecency) {
      bestRecency = recency;
      best = candidate;
    }
  }

  // If all candidates are the current image, allow it as fallback
  if (!best || best.image.filename === currentImageFilename) {
    best = candidates[0];
  }

  return { image: best.image, score: best.score, source: "local" };
}
