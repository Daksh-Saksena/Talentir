const ACCOUNTING_VISUAL_GRAPH = {
  'accounting equation': [
    { style: 'infographic', searchKey: 'accounting equation assets liabilities capital infographic' },
    { style: 'illustration', searchKey: 'accounting equation balance scale illustration' },
    { style: 'flowchart', searchKey: 'accounting equation money flow visualization' },
    { style: 'real_world_example', searchKey: 'apple reliance tata balance sheet assets liabilities capital example' }
  ]
};
const accountingGraphRef = Object.entries(ACCOUNTING_VISUAL_GRAPH)
  .map(([topic, nodes]) => `"${topic}":\n         ${nodes.map(n => `- Style: "${n.style}" -> Search: "${n.searchKey}"`).join('\n         ')}`)
  .join('\n       ');

console.log("--- GRAPH REF ---");
console.log(accountingGraphRef);
