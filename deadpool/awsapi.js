/*global require, module*/
// Documentation:
// AWS S3 API --> https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html
const S3BUCKET = 'img.skicyclerun.com';
const S3ALBUMS = 'albums';
const S3PUBLIC = 'pub';
const S3PRIVATE = 'private';
const S3MAXKEYS = 100;

var ApiBuilder = require('claudia-api-builder');
var api = new ApiBuilder();
var AWS = require('aws-sdk');
var S3 = new AWS.S3({
  apiVersion: '2006-03-01',
  region: 'us-west-2'
});

module.exports = api;

//
// XPromise test - clasic ES2017
function s3KeyLists(params) {

  return new Promise(function(resolve, reject) {

    var s3 = new AWS.S3({
      apiVersion: '2006-03-01',
      region: 'us-west-2'
    });

    s3.listObjectsV2(params, function(err, data) {

      if (err) {
        console.log(err, err.stack);
        return reject(err.stack);
      } else {
        console.log(data);
        return resolve(data);
      }

    });
  });
}

function getOneKey(data) {

  var allKeys = [];
  var keyLength = data.KeyCount;
  var contents = data.Contents;

  for (let item of contents) {
    allKeys.push(item.Key);
  }

  var key = allKeys[Math.floor(Math.random() * keyLength)];

  return key;
}

var getOneS3Key = async (data) => {

  try {

    return await getOneKey(data);

  } catch (err) {

    console.error(err)
    return err;

  }

};

var eTagtoURL = async (cpResults) => {

  try {

    var etag = cpResults.eTag;
    var url = null;

    if (etag) {
      url = 'https://' + cpResults.Bucket + '/' + cpResults.imgVal;
    } else {
      url = 'https://' + cpResults.Bucket + '/err/skicyclerun_error.jpg';
    }

    return url;

  } catch (err) {

    console.log(err);
    return err;

  }

};

function getETag(cpData) {

  var etag = cpData.ETag;
  return etag;

};

var copyS3Image = async (cpKey) => {

  try {

    var cpParams = {
      Bucket: S3BUCKET,
      CopySource: S3BUCKET + '/' + cpKey,
      Key: cpKey.replace('albums', 'pub')
    };

    var data = await S3.copyObject(cpParams).promise();
    return data;

  } catch (err) {

    console.log(err);
    return err;

  }

};

var getS3ImageKeys = async (params) => {

  try {

    data = await S3.listObjectsV2(params).promise();

  } catch (err) {

    console.log(err);
    return err;

  }

  return data;
};

function s3Images(params) {

  return new Promise(function(resolve, reject) {

    var s3 = new AWS.S3({
      apiVersion: '2006-03-01',
      region: 'us-west-2'
    });

    s3.listObjectsV2(params, function cb(err, data) {
      if (err) {
        reject(err);
      }
      var allKeys = [];
      var contents = data.Contents;
      contents.forEach(function(content) {
        allKeys.push(content.Key);
      });
      var keyLength = data.KeyCount;
      var imageURL = 'https://img.skicyclerun.com/' + allKeys[Math.floor(Math.random() * keyLength)];

      resolve(imageURL);

    });
  });
}

function copyRandomImage(params) {
  return new Promise(function(resolve, reject) {
    resolve(getS3ImageKeys(params)
      .then(getOneS3Key)
      .then(copyS3Image));
  })
};

async function getKey(params) {

  try {

    let allKeys = [];

    let data = await S3.listObjectsV2(params).promise();

    for (let content of data.Contents) {
      allKeys.push(content.Key);
    };

    return allKeys[Math.floor(Math.random() * data.KeyCount)]; // URI path to image source

  } catch (e) {

    return 'err/skicyclerun_error.jpg';

  }
}

async function copyKey(keyIn) {

  try {

    let newImgPath = keyIn.replace(S3ALBUMS, S3PUBLIC);
    console.log('THIS IS THE NEW IMG PATH: ', newImgPath);

    var cpParams = {
      Bucket: S3BUCKET,
      CopySource: S3BUCKET + '/' + keyIn,
      Key: newImgPath
    };

    let data = await S3.copyObject(cpParams).promise();

    if (data.ETag) {
      return newImgPath;
    } else {
      return 'err/skicyclerun_error.jpg';
    }

  } catch (err) {

    return 'err/skicyclerun_error.jpg';

  }
}
// ******************************************************************
// API Gateway routes
// ******************************************************************
//api.get('/randomimg/{album}', async function(request) {
api.get('/getImage/{album}/{image}', async function(request) {

  'use strict';
  // length of urlKey and ext is good then pass otherwise default
  let uriAlbum = request.pathParams.album;
  let uriImage = request.pathParams.image;

  if (!uriAlbum) {
    uriAlbum = 'SkiCycleRun';
  };

  if (!uriImage) {
    uriImage = '000000.jpg';
  }

  var params = {
    Bucket: S3BUCKET,
    Prefix: S3ALBUMS + '/' + uriAlbum,
    MaxKeys: S3MAXKEYS
  };

  const result = await getKey(params)
    .then(copyKey);

  return 'https://' + S3BUCKET + '/' + result;

}, {
  success: 301
});

// api.get('/getImageAAA/{urlAlb}/{urlImg}', async function(request) {
//
//   'use strict';
//
//   // TODO - set folder in album to ramdomize!
//
//   var params = {
//     Bucket: S3BUCKET,
//     Prefix: S3ALBUMS,
//     MaxKeys: S3MAXKEYS
//   };
//
//   // length of urlKey and ext is good then pass otherwise default
//   var urlAlb = request.pathParams.urlAlb;
//   var urlImg = request.pathParams.urlImg;
//   var imgFmt = urlKey.match(/(\d+).jpg/gi);
//
//   const result = await getKey(params)
//     .then(copyKey)
//
//   let newImageURL = 'https://' + params.Bucket + '/' + result;
//   return newImageURL;
//
// }, {
//   success: 301
// });

// api.get('/getImageX/{urlAlb}/{urlImg}', function(request) {
//
//   'use strict';
//
//   var params = {
//     Bucket: S3BUCKET,
//     Prefix: S3ALBUMS,
//     S3MAXKEYS: S3MAXKEYS
//   };
//
//   // length of urlKey and ext is good then pass otherwise default
//   var urlAlb = request.pathParams.urlAlb;
//   var urlImg = request.pathParams.urlImg;
//   var imgFmt = urlKey.match(/(\d+).jpg/gi);
//
//   const result = await getKey(params)
//   return S3.listObjectsV2(params).promise()
//     .then(getKey)
//     .then(cpKey => S3.copyObject({
//       Bucket: S3BUCKET,
//       CopySource: S3BUCKET + '/' + cpKey,
//       Key: keyVal
//     }).promise())
//     .then(cpData => eTagtoURL({
//       Bucket: S3BUCKET,
//       imgVal: keyVal,
//       eTag: cpData
//     }))
//
// }, {
//   success: 301
// });

api.get('/getImageV2/{urlAlbumName}/{urlImgRndNo}', function(request) {

  'use strict';

  // length of urlKey and ext is good then pass otherwise default
  var urlAlbumName = request.pathParams.urlAlbumName;
  var urlImgRndNo = request.pathParams.urlImgRndNo;
  var urlImage_is_Number = urlImgRndNo.match(/(\d+).jpg/gi);
  if (urlImage_is_Number) {
    var params = {
      Bucket: S3BUCKET,
      Prefix: S3ALBUMS,
      S3MAXKEYS: S3MAXKEYS
    };
    //Test Promise with Function return -- works!
    return S3.listObjectsV2(params).promise()
      .then(getOneS3Key)
      .then(cpKey => S3.copyObject({
        Bucket: params.Bucket,
        CopySource: params.Bucket + '/' + cpKey,
        Key: keyVal
      }).promise())
      .then(cpData => eTagtoURL({
        Bucket: S3BUCKET,
        imgVal: keyVal,
        eTag: cpData
      }))
  } else {
    return urlImage = 'err/skicyclerun_error.jpg';
  };

}, {
  success: 301
});

api.get('/verifyPath/{urlKey}', function(request) {

  var urlKey = request.pathParams.urlKey;
  var urlImage = urlKey.match(/(\d+).jpg/gi);

  if (urlImage) {
    var url = 'https://img.skicyclerun.com/pub/' + urlKey;
  } else {
    var url = 'https://img.skicyclerun.com/pub/SantaCatalinaIsland.jpg';
  }

  return url;

}, {
  success: 301
});
