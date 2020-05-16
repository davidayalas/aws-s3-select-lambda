const aws = require('aws-sdk');
const S3 = new aws.S3({ apiVersion: '2006-03-01', region: process.env.REGION || 'eu-west-1' });

const extend = (toExtend, toApply) => {
  const loopObject = (toE, toA) => {
    for(let k in toA){
      if (typeof toA[k]==="object") {
        if(!toE[k]){toE[k]={};}
        loopObject(toE[k], toA[k]);
      }else{
        if(toA[k] && toA[k]!==""){
          toE[k] = toA[k];
        }
      }
    }
  };
  loopObject(toExtend, toApply);
  return toExtend;
};

//Queries and returns an array with matching items
const select = async (params) => {

  return new Promise((resolve, reject) => {

    S3.selectObjectContent(params, (err, data) => {

      if(err){
        resolve(`{"error":"${err.message}"}`);
        return;
      }

      if(data===null){
        resolve("[]");
        return;
      }

      const eventStream = data.Payload;
      let records = [];
      
      eventStream.on('data', (event) => {
        if(event.Records){
          records.push(event.Records.Payload);
        }else if(event.Stats) {
          if(event.Stats.Details.BytesReturned===0){
            resolve("[]");
          }
        }
      });
    
      eventStream.on('error', (err) => {
        reject(err.name);
      });
    
      eventStream.on('end', () => {
        // Finished receiving events from S3
        if(params.OutputSerialization.CSV){
          records = Buffer.concat(records).toString('utf8').replace(/\r/g,"").split(params.OutputSerialization.CSV.RecordDelimiter);
          records.pop();
          resolve(`[[${records.join("],[")}]]`);
        }else if(params.OutputSerialization.JSON){
          resolve(`[${Buffer.concat(records).toString('utf8').replace(/\n/g,'').replace(/}{/g, '},{')}]`);
        }
      });
    });
  });

};


exports.query = async (setup) => {

  if(!setup || !setup.Bucket || !setup.Key || !setup.Expression){
    return "{\"error\":\"bad setup\"}";
  }

  let default_params = {
    ExpressionType: 'SQL',
    InputSerialization: {
      ...!setup.CompressionType && {"CompressionType": "NONE"},
      ...setup.InputSerialization && setup.InputSerialization.CSV && { "CSV" : {
        FileHeaderInfo: 'USE'
      }},
      ...(setup.InputSerialization && !setup.InputSerialization.JSON && !setup.InputSerialization.Parquet) && { "CSV" : {
        FileHeaderInfo: 'USE'
      }},
      ...setup.InputSerialization && setup.InputSerialization.JSON && {"JSON": { "Type": (!setup.InputSerialization.JSON.Type ? "LINES" : setup.InputSerialization.JSON.Type)}}
    },
    OutputSerialization: {
      ...((setup.InputSerialization && setup.InputSerialization.CSV) || !setup.InputSerialization || (setup.InputSerialization && !setup.InputSerialization.JSON && !setup.InputSerialization.Parquet)) && { "CSV" : {
        FieldDelimiter : ',',
        QuoteFields: 'ALWAYS',
        RecordDelimiter: ';',
      }},
      ...setup.InputSerialization && (setup.InputSerialization.JSON || setup.InputSerialization.Parquet) && {"JSON":{}},
    }
  };

  setup.OutputSerialization = {};
  const params = extend(default_params, setup);
  return await select(params);
};
