# AWS S3 Select with AWS Lambda

# Context

* Find the simplest way to publish dynamic microservices (only READ)
* In our production uses cases, we use an API Gateway Custom Authorizer that includes in the request the user querying the service. Then, it's easy to filter data in the SQL Expression for that user.
* AWS S3 Select info: https://docs.aws.amazon.com/AmazonS3/latest/dev/selecting-content-from-objects.html

# Requirements to deploy this demo

* Serverless framework: https://www.serverless.com/framework/docs/getting-started/
* Setup AWS credentials: https://www.serverless.com/framework/docs/providers/aws/cli-reference/config-credentials/
* Install "serverless-s3-sync" plugin

        $ npm install --save serverless-s3-sync

* Export aws ACCOUNT_ID as environment variable

        $ export ACCOUNT_ID=xxxxxxxxxxx

* Update "serviceName" with your own in [setup.demo.json](https://github.com/davidayalas/aws-s3-select-lambda/blob/master/setup.demo.json#L2)

* Deploy demo

        $ sls deploy


# Description

This service exposes:

* an api gateway lambda endpoint: [index.js](lib/index.js)
    * that uses a wrapper over s3 select to query s3 objects: [s3select.js](lib/s3select.js)
    * it supports CSV, JSON and Parquet formats as Input

You can create as many endpoints as you want, and setup some ENV VARS to adapt functionality. 

In the serverless example setup file [setup.demo.json](setup.demo.json) you can view four configurations: CSV, JSON, Parquet (get request) and an extra setup for post queries.

# Lambda function setup (env vars)

* **METHOD**: default "GET". Other values: POST.
    * in "POST" method you can send a "QUERY" field in the body with a SQL more complex than only send params through querystring. Example for the endpoint "postQuery"
    
                select s.city from s3object s where CAST(s.lat AS FLOAT)>40.0 and CAST(s.lng AS FLOAT)>-3.0

* **BUCKET**
* **FILE**
* **QUERY** (only for GET method): in the query you have to interpolate the query params you want to use to select objects, as '{param}' (note the single quotes) <br /><br />
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
* I transform CSV data into **JSON** and **Parquet** with a simple script:

        $ npm install | node conversor

* The same script compress csv and json into gzip and bzip2 for testing.
* View [data](data) directory for more info
        
# Test

Requirements for test: 

* Upload the content from data/files to the bucket specified in setup.demo.json
* Setup aws credentials
* Then...

        $ cd test
        $ npm test
