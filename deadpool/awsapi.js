/*global require, module*/
'use strict';
// Documentation:
// text art --> http://patorjk.com/software/taag/#p=display&h=2&v=2&f=Calvin%20S&t=API%20Gateway%20Routes
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
//
// ╔═╗╔═╗╦  ╔═╗┌─┐┌┬┐┌─┐┬ ┬┌─┐┬ ┬  ╦═╗┌─┐┬ ┬┌┬┐┌─┐┌─┐
// ╠═╣╠═╝║  ║ ╦├─┤ │ ├┤ │││├─┤└┬┘  ╠╦╝│ ││ │ │ ├┤ └─┐
// ╩ ╩╩  ╩  ╚═╝┴ ┴ ┴ └─┘└┴┘┴ ┴ ┴   ╩╚═└─┘└─┘ ┴ └─┘└─┘
//
// ******************************************************************
api.get('/getImage/{fldID}/{album}/{image}', async function(request) {

  // notes:
  //  --> CACHE: add fldID to keep URL/URI same after copy when page reloads
  let onlyNo = /[0-9].jpg/g;

  // length of urlKey and ext is good then pass otherwise default
  let uriFldID = request.pathParams.fldID;
  let uriAlbum = request.pathParams.album;
  let uriImage = request.pathParams.image;

  // console.info('INFO: ROUTE getImage:', uriAlbum, '\t', uriImage);

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

  // console.debug('DEBUG getImage params Prefix: ', params.Prefix)

  const result = await getKey(params, uriPath)
    .then(copyKey);

  let uriNewPath = 'https://' + S3BUCKET + '/' + result;
  // console.debug('DEBUG: final redirect:', uriNewPath)
  return uriNewPath;

}, {
  success: 301
});
// ******************************************************************
// ╔═╗╦ ╦╔═╗  ╔╦╗┬ ┬┌┐┌┌─┐┌┬┐┌─┐╔╦╗╔╗   ╔═╗╔═╗╔╦╗  ╔═╗╔═╗╔═╗
// ╠═╣║║║╚═╗   ║║└┬┘│││├─┤││││ │ ║║╠╩╗  ║ ╦║╣  ║   ║ ╦╠═╝╚═╗
// ╩ ╩╚╩╝╚═╝  ═╩╝ ┴ ┘└┘┴ ┴┴ ┴└─┘═╩╝╚═╝  ╚═╝╚═╝ ╩   ╚═╝╩  ╚═╝
// Docs:
//    https://docs.aws.amazon.com/sdk-for-javascript/v2/developer-guide/dynamodb-example-document-client.html
//    https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html#getObjectTagging-property
//    https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html#putObjectTagging-property
// ******************************************************************
api.get('/getPhotoTags/{fldID}/{album}/{image}', async function(request) {

  let uriFldID = request.pathParams.fldID;
  let uriAlbum = request.pathParams.album;
  let uriImage = request.pathParams.image;

  if (!uriAlbum) {
    uriAlbum = 'skiCycleRun';
  };

  if (!uriImage) {
    uriImage = '00000.jpg';
  }

  let pKey = uriFldID + '/' + uriAlbum + '/' + uriImage;

  console.debug('DEBUG: sanity check: ', pKey);

  // get tags from image:
  var params = {
    Bucket: S3BUCKET,
    Key: pKey
  };

  try {

    let pTags = await S3.getObjectTagging(params).promise();
    // console.debug('DEBUG: getPhotoTags results: ', pTags)
    //let pTags = await response.json();

    //console.log(pTags.TagSet);
    let pObj = {};
    for (let i = 0; i < pTags.TagSet.length; i++) {
      let newKey = pTags.TagSet[i].Key;
      pObj[newKey] = pTags.TagSet[i].Value;
    }

    console.log('DEBUG: getPhotoTags - tag obj: ', pObj)
    return pObj

  } catch (err) {

    console.error('ERROR: getPhotoTags --> ', err);
    return getDefaultLocObj();

  };

});

api.get('/getDBMeta/{fldID}/{album}/{image}', async function(request) {

  let table = "Photos";

  var uriAlbum = request.pathParams.album;
  var uriImage = request.pathParams.image;
  var uriPath = uriAlbum + '/' + uriImage;

  var params = {
    TableName: table,
    Key: {
      "album": uriAlbum,
      "pKey": pKey
    }
  };

  let pData = null;
  try {

    let pData = docClient.get(params).promise();

  } catch (err) {

    console.error('ERROR: getDBMeta --> ', err);

  }

  return pData

});

api.get('/verifyPath/{album}/{image}', function(request) {

  var uriAlbum = request.pathParams.album;
  var uriImage = request.pathParams.image;
  var uriPath = uriAlbum + '/' + uriImage;

  let newPath = 'https://' + S3BUCKET + '/pub/' + uriPath;
  // console.debug('DEBUG: verifyPath 301 = ', newPath);

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

  // console.debug('DEBUG: copyKey input: ', keyIn, ' path: ', uriPath);
  try {

    let srcKey = S3BUCKET + '/' + keyIn
    let outKey = S3PUBLIC + '/' + uriPath;
    // console.debug('DEBUG S3 COPY: ', srcKey, ' to ', outKey);

    var cpParams = {
      Bucket: S3BUCKET,
      CopySource: srcKey,
      Key: outKey
    };

    // s3.copyObject(cpParams, function(err, data) {
    //       if (err) {
    //         console.error(err, err.stack);
    //         return 'err/skicyclerun_error.jpg';
    //       } // an error occurred
    //       else {
    //         console.info(data);
    //         return outKey;
    //       } // successful response
    let data = await S3.copyObject(cpParams).promise();
    // console.debug('DEBUG: S3.copyObject: ', data);
    if (data.ETag) {
      return outKey;
    } else {
      console.error('ERROR DeadPool: copyObject: ', data);
      return 'err/skicyclerun_error.jpg';
    }

  } catch (err) {
    console.error('ERROR copyKey (try/catch): ', err)
    return 'err/skicyclerun_error.jpg';

  }
};

api.addPostDeployConfig('tableName', 'DynamoDB Table Name:', 'configure-db');


function getDefaultLocObj() {

  let pObj = {
    Copyright: 'skicyclerun.com',
    GPSLatitude: '47.511893',
    GPSLongitude: '-121.990184',
    photoAlbum: 'skiCycleRun',
    timeZone: 'America/Los_Angeles',
    DTepoch: '0000000000',
    pKey: 'skiCycleRunUnknown1',
    photoName: 'Unknown1'
  }

  return pObj;
}
