const { S3 } = require("@aws-sdk/client-s3");

const S3Client = new S3({ apiVersion: '2006-03-01', region: process.env.REGION || 'eu-west-1' });

/**
 * Deep extension of objects, for completing default params with setup
 */
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

/**
 * Return a promise that wraps the eventstream when using selectObjectContent
 */
 const select = async (params) => {
  return new Promise((resolve, reject) => {

    S3Client.selectObjectContent(params, (err, data) => {

      if(err){
        resolve(`{"error":"${err.message}"}`);
        return;
      }

      if(data===null){
        resolve("[]");
        return;
      }

      let records = [];

      (async () => {
        const chunks = [];
        for await (const value of data.Payload) {
          if (value.Records) {
            chunks.push(value.Records.Payload);
          }
        }

        if(params.OutputSerialization.CSV){
          records = Buffer.concat(chunks).toString('utf8').replace(/\r/g,"").split(params.OutputSerialization.CSV.RecordDelimiter);
          records.pop();
          resolve(`[[${records.join("],[")}]]`);
        }else if(params.OutputSerialization.JSON){
          resolve(`[${Buffer.concat(chunks).toString('utf8').replace(/\n/g,'').replace(/}{/g, '},{')}]`);
        }

      })()

    });
  });

};

/**
 * Wraps query to S3 Select and sets default params and error control.
 * 
 * @param {Object} setup  See default_params object and other setup options
 * 
 * @return {String} It will return an Array of items or an object holding "error" key. To parse in destination if necessary.
 */
exports.query = async (setup) => {

  if(!setup || !setup.Bucket || !setup.Key || !setup.Expression){
    return "{\"error\":\"bad setup\"}";
  }

  let default_params = {
    ExpressionType: 'SQL',
    InputSerialization: {
      ...!setup.CompressionType && {"CompressionType": "NONE"},
      ...((setup.InputSerialization && setup.InputSerialization.CSV) || (!setup.InputSerialization)) && { "CSV" : {
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
