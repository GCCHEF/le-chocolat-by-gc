import {readFileSync, writeFileSync} from 'node:fs';

const input = '/Users/greg/Downloads/Table Mountain Large.stl';
const output = 'public/models/table-mountain-heightfield.bin';
const size = 512;
const source = readFileSync(input);
const triangleCount = source.readUInt32LE(80);
const heights = new Float32Array(size * size);
heights.fill(Number.NaN);

const minX = 6.154359817504883;
const maxX = 206.15435791015625;
const minY = 6.864675998687744;
const maxY = 206.8646697998047;
const maxZ = 34.95406723022461;
const manufacturedBaseZ = 2.6;

for (let triangle = 0; triangle < triangleCount; triangle += 1) {
  const triangleOffset = 84 + triangle * 50;
  for (let vertex = 0; vertex < 3; vertex += 1) {
    const offset = triangleOffset + 12 + vertex * 12;
    const x = source.readFloatLE(offset);
    const y = source.readFloatLE(offset + 4);
    const z = source.readFloatLE(offset + 8);
    const column = Math.max(
      0,
      Math.min(size - 1, Math.round(((x - minX) / (maxX - minX)) * (size - 1))),
    );
    const row = Math.max(
      0,
      Math.min(size - 1, Math.round(((y - minY) / (maxY - minY)) * (size - 1))),
    );
    const index = row * size + column;
    heights[index] = Number.isNaN(heights[index])
      ? z
      : Math.max(heights[index], z);
  }
}

for (let pass = 0; pass < 8; pass += 1) {
  const previous = heights.slice();
  for (let row = 0; row < size; row += 1) {
    for (let column = 0; column < size; column += 1) {
      const index = row * size + column;
      if (!Number.isNaN(previous[index])) continue;
      let sum = 0;
      let count = 0;
      for (let offsetY = -1; offsetY <= 1; offsetY += 1) {
        for (let offsetX = -1; offsetX <= 1; offsetX += 1) {
          const x = column + offsetX;
          const y = row + offsetY;
          if (x < 0 || x >= size || y < 0 || y >= size) continue;
          const value = previous[y * size + x];
          if (!Number.isNaN(value)) {
            sum += value;
            count += 1;
          }
        }
      }
      if (count) heights[index] = sum / count;
    }
  }
}

const encoded = Buffer.alloc(size * size * 2);
for (let index = 0; index < heights.length; index += 1) {
  const terrainHeight = Math.max(0, (heights[index] || 0) - manufacturedBaseZ);
  const normalized = Math.max(
    0,
    Math.min(
      65535,
      Math.round((terrainHeight / (maxZ - manufacturedBaseZ)) * 65535),
    ),
  );
  encoded.writeUInt16LE(normalized, index * 2);
}

writeFileSync(output, encoded);
console.log(`${triangleCount} triangles converted to ${size}×${size} heightfield`);
