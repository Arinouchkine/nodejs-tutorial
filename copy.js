const fs = require('fs');
const path = require('path');
const utils = require('util');
const readFile = utils.promisify(fs.readFile);
const writeFile = utils.promisify(fs.writeFile);

const originalMap = path.join('upload','try.txt');
const mapCopy = path.join('upload','try-copy.txt');



const option = {
    encoding: 'utf8'
}
function copy(original, copy, encoding) {
    const fileStats = fs.statSync(original);
    const readStream = fs.createReadStream(original, encoding);
    const writeStream = fs.createWriteStream(copy);
    readStream.pipe(writeStream);

    readStream.on('data', chunk => {
        console.log('chunk lu : ', chunk.length , ' sur', fileStats.size);
       // let isWriteOK = writeStream.write(chunk, encoding);
       // console.log('isWriteOK? ', isWriteOK);
       // readStream.pipe(writeStream);
    });
    readStream.on('close', () => {
        console.log(`lecture de ${original} terminée`);
    });
    readStream.on('error', (err) => {
        console.log('error occurs during reading: ', err);
    });
}

copy(originalMap, 'upload/try-copy-3.txt');
copy(originalMap, 'upload/try-copy-4.txt');
/*second
readFile(originalMap)
    .then(data=>{
        console.log(data);
        return writeFile(mapCopy, data);
    })
    .then(result =>{
        console.log("copier")
    })
    .catch(err=>{
        console.log('error', err)
    })
    */
/*first
fs.readFile(originalMap, option, (err, data)=>{
    if (err){
        console.log('error occurs',err)
        throw err;
    }
    console.log(data);
    fs.writeFile(mapCopy, data, (err)=>{
        if (err){
            console.log('error write', err)
            throw err;
        }
        console.log("fichie copier");
    });
});*/