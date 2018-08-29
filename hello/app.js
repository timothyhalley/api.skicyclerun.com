var ApiBuilder = require('claudia-api-builder');
var api = new ApiBuilder();

module.exports = api;

api.get('/greet', function(request) {
  var superb = require('superb');
  return request.queryString.name + ', At work today! --> ' + superb();
});
