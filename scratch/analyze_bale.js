import fs from 'fs';

const content = fs.readFileSync('D:\\bale by btn.svg', 'utf8');

// Match all <path ... />
const paths = content.match(/<path[^>]+>/g) || [];
console.log("Total paths:", paths.length);
paths.forEach((p, i) => {
  console.log(`\nPath ${i}:`);
  const fill = p.match(/fill="([^"]+)"/)?.[1];
  console.log("Fill:", fill);
  const d = p.match(/d="([^"]+)"/)?.[1] || '';
  console.log("D length:", d.length, "Start:", d.substring(0, 100));
});
