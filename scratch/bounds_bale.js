import fs from 'fs';

const content = fs.readFileSync('D:\\bale by btn.svg', 'utf8');

// Parse numbers from each path
const paths = content.match(/<path[^>]+>/g) || [];
paths.forEach((p, i) => {
  const d = p.match(/d="([^"]+)"/)?.[1] || '';
  const coords = d.match(/[-+]?[0-9]*\.?[0-9]+/g)?.map(Number) || [];
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (let j = 0; j < coords.length; j += 2) {
    const x = coords[j];
    const y = coords[j+1];
    if (x !== undefined && !isNaN(x)) {
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
    }
    if (y !== undefined && !isNaN(y)) {
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }
  console.log(`Path ${i} bounds: X: [${minX.toFixed(2)}, ${maxX.toFixed(2)}], Y: [${minY.toFixed(2)}, ${maxY.toFixed(2)}], Width: ${(maxX-minX).toFixed(2)}, Height: ${(maxY-minY).toFixed(2)}`);
});
