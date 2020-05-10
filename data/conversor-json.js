const csvFilePath='worldcities.csv';

async function toJSON(){
    const csv=require('csvtojson');
    let jsonArray=await csv().fromFile(csvFilePath);
    jsonArray = JSON.stringify(jsonArray).replace(/},/g,'}\n');

    require("fs").writeFile('worldcities.json', jsonArray.slice(1,jsonArray.length-1), (err) => {
        if(err) {
            throw err;
        }
    });
}

toJSON();