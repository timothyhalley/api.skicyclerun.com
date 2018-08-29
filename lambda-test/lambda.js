exports.handler = function (event, context) {
  console.log(event);
	context.succeed('Die die die you function you! ' + event.name);
};
