// ─── Visual Styles (used by AI prompt for diversity) ────────────────────────
export const VISUAL_STYLES = [
  "Real-world photograph",
  "Illustration",
  "Comic / storyboard",
  "Before vs After comparison",
  "Process flow",
  "Accounting equation animation",
  "Journal entry visualization",
  "T-account visualization",
  "Timeline",
  "Infographic",
  "Diagram",
  "Analogy illustration",
  "Whiteboard sketch",
  "3D render",
  "Icon composition",
  "Short animation",
];

// ─── Visual Taxonomy ─────────────────────────────────────────────────────────
// Maps core teaching concepts to an ordered set of scene queries to visually
// progress through as the teacher deepens their explanation.
export const CONCEPT_VISUAL_TAXONOMY: Record<string, Array<{ type: string; query: string }>> = {
  'depreciation': [
    { type: 'Real-world photograph',    query: 'old worn out machinery factory photograph' },
    { type: 'Illustration',             query: 'asset wear and tear illustration' },
    { type: 'Timeline',                 query: 'asset value decreasing over years timeline chart' },
    { type: 'Diagram',                  query: 'straight line method depreciation graph' },
    { type: 'Before vs After comparison', query: 'SLM vs WDV depreciation methods comparison chart' },
    { type: 'Journal entry visualization', query: 'depreciation journal entry format' },
    { type: 'Infographic',              query: 'balance sheet fixed assets depreciation illustration' },
  ],
  'accounting equation': [
    { type: 'Infographic',              query: 'accounting equation assets liabilities capital infographic' },
    { type: 'Analogy illustration',     query: 'balance scale weighing assets liabilities illustration' },
    { type: 'Before vs After comparison', query: 'accounting equation balanced transaction before after' },
    { type: 'Real-world photograph',    query: 'apple tata balance sheet assets liabilities real example' },
  ],
  'furniture purchase': [
    { type: 'Real-world photograph',    query: 'office furniture purchase business photograph' },
    { type: 'Process flow',             query: 'cash to furniture exchange transaction flow diagram' },
    { type: 'Before vs After comparison', query: 'before after accounting equation asset swap cash furniture' },
    { type: 'T-account visualization',  query: 'furniture account T-account cash account ledger' },
    { type: 'Infographic',              query: 'furniture as fixed asset balance sheet infographic' },
  ],
  'capital': [
    { type: 'Illustration',             query: 'owner handing money to business illustration' },
    { type: 'Real-world photograph',    query: 'entrepreneur investing startup business scene' },
    { type: 'Infographic',              query: 'owner capital equity accounting equation infographic' },
    { type: 'Before vs After comparison', query: 'capital invested before after balance sheet comparison' },
  ],
  'drawings': [
    { type: 'Illustration',             query: 'owner withdrawing cash from business illustration' },
    { type: 'Analogy illustration',     query: 'cash leaving business owner pocket illustration' },
    { type: 'Before vs After comparison', query: 'capital decreasing drawings before after balance sheet' },
    { type: 'Journal entry visualization', query: 'drawings account journal entry debit capital' },
  ],
  'inventory purchase': [
    { type: 'Real-world photograph',    query: 'warehouse inventory stocked shelves goods arriving' },
    { type: 'Illustration',             query: 'supplier delivering inventory to business illustration' },
    { type: 'Before vs After comparison', query: 'before after accounts payable inventory increasing' },
    { type: 'Infographic',              query: 'credit purchase inventory liability accounting infographic' },
  ],
  'bank loan': [
    { type: 'Illustration',             query: 'bank giving loan to business illustration' },
    { type: 'Before vs After comparison', query: 'cash increasing liability increasing bank loan accounting' },
    { type: 'Infographic',              query: 'bank loan liability balance sheet infographic' },
  ],
  'journal': [
    { type: 'Infographic',              query: 'golden rules of accounting debit credit infographic' },
    { type: 'Journal entry visualization', query: 'journal entry format chronological order accounting' },
    { type: 'Process flow',             query: 'double entry bookkeeping journal to ledger flowchart' },
  ],
  'ledger': [
    { type: 'T-account visualization',  query: 'ledger T-account format balancing example' },
    { type: 'Process flow',             query: 'journal entry to ledger posting process flowchart' },
    { type: 'Infographic',              query: 'ledger balancing closing account infographic' },
  ],
  'trial balance': [
    { type: 'Infographic',              query: 'trial balance format debit credit columns infographic' },
    { type: 'Process flow',             query: 'trial balance preparation steps flowchart' },
    { type: 'Before vs After comparison', query: 'trial balance errors omission commission comparison' },
  ],
  'balance sheet': [
    { type: 'Infographic',              query: 'balance sheet format assets liabilities owner equity' },
    { type: 'Analogy illustration',     query: 'balance sheet snapshot company financial health illustration' },
    { type: 'Diagram',                  query: 'balance sheet horizontal vertical format CBSE' },
  ],
};

// ─── Concept Map ─────────────────────────────────────────────────────────────
// Hierarchical map of sub-topics for each Teaching Block.
// Used to display the live Concept Map UI as the teacher explains.
export interface ConceptNode {
  label: string;
  covered: boolean;
  children?: ConceptNode[];
}

export const CONCEPT_MAPS: Record<string, ConceptNode[]> = {
  'depreciation': [
    { label: 'Meaning', covered: false },
    { label: 'Causes', covered: false, children: [
      { label: 'Wear & Tear', covered: false },
      { label: 'Obsolescence', covered: false },
      { label: 'Passage of Time', covered: false },
    ]},
    { label: 'Methods', covered: false, children: [
      { label: 'Straight Line Method', covered: false },
      { label: 'Written Down Value', covered: false },
    ]},
    { label: 'Journal Entry', covered: false },
    { label: 'P&L Impact', covered: false },
    { label: 'Balance Sheet Impact', covered: false },
  ],
  'accounting equation': [
    { label: 'Formula A = L + C', covered: false },
    { label: 'Asset Types', covered: false },
    { label: 'Liability Types', covered: false },
    { label: 'Capital', covered: false },
    { label: 'Equation Balance', covered: false },
  ],
  'journal': [
    { label: 'Golden Rules', covered: false, children: [
      { label: 'Personal Accounts', covered: false },
      { label: 'Real Accounts', covered: false },
      { label: 'Nominal Accounts', covered: false },
    ]},
    { label: 'Format', covered: false },
    { label: 'Date & Narration', covered: false },
    { label: 'Compound Entry', covered: false },
  ],
  'ledger': [
    { label: 'T-Account Format', covered: false },
    { label: 'Posting from Journal', covered: false },
    { label: 'Balancing Accounts', covered: false },
    { label: 'Carried Forward', covered: false },
  ],
  'capital': [
    { label: 'Definition', covered: false },
    { label: 'Owner Investment', covered: false },
    { label: 'Effect on Equation', covered: false },
    { label: 'Capital vs Revenue', covered: false },
  ],
  'drawings': [
    { label: 'Definition', covered: false },
    { label: 'Cash Drawings', covered: false },
    { label: 'Goods Drawings', covered: false },
    { label: 'Effect on Capital', covered: false },
    { label: 'Journal Entry', covered: false },
  ],
};
