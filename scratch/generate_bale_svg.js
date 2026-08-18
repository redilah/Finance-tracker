import fs from 'fs';

const content = fs.readFileSync('D:\\bale by btn.svg', 'utf8');

// Extract Path 1 (red bale) and Path 2 (blue by btn)
const paths = content.match(/<path[^>]+>/g) || [];
const path1 = paths[1]; // fill="#ff0101"
const path2 = paths[2]; // fill="#0358ff"

// viewBox around 410 200 380 230
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="410 200 380 230" width="100%" height="100%">
  ${path1}
  ${path2}
</svg>`;

fs.writeFileSync('src/assets/payment-logos/balebybtn.svg', svgContent, 'utf8');
console.log("Saved src/assets/payment-logos/balebybtn.svg");
