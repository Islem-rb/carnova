import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve, dirname } from 'node:path';
const project = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const source = resolve(project, '../carnova-back/uploads');
const output = resolve(project, 'public/assets/market');
await mkdir(output, { recursive: true });
const images = {
  hero: '1756148785911_nobg.png',
  bmw: '1753570871058_mbw.jpg',
  porsche: '1753568984097_porshe.jpg',
  audi: '1753569538605_audi.jpg',
  range: '1753569563224_range rover.jpg',
  mercedes: '1755031012451_nobg.png',
  showroom: '1753570871058_mbw.jpg',
  tesla: '1753573938623_tesla.avif',
};
for (const [name, file] of Object.entries(images)) {
  let image = sharp(resolve(source, file));
  if (name === 'hero') image = image.trim();
  await image
    .resize({
      width: name === 'hero' ? 1400 : 1000,
      height: 900,
      fit: 'inside',
      withoutEnlargement: true,
    })
    .webp({ quality: 86, effort: 6 })
    .toFile(resolve(output, name + '.webp'));
}
await sharp({ create: { width: 240, height: 160, channels: 3, background: '#77835d' } })
  .png()
  .toFile(resolve(project, 'tests/fixtures/listing.png'));
