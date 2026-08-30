/**
 * Test runner script to execute unit tests for notification providers and parsers.
 */
import { runParserTests } from '../src/utils/notificationProviders.js';

console.log('========================================');
console.log('CASSIEL NOTIFICATION PARSER UNIT TESTS');
console.log('========================================\n');

const results = runParserTests();
let passedCount = 0;
let failedCount = 0;

for (const res of results) {
  if (res.passed) {
    passedCount++;
    console.log(`✅ PASS: ${res.name}`);
  } else {
    failedCount++;
    console.log(`❌ FAIL: ${res.name}`);
    console.log(`   Expected: ${res.expected}`);
    console.log(`   Actual:   ${res.actual}`);
  }
}

console.log(`\n========================================`);
console.log(`TOTAL: ${results.length} | PASSED: ${passedCount} | FAILED: ${failedCount}`);
console.log(`========================================`);

if (failedCount > 0) {
  process.exit(1);
} else {
  console.log(`ALL ${passedCount} UNIT TESTS PASSED PERFECTLY! ✨`);
}
