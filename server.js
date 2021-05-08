const http = require('http');
const PORT = 9000;
const data = [];

const clientResponse = (res, code, contentType, message) => {
  res.writeHead( code, { 'Content-Type': contentType });
  res.write(message);
  res.end();
};

const getData = (request, response, data) => {
  // body to save the data comming
  let body = '';
  request.on("data", function (chunk) {
    body += chunk;
  });
  request.on("end", () => {
    // object to save the data
    const newNumber = {
      ...JSON.parse(body),
    };
    // if data is not number, return a bad request error
    if(typeof newNumber.myNumber !== 'number') return badRequest(request, response);
    // otherwise, if there is not data saved, just push it
    if(data.length < 1) data.push(newNumber);
    // if there is a previous value on data array delete it and write the new one
    else{
      data.shift();
      data.push(newNumber);
    }
    // response data inserted
    clientResponse(response, 201, "application/json", JSON.stringify(data));
  });
};

const badRequest = (req, res) => {
  clientResponse(res, 400, 'text/html', '<h1>BAD REQUEST</h1>');
}

const notFound = (req, res) => {
  clientResponse(res, 404, 'text/html', '<h1>resource not found</h1>');
}

const reset = (req, res) => {
  if(req.method === 'DELETE'){
    if(data.length >= 1) data.shift();
    return clientResponse(res, 205, 'text/html', '<h1>Reset</h1>');
  }
  return notFound(req, res);
}

const home = (req, res) => {
  if(req.method === 'GET') return clientResponse(res, 200, 'text/html', '<h1>Home Page</h1>');
  return notFound(req, res);
}

const myNumb = (req, res) => {
  const { method, url } = req;
  // patch method to use multiplier
  if(method === 'PATCH'){
    // structure of /myNumber/{multiplier}
    const urlMultiplier = /^\/myNumber\/\d+$/;
    // check if url has the multiplier structure
    if (urlMultiplier.test(url)){
      // take the value to multiply
      const multiplier = Number(url.split('/')[2]);
      // if there is not data return bad request
      if(data.length <= 0) return badRequest(req, res);
      // otherwise save data in an object and multiplite myNumber and multiplier
      const multObject = {
        value: data[0].myNumber * multiplier
      };
      // return the multiplication object
      return clientResponse(res, 200, 'application/json', JSON.stringify(multObject));
    }
  }
  /*** if Post request call function call getData ***/
  if (method === 'POST') return getData(req, res, data);
  if (method === 'GET') {
    /*** return 404 error if data is empty ***/
    if(data.length < 1) return notFound(req, res);
    /*** otherwise return the value ***/
    return clientResponse(res, 200, 'application/json', JSON.stringify(data));
  }
  return notFound(req, res);
}

const route = (path) => {
  const routes = {
    '/': home,
    '/myNumber': myNumb,
    '/reset': reset,
  };

  if(routes[path]){
    return routes[path];
  }
  return notFound;
};

/***** URL *****/
function checkURL(path) {
  const url = path.split('?')[0].split('/')[1];
  return `/${url}`;
}

const server = http.createServer( (req, res) => {
  const { url } = req;
  const path = checkURL(url);
  const myRoute = route(path);
  return myRoute(req, res);
} );

server.listen( PORT, () => { console.log(`Listening at PORT: ${PORT}`); });
