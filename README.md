# AWS S3 Select with AWS Lambda

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

You can create as many endpoints as you want, and setup some ENV VARS to adapt functionality. 

In the serverless example setup file [setup-demo.test.json](setup-demo.test.json) you can view two configurations, one for a CSV file and another one for a JSON file.

# Lambda function setup (env vars)

* **METHOD**: default "GET". Other values: POST.
* **BUCKET**
* **FILE**
* **QUERY**: in the query you have to interpolate the query params you want to use to select objects, as '{param}' (note the single quotes)
* **COMPRESSION_TYPE**: Default "NONE". Other values: GZIP or BZIP2
* **TYPE**: default "CSV". Other values: JSON
    * If CSV, other vars:
        * FILE_HEADER: default "USE". Other values: NONE, IGNORE
