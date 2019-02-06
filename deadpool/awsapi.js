/*global require, module*/
'use strict';
// Documentation:
// AWS S3 API --> https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html
const S3BUCKET = 'img.skicyclerun.com';
const S3ALBUMS = 'albums';
const S3PUBLIC = 'pub';
const S3PRIVATE = 'private';
const S3MAXKEYS = 100;

// node libs

var _cc = require('lodash.camelcase');

var ApiBuilder = require('claudia-api-builder');
var api = new ApiBuilder();

// AWS elements -->
var AWS = require('aws-sdk');
var S3 = new AWS.S3({
  apiVersion: '2006-03-01',
  region: 'us-west-2'
});
const dynamodb = new AWS.DynamoDB();
const docClient = new AWS.DynamoDB.DocumentClient();

module.exports = api;

// ******************************************************************
// API Gateway routes
// ******************************************************************
// Doc for API call --> https://docs.aws.amazon.com/sdk-for-javascript/v2/developer-guide/dynamodb-example-document-client.html
api.get('/getMapData/{album}/{image}', async function(request) {

  let table = "Photos";
  let uriAlbum = request.pathParams.album;
  let uriImage = request.pathParams.image;
  let pKey = _cc(uriAlbum + uriImage);

  var params = {
    TableName: table,
    Key: {
      "album": uriAlbum,
      "key": pKey
    }
  };

  console.log('DEBUG: DB query parameters: album = ', uriAlbum, '   key=', pKey);

  let pData = docClient.get(params).promise();

  return pData;
});

api.get('/getImage/{pubFd}/{album}/{image}', async function(request) {

  // length of urlKey and ext is good then pass otherwise default
  let uriPubFd = request.pathParams.pubFd;
  let uriAlbum = request.pathParams.album;
  let uriImage = request.pathParams.image;

  console.log('API ROUTE: getImage:', uriAlbum, '\t', uriImage);

  if (!uriAlbum) {
    uriAlbum = 'skiCycleRun';
  };

  if (!uriImage) {
    uriImage = '00000.jpg';
  }

  let uriPath = uriAlbum + '/' + uriImage;

  var params = {
    Bucket: S3BUCKET,
    Prefix: S3ALBUMS + '/' + uriAlbum,
    MaxKeys: S3MAXKEYS
  };

  const result = await getKey(params, uriPath)
    .then(copyKey);

  return 'https://' + S3BUCKET + '/' + result;

}, {
  success: 301
});

api.get('/verifyPath/{album}/{image}', function(request) {

  var uriAlbum = request.pathParams.album;
  var uriImage = request.pathParams.image;
  var uriPath = uriAlbum + '/' + uriImage;

  let newPath = 'https://' + S3BUCKET + '/pub/' + uriPath;
  console.log('DEBUG: verifyPath 301 = ', newPath);

  return newPath;

}, {
  success: 301
});

// ******************************************************************
// Helper Functions:
// ******************************************************************
async function getKey(params, uriPath) {

  try {

    let allKeys = [];

    let data = await S3.listObjectsV2(params).promise();

    for (let content of data.Contents) {
      allKeys.push(content.Key);
    };

    return ([allKeys[Math.floor(Math.random() * data.KeyCount)], uriPath]); // URI path to image source

  } catch (e) {

    return 'err/skicyclerun_error.jpg';

  }
}

async function copyKey(params) {

  let keyIn = params[0];
  let uriPath = params[1];

  try {

    //let newImgPath = keyIn.replace(S3ALBUMS, S3PUBLIC);
    let srcKey = S3BUCKET + '/' + keyIn
    let outKey = S3PUBLIC + '/' + uriPath;
    console.log('DEBUG S3 COPY: ', srcKey, ' to ', outKey);

    var cpParams = {
      Bucket: S3BUCKET,
      CopySource: srcKey,
      Key: outKey
    };

    let data = await S3.copyObject(cpParams).promise();

    if (data.ETag) {
      return outKey;
    } else {
      // console.log('ERROR: copyObject: ', data);
      return 'err/skicyclerun_error.jpg';
    }

  } catch (err) {

    return 'err/skicyclerun_error.jpg';

  }
};

api.addPostDeployConfig('tableName', 'DynamoDB Table Name:', 'configure-db');
