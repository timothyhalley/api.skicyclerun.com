const S3BUCKET = 'img.skicyclerun.com';
const S3ALBUMS = 'albums';
const S3PUBLIC = 'pub';
const S3PRIVATE = 'private';
const S3MAXKEYS = 100;

let AWS = require('aws-sdk');
let lambda = new AWS.Lambda({
  region: 'us-west-2'
});
var S3 = new AWS.S3({
  apiVersion: '2006-03-01',
  region: 'us-west-2'
});

let data = null;


// ***********************************************************************
function getETag(cpData) {

  return cpData.ETag;

};

var copyS3Image = async (cpKey) => {

  try {

    var cpParams = {
      Bucket: S3BUCKET,
      CopySource: S3BUCKET + '/' + cpKey,
      Key: cpKey.replace(S3ALBUMS, S3PUBLIC)
    };

    var data = await S3.copyObject(cpParams).promise();

  } catch (err) {

    console.log(err);
    return err;

  }

  return data;
};

async function copyKey(keyIn) {

  try {

    var cpParams = {
      Bucket: S3BUCKET,
      CopySource: S3BUCKET + '/' + keyIn,
      Key: keyIn.replace(S3ALBUMS, S3PUBLIC)
    };

    let data = await S3.copyObject(cpParams).promise();

    if (data.ETag) {
      return keyIn.replace(S3ALBUMS, S3PUBLIC)
    } else {
      return 'err/skicyclerun_error.jpg'
    }

    return data;

  } catch (err) {

    return err

  }
}

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

async function start(params) {

    try {

        const result = await getKey(params)
          .then(copyKey)

        console.log('AWS S3 new URL Value = : ', result)
        return result;

    }

    catch(err){
        console.error('START ERROR: ', err)
    }
}

// ---------------------------------------------------
var params = {
  Bucket: S3BUCKET,
  Prefix: S3ALBUMS,
  MaxKeys: S3MAXKEYS
};

(async () => {
  try {

    console.log('Allez!')
    await start(params);
    console.log('Fini!!!') // should be last thing said :)

  } catch (e) {
    console.error('ERROR: ', e);
  }

})();
// ***********************************************************************
