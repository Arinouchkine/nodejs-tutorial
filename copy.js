const fs = require('fs');
const path = require('path');

const originalMap = path.join('data', 'map.pdf');
const originalCsv = path.join('data', '100_lines.csv');

function copy(original, copy, encoding) {
  const readStream = fs.createReadStream(original, encoding);
  const writeStream = fs.createWriteStream(copy);
  if (encoding) writeStream.setDefaultEncoding(encoding);

  readStream.on('data', chunk => {
    console.log('chunk lu : ', chunk);
    let isWriteOK = writeStream.write(chunk, encoding);
    console.log('isWriteOK? ', isWriteOK);
  });
  readStream.on('close', () => {
    console.log(`lecture de ${original} terminée`);
  });
  readStream.on('error', (err) => {
    console.log('error occurs during reading: ', err);
  });
}

copy(originalMap, 'map-copy.pdf');
copy(originalCsv, '100_lines-copy.csv', 'utf8');
