const s3select = require("./s3select");
const _METHOD = process.env.METHOD || "GET";

const _BUCKET = process.env.BUCKET;
const _FILE = process.env.FILE;
const _QUERY = process.env.QUERY;
const _TYPE = process.env.TYPE || "CSV";
const _COMPRESSION_TYPE = process.env.COMPRESSION_TYPE || "NONE";
const _CSV_FILE_HEADER = process.env.FILE_HEADER || "USE";

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

  let params = {
        "Bucket" : _BUCKET, 
        "Key": _FILE, 
        "Expression": _SQL,
  };

  if(_TYPE==="JSON"){
    params.InputSerialization = {
      "CompressionType": _COMPRESSION_TYPE,
      "JSON" : {
        "Type": 'DOCUMENT'
      }
    };
    params.OutputSerialization = {"JSON":{}};
  }else if(_TYPE==="CSV"){
    params.InputSerialization = {
      "CompressionType": _COMPRESSION_TYPE,
      "CSV" : {
        "FileHeaderInfo": _CSV_FILE_HEADER
      }
    };
  }

  try{
    response.body = await s3select.query(params);
  }catch(e){
    console.log(e);
  }  

  return response;
};