import { parseVoiceTransaction } from '../src/utils/voiceParser.js';

const testCases = [
  {
    input: "Buku zero tuan 70 ribu di brimo",
    expectedNote: "Buku Zero to One",
    expectedCat: "edukasi",
    expectedAmount: 70000,
    expectedAcc: "BRImo"
  },
  {
    input: "Beli buku ifluence 80 ribu cash",
    expectedNote: "Buku Influence",
    expectedCat: "edukasi",
    expectedAmount: 80000,
    expectedAcc: "Cash"
  },
  {
    input: "Beli buku zero to wan 75rb",
    expectedNote: "Buku Zero to One",
    expectedCat: "edukasi",
    expectedAmount: 75000
  },
  {
    input: "Buku atomik habit 100 ribu di bca",
    expectedNote: "Buku Atomic Habits",
    expectedCat: "edukasi",
    expectedAmount: 100000,
    expectedAcc: "BCA"
  },
  {
    input: "Beli buku psikologi of mani 90 ribu",
    expectedNote: "Buku The Psychology of Money",
    expectedCat: "edukasi",
    expectedAmount: 90000
  }
];

console.log("Running voice test cases...");
let passed = 0;
for (const tc of testCases) {
  const res = parseVoiceTransaction(tc.input);
  console.log(`Input: "${tc.input}" => Note: "${res.note}", Cat: "${res.category?.id}", Amount: ${res.amount}, Acc: "${res.account}"`);
}
