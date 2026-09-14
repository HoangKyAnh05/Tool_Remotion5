import { extractDriveFolderId } from './src/services/googleDriveService.ts';

const urls = [
  'https://drive.google.com/drive/folders/1w8yqZ-abc123XYZ_999000',
  'https://drive.google.com/drive/u/0/folders/1w8yqZ-abc123XYZ_999000?usp=sharing',
  'https://drive.google.com/open?id=1w8yqZ-abc123XYZ_999000',
  '1w8yqZ-abc123XYZ_999000'
];

for (const u of urls) {
  const id = extractDriveFolderId(u);
  console.log(`URL: ${u} => Extracted ID: ${id}`);
  if (id !== '1w8yqZ-abc123XYZ_999000') {
    throw new Error(`Failed extraction for ${u}`);
  }
}

console.log('ALL DRIVE URL EXTRACTION TESTS PASSED!');
