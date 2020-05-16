const csvFilesPath='../files/';
const _fileName='worldcities';
const fs = require("fs");
const exec = require("child_process").exec;

function execCmd(cmd) {
    return new Promise((resolve, reject) => {
        exec(cmd, (error, stdout, stderr) => {
            if (error) {
                console.warn(error);
            }
            resolve(stdout? stdout : stderr);
        });
    });
}

async function toJSON(){
    const csv=require('csvtojson');
    let jsonArray=await csv().fromFile(csvFilesPath+_fileName+".csv");
    jsonArray = JSON.stringify(jsonArray).replace(/},/g,'}\n');

    fs.writeFileSync(csvFilesPath+_fileName+".json", jsonArray.slice(1,jsonArray.length-1), (err) => {
        if(err) {
            throw err;
        }
    });
    console.log(_fileName+".json finished");
}

async function toParquet(){
    const parquet = require('parquetjs');
    const fs = require('fs')

    var schema = new parquet.ParquetSchema({
        city: { type: 'UTF8' },
        city_ascii: { type: 'UTF8' },
        lat: { type: 'FLOAT' },
        lng: { type: 'FLOAT' },
        country: { type: 'UTF8' },
        iso2: { type: 'UTF8' },
        iso3: { type: 'UTF8' },
        admin_name: { type: 'UTF8' },
        capital: { type: 'UTF8' },
        population: { type: 'INT32' },
        id: { type: 'INT32' }
    });    

    const writer = await parquet.ParquetWriter.openFile(schema, csvFilesPath+_fileName+".parquet");
    writer.setRowGroupSize(50000);

    let cities = fs.readFileSync(csvFilesPath+_fileName+".json");
    cities = cities.toString().split("}").join("},");
    cities = cities.slice(0,cities.length-1);
    cities = JSON.parse(`[${cities}]`);

    cities.map(async function(data){
        await writer.appendRow(
            {
                city: data.city,
                city_ascii: data.city_ascii,
                lat: data.lat*1,
                lng: data.lng*1,
                country: data.country,
                iso2: data.iso2,
                iso3: data.iso3,
                admin_name: data.admin_name,
                capital: data.capital,
                population: data.population*1,
                id: data.id*1
            }
        );
    });
    writer.close();
    console.log(_fileName+".parquet finished");
}

async function main(){
    await toJSON();
    await toParquet();
    
    await execCmd("bzip2 -k -f " + csvFilesPath + _fileName + ".csv");
    console.log(_fileName+".csv.bz2 finished");
    await execCmd("bzip2 -k -f " + csvFilesPath+ _fileName + ".json");
    console.log(_fileName+".json.bz2 finished");
    await execCmd("gzip -k -f " + csvFilesPath+ _fileName + ".csv");
    console.log(_fileName+".csv.gz finished");
    await execCmd("gzip -k -f " + csvFilesPath+ _fileName + ".json");
    console.log(_fileName+".json.gz finished");
}

main();