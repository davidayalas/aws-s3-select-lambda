# AWS S3 Select with AWS Lambda

# Context

* To find the simplest way to publish dynamic microservices
* In our production uses, we use an API Gateway Custom Authorizer that includes in the request the user querying, then one filter in the SQL is the user id.

* AWS S3 Select info: https://docs.aws.amazon.com/AmazonS3/latest/dev/selecting-content-from-objects.html

# Requirements to deploy this demo

* Serverless framework: https://www.serverless.com/framework/docs/getting-started/
* Setup AWS credentials: https://www.serverless.com/framework/docs/providers/aws/cli-reference/config-credentials/
* Install "serverless-s3-sync" plugin

        $ npm install --save serverless-s3-sync

* Export aws ACCOUNT_ID as environment variable

        $ export ACCOUNT_ID=xxxxxxxxxxx

* Deploy demo

        $ sls deploy


# Description

This service exposes:

* an api gateway lambda endpoint [index.js](lib/index.js)
* that uses a wrapper over s3 select to query s3 objects [s3select.js](lib/s3select.js)
* it supports CSV, JSON and Parquet formats as Input

You can create as many endpoints as you want, and setup some ENV VARS to adapt functionality. 

In the serverless example setup file [setup-demo.test.json](setup-demo.test.json) you can view three configurations: CSV, JSON and Parquet.

# Lambda function setup (env vars)

* **METHOD**: default "GET". Other values: POST.
* **BUCKET**
* **FILE**
* **QUERY**: in the query you have to interpolate the query params you want to use to select objects, as '{param}' (note the single quotes) <br /><br />
* Values to setup the INPUT SERIALIZATION:
    * **COMPRESSION_TYPE**: Default "NONE". Other values: "GZIP", "BZIP2"
    * **TYPE**: default "CSV". Other values: "JSON", "Parquet": <br /><br />
        * If "CSV", other vars:
            * **CSV_FILE_HEADER**: default "USE". Other values: "NONE", "IGNORE"
            * **CSV_FIELD_DELIMITER**: A single character used to separate individual fields in a record. You can specify an arbitrary delimiter.
            * **CSV_COMMENTS**: A single character used to indicate that a row should be ignored when the character is present at the start of that row
            * **CSV_QUOTE_CHARACTER**: A single character used for escaping when the field delimiter is part of the value <br /><br />
        * If "JSON", other vars:
            * **JSON_TYPE**: default "LINES". Other values: "DOCUMENT"

# Sample data

* Sample data is from https://simplemaps.com/data/world-cities
* I transform CSV data into **JSON** and **Parquet** with two simple scripts:

        $ node conversor-json.js | python3 conversor-parquet.py


* View [data](data) directory for more info
        
# TODO

* Allow query in post body
