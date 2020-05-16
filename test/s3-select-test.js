const assert = require('assert');
const s3select = require('../lib/s3select');
const fs = require("fs");

const setupJSON = JSON.parse(fs.readFileSync('../setup.demo.json'));

const country = "Japan";
const _BUCKET = setupJSON.serviceName + "-" + setupJSON.bucketName;
const _SQL = setupJSON.SQL1.replace("{country}",country);

const _fileName = "worldcities";

function getS3SelectConfig(setup){
  const params = {
      "Bucket" : _BUCKET, 
      "Key": setup.fileName, 
      "Expression": _SQL,
      "InputSerialization" : {
        "CompressionType": setup.CompressionType,
        ...setup.Type && { [setup.Type] : {
          ...setup.Type==="JSON" && {"Type": setup.JsonType},
          ...setup.Type==="CSV" && {"FileHeaderInfo": setup.csvFileHeader},
          ...setup.Type==="CSV" && setup.FieldDelimiter && {"FieldDelimiter":setup.FieldDelimiter},
          ...setup.Type==="CSV" && setup.Comments && {"Comments":setup.Comments},
          ...setup.Type==="CSV" && setup.QuoteCharacter && {"QuoteCharacter":setup.QuoteCharacter},
          ...setup.Type==="CSV" && setup.QuoteEscapeCharacter && {"QuoteEscapeCharacter":setup.QuoteEscapeCharacter}
        }}
      },
  };
  return params;
}

describe('CSV', function() {
  describe('Uncompressed', function() {
    it('should return results for query ' + _SQL + " on file " + _fileName + ".csv", async function() {
      let results = await s3select.query(getS3SelectConfig({"fileName":_fileName+".csv", "Type":"CSV"}));
      results = JSON.parse(results);
      assert.equal(results[0][4], country);
    });
  });

  describe('GZIP', function() {
    it('should return results for query ' + _SQL + " on file " + _fileName + ".csv.gz", async function() {
      let results = await s3select.query(getS3SelectConfig({"fileName":_fileName+".csv.gz", "Type":"CSV", "CompressionType":"GZIP"}));
      results = JSON.parse(results);
      assert.equal(results[0][4], country);
    });
  });

  describe('BZIP2', function() {
    it('should return results for query ' + _SQL + " on file " + _fileName + ".csv.bz2", async function() {
      let results = await s3select.query(getS3SelectConfig({"fileName":_fileName+".csv.bz2", "Type":"CSV", "CompressionType":"BZIP2"}));
      results = JSON.parse(results);
      assert.equal(results[0][4], country);
    });
  });
});

describe('JSON', function() {
  describe('Uncompressed', function() {
    it('should return results for query ' + _SQL + " on file " + _fileName + ".json", async function() {
      let results = await s3select.query(getS3SelectConfig({"fileName":_fileName+".json", "Type":"JSON"}));
      results = JSON.parse(results);
      assert.equal(results[0].country, country);
    });
  });

  describe('GZIP', function() {
    it('should return results for query ' + _SQL + " on file " + _fileName + ".json.gz", async function() {
      let results = await s3select.query(getS3SelectConfig({"fileName":_fileName+".json.gz", "Type":"JSON", "CompressionType":"GZIP"}));
      results = JSON.parse(results);
      assert.equal(results[0].country, country);
    });
  });

  describe('BZIP2', function() {
    it('should return results for query ' + _SQL + " on file " + _fileName + ".json.bz2", async function() {
      let results = await s3select.query(getS3SelectConfig({"fileName":_fileName+".json.bz2", "Type":"JSON", "CompressionType":"BZIP2"}));
      results = JSON.parse(results);
      assert.equal(results[0].country, country);
    });
  });
});

describe('Parquet', function() {
  it('should return results for query ' + _SQL + " on file " + _fileName + ".parquet", async function() {
    let results = await s3select.query(getS3SelectConfig({"fileName":_fileName+".parquet", "Type":"Parquet"}));
    results = JSON.parse(results);
    assert.equal(results[0].country, country);
  });
});

describe('Wrong setups', function() {
  it('should return results.error for bad key', async function() {
    let results = await s3select.query(getS3SelectConfig({"fileName":_fileName+".qwerty"}));
    results = JSON.parse(results);
    assert(results.error);
  });

  it('should return results.error for bad query', async function() {
    let params = getS3SelectConfig({"fileName":_fileName+".csv"});
    params.Expression = params.Expression + " brrrrrr";
    let results = await s3select.query(params);
    results = JSON.parse(results);
    assert(results.error);
  });

  it('should return results.error for wrong bucket', async function() {
    let params = getS3SelectConfig({"fileName":_fileName+".csv"});
    params.Bucket = params.Bucket + "-brrrrrr";
    let results = await s3select.query(params);
    results = JSON.parse(results);
    assert(results.error);
  });

});
