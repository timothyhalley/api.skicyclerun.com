/* global require, module */
var ApiBuilder = require('claudia-api-builder');
var api = new ApiBuilder();
var AWS = require('aws-sdk');
var s3 = new AWS.S3({
  apiVersion: '2006-03-01',
  region: 'us-west-2'
});

module.exports = api;

api.get('/imgList', function(request) {

  // 'use strict';
  // s3.listObjects({
  //   Bucket: 'skicyclerun.img',
  //   MaxKeys: 2
  // }).on('success', function handlePage(response) {
  //   // do something with response.data
  //   console.log("got data? := ", response.getMetaData)
  //   if (response.hasNextPage()) {
  //     response.nextPage().on('success', handlePage).send();
  //   }
  // }).send();

  var getS3List = s3.listObjects(params).promise();
  var params = {
    Bucket: 'skicyclerun.img',
    MaxKeys: 2
  };

  getS3List.then(function(data) {
    console.log('Success');
  }).catch(function(err) {
    console.log('Failed again!')
  });

});
