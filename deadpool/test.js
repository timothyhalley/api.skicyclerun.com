let AWS = require('aws-sdk');
let lambda = new AWS.Lambda({
  region: 'us-west-2'
});
var S3 = new AWS.S3({
  apiVersion: '2006-03-01',
  region: 'us-west-2'
});

let data;
const S3BUCKET = 'img.skicyclerun.com';
const subFolder = 'albums';
const pubFolder = 'pub';

// ***********************************************************************
function getETag(cpData) {

  var etag = cpData.ETag;
  return etag;

};

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

var getS3ImageKeys = async (params) => {

  try {

    data = await S3.listObjectsV2(params).promise();

  } catch (err) {

    console.log(err);
    return err;

  }
  //console.log('result of getS3ImageKeys  = ', data)
  return data;
};

var getOneS3Key = async (data) => {

  try {

    data = getOneKey(data);

  } catch (err) {

    console.log(err);
    return err;

  }

  //console.log('result of getOneS3Key  = ', data)
  return data;
};

var copyS3Image = async (cpKey) => {

  try {

    var cpParams = {
      Bucket: S3BUCKET,
      CopySource: S3BUCKET + '/' + cpKey,
      Key: cpKey.replace(subFolder, 'pub')
    };

    var data = await S3.copyObject(cpParams).promise();

  } catch (err) {

    console.log(err);
    return err;

  }

  return data;
};

async function chainPromises(params){
    try {
        const result = await getS3ImageKeys(params)
          .then(getOneS3Key)
          .then(copyS3Image);
        var etag = getETag(result);
        console.log('chainPromises Fini: ', etag)
        return result;
    }
    catch(error){
        // Handle error
    }
}

var params = {
  Bucket: S3BUCKET,
  Prefix: subFolder,
  MaxKeys: 55
};

chainPromises(params);
// ***********************************************************************
