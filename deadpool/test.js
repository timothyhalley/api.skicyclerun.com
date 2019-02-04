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

async function copyKey(params) {

  let keyIn = params[0];
  let newImg = params[1];

  aPath = keyIn.split('/');
  let newURI = S3PUBLIC + '/' + aPath[1] + '/' + newImg;

  console.log()

  console.log('SHAZAMMM IT: ', keyIn, '\t', newURI)

  try {

    var cpParams = {
      Bucket: S3BUCKET,
      CopySource: S3BUCKET + '/' + keyIn,
      Key: newURI
    };

    let data = await S3.copyObject(cpParams).promise();

    if (data.ETag) {
      return newURI
    } else {
      return 'err/skicyclerun_error.jpg'
    }

    return data;

  } catch (err) {

    return err

  }
}

async function getKey(params, newURI) {

  try {

    let allKeys = [];

    let data = await S3.listObjectsV2(params).promise();

    for (let content of data.Contents) {
      allKeys.push(content.Key);
    };

    let kVal = allKeys[Math.floor(Math.random() * data.KeyCount)]; // URI path to image source
    console.log('this is the key: ', kVal)
    return [kVal, newURI];

  } catch (e) {

    return 'err/skicyclerun_error.jpg';

  }
}

async function start(params, newURI) {

    try {

        const result = await getKey(params, newURI)
          .then(copyKey)

        // console.log('AWS S3 new URL Value = : ', result)
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
    let newURI = getRandomInt(90000, 10000) + '.jpg'
    let pubURL = await start(params, newURI); // copy one random image from S3::albums into S::pub
    console.log('Fini! Copy random image --> ', pubURL) // should be last thing said :)

    // await getPhotoInfo(params, pubURL)

  } catch (e) {
    console.error('ERROR: ', e);
  }

})();
// ***********************************************************************
function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min)) + min; //The maximum is exclusive and the minimum is inclusive
}
