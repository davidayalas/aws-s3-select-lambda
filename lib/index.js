const s3select = require("./s3select");

const _METHOD = process.env.METHOD || "GET";

const _BUCKET = process.env.BUCKET;
const _FILE = process.env.FILE;
const _QUERY = process.env.QUERY;

const _COMPRESSION_TYPE = process.env.COMPRESSION_TYPE || "NONE";
const _TYPE = process.env.TYPE || "CSV";

const _CSV_FILE_HEADER = process.env.CSV_FILE_HEADER || "USE";
const _CSV_FIELD_DELIMITER = process.env.CSV_FIELD_DELIMITER;
const _CSV_COMMENTS = process.env.CSV_COMMENTS;
const _CSV_QUOTE_CHARACTER = process.env.CSV_QUOTE_CHARACTER;
const _CSV_QUOTE_ESCAPE_CHARACTER = process.env.CSV_QUOTE_ESCAPE_CHARACTER;

const _JSON_TYPE = process.env.JSON_TYPE || "LINES";

//Changes interpolated vars in envvar QUERY with values from querystring or body
const interpolateQueryParams = (query, params) => {
  const re = /{([^}]+)}/g;
  let match;
  
  if(!params){
    return null;
  }

  while(match=re.exec(query)) {
    if(!params[match[1]]){return null;}
    query = query.replace(match[0], params[match[1]]);
  }
  
  return query.replace(/\"/g,"'");
};

exports.handler = async (event) => {

  let response = {
    statusCode: '200',
    body: "[]",
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin' : '*',
      'Access-Control-Allow-Credentials' : true
    }  
  };

  let request_params = event.queryStringParameters; 
  if(event.body && event.body !== "" && _METHOD==="POST") {
    request_params = JSON.parse(event.body);
  }

  if(!_QUERY){
    response.body = "{\"error\":\"wrong setup - QUERY not found\"}";
    return response;
  }

  const _SQL = interpolateQueryParams(_QUERY, request_params);
  if(_SQL===null){
    response.body = "{\"error\":\"wrong params\"}";
    return response;
  }

  const params = {
    "Bucket" : _BUCKET, 
    "Key": _FILE, 
    "Expression": _SQL,
    "InputSerialization" : {
      "CompressionType": _COMPRESSION_TYPE,
      [_TYPE] : {
        ..._TYPE==="JSON" && {"Type": _JSON_TYPE},
        ..._TYPE==="CSV" && {"FileHeaderInfo": _CSV_FILE_HEADER},
        ..._TYPE==="CSV" &&_CSV_FIELD_DELIMITER && {"FieldDelimiter":_CSV_FIELD_DELIMITER},
        ..._TYPE==="CSV" &&_CSV_COMMENTS && {"Comments":_CSV_COMMENTS},
        ..._TYPE==="CSV" &&_CSV_QUOTE_CHARACTER && {"QuoteCharacter":_CSV_QUOTE_CHARACTER},
        ..._TYPE==="CSV" &&_CSV_QUOTE_ESCAPE_CHARACTER && {"QuoteEscapeCharacter":_CSV_QUOTE_ESCAPE_CHARACTER}
      }
    },
  };
  
  try{
    response.body = await s3select.query(params);
  }catch(e){
    console.log(e);
  }  

  return response;
};