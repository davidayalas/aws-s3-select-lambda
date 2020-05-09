const csvFilePath='worldcities.csv';

async function toJSON(){
    const csv=require('csvtojson');
    let jsonArray=await csv().fromFile(csvFilePath);
    jsonArray = JSON.stringify(jsonArray).replace(/},/g,'}\n');
    console.log(jsonArray.slice(1,jsonArray.length-1))
}

async function toParquet(){
    const parquet = require('parquetjs');
    const schema = new parquet.ParquetSchema({
        city: { type: 'UTF8' },
        city_ascii: { type: 'UTF8' },
        lat: { type: 'FLOAT' },
        lng: { type: 'FLOAT' },
        country: { type: 'UTF8' },
        capital: { type: 'UTF8' },
        population: { type: 'INT32' },
        id: { type: 'INT32' },
    });


    const writer = await parquet.ParquetWriter.openFile(schema, 'worldcities.parquet');
 
    const fs = require('fs'); 
    const csv = require('csv-parser');
    
    fs.createReadStream(csvFilePath)
        .pipe(csv())
        .on('data', async function(data){
            try {
                await writer.appendRow({
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
                    id: data.id*1,
                });
            }catch(err) {
                console.log(err)
            }
        })
        .on('end', async function(){
            await writer.close();
            console.log("end")
        });  
}

const target = process.argv[2];

if(["json","parquet"].indexOf(target)>-1){
    target === "json" ? toJSON() : toParquet();
}

async function test(){

    const parquet = require('parquetjs');
    let reader = await parquet.ParquetReader.openFile('worldcities.parquet');
    
    // create a new cursor
    let cursor = reader.getCursor();
    
    // read all records from the file and print them
    let record = null;
    while (record = await cursor.next()) {
       console.log(record);
    }
}

//test()