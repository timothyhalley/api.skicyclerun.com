/*global require, module*/
var ApiBuilder = require('claudia-api-builder');
var api = new ApiBuilder();
var AWS = require('aws-sdk');
var S3 = new AWS.S3({
  apiVersion: '2006-03-01',
  region: 'us-west-2'
});

const S3BUCKET = 'img.skicyclerun.com';
const subFolder = 'BlackWhite';
const pubFolder = 'pub';

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
  var contents = data.Contents;
  contents.forEach(function(content) {
    allKeys.push(content.Key);
  });
  var keyLength = data.KeyCount;
  var key = allKeys[Math.floor(Math.random() * keyLength)];

  return key;
}

var getOneS3Key = async (data) => {

  try {

    //console.log('getOneS3Key data keys = ', data)
    //data = await getOneKey(data).promise();
    data = getOneKey(data);

  } catch (err) {

    console.log(err);
    return err;

  }
  console.log('URL key source is...  = ', data)
  return data;
};

var eTagtoURL = async (cpResults) => {

  try {

    //console.log('getOneS3Key data keys = ', data)
    //data = await getOneKey(data).promise();
    var etag = cpResults.eTag;
    var url = null;
    if (etag) {
      url = 'https://' + cpResults.Bucket + '/' + cpResults.imgVal;
    } else {
      url = 'https://img.skicyclerun.com/pub/SantaCatalinaIsland.jpg';
    }

  } catch (err) {

    console.log(err);
    return err;

  }
  console.log('URL key source is...  = ', url)
  return url;
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
      Key: cpKey.replace('BlackWhite', 'pub')
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

    console.log('sixthElement params = ', params)


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

// ******************************************************************
// API Gateway routes
// ******************************************************************
api.get('/', function(request) {

  'use strict';

  return 'https://img.skicyclerun.com/pub/SantaCatalinaIsland.jpg';

}, {
  success: 301
});

api.get('/default/{urlFolder}/{urlKey}', function(request) {

  'use strict';

  return 'https://img.skicyclerun.com/pub/SantaCatalinaIsland.jpg';

}, {
  success: 301
});

api.get('/testCopy/{urlKey}', function(request) {
  'use strict';

  var params = {
    Bucket: 'img.skicyclerun.com',
    Prefix: 'BlackWhite',
    MaxKeys: 50
  };

  var CopyObjectResult = copyRandomImage(params);
  return getETag(CopyObjectResult);

});

api.get('/getImage/{urlFld}/{urlKey}', function(request) {

  'use strict';

  var params = {
    Bucket: 'img.skicyclerun.com',
    Prefix: 'albums',
    MaxKeys: 100
  };

  // length of urlKey and ext is good then pass otherwise default
  var urlFld = request.pathParams.urlFld;
  var urlKey = request.pathParams.urlKey;
  var urlImage = urlKey.match(/(\d+).jpg/gi);
  var keyVal = urlFld + '/' + urlImage
  if (urlImage) {
    //Test Promise with Function return -- works!
    return S3.listObjectsV2({
        Bucket: S3BUCKET,
        Prefix: 'BlackWhite',
        MaxKeys: 50
      }).promise()
      .then(getOneS3Key)
      .then(cpKey => S3.copyObject({
        Bucket: S3BUCKET,
        CopySource: S3BUCKET + '/' + cpKey,
        Key: keyVal
      }).promise())
      .then(cpData => eTagtoURL({
        Bucket: S3BUCKET,
        imgVal: keyVal,
        eTag: cpData
      }))
  } else {
    return urlImage = 'SantaCatalinaIsland.jpg';
  };

}, {
  success: 301
});

api.get('/getImageV2/{urlAlbumName}/{urlImgRndNo}', function(request) {

  'use strict';

  // length of urlKey and ext is good then pass otherwise default
  var urlAlbumName = request.pathParams.urlAlbumName;
  var urlImgRndNo = request.pathParams.urlImgRndNo;
  var urlImage_is_Number = urlImgRndNo.match(/(\d+).jpg/gi);
  if (urlImage_is_Number) {
    var params = {
      Bucket: 'img.skicyclerun.com',
      Prefix: 'albums',
      MaxKeys: 100
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
    return urlImage = 'err/666.jpg';
  };

}, {
  success: 301
});

api.get('/verifyPath/{urlKey}', function(request) {

  var urlKey = request.pathParams.urlKey;
  var urlImage = urlKey.match(/(\d+).jpg/gi);

  if (urlImage) {
    var url = 'https://img.skicyclerun.com/pub/' + urlImage;
  } else {
    var url = 'https://img.skicyclerun.com/pub/SantaCatalinaIsland.jpg';
  }

  return url;

}, {
  success: 301
});

api.get('/getNewImage', function(request) {

  var params = {
    Bucket: S3BUCKET,
    Prefix: subFolder,
    MaxKeys: 55
  };

  return new Promise(function(resolve, reject) {
    resolve(getS3ImageKeys(params)
      .then(getOneS3Key)
      .then(copyS3Image));
  })

  // }, {
  //   success: 301
});

api.get('/bucket', function(request) {

  var params = {
    Bucket: S3BUCKET,
    Prefix: subFolder,
    MaxKeys: 55
  };

  return S3.listObjectsV2(params).promise();

});
