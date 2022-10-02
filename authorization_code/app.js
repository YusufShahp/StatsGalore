/**
 * This is an example of a basic node.js script that performs
 * the Authorization Code oAuth2 flow to authenticate against
 * the Spotify Accounts.
 *
 * For more information, read
 * https://developer.spotify.com/web-api/authorization-guide/#authorization_code_flow
 */

var express = require('express'); // Express web server framework
var request = require('request'); // "Request" library
var cors = require('cors');
var querystring = require('querystring');
var cookieParser = require('cookie-parser');
var http = require('http');
var fs = require('fs');
var Spot = require(__dirname + '/userSpotHandle.js'); 
var aSpot = require(__dirname + '/artistSpotHandle.js'); 

var client_id = '8bed2233fa934953a4f7dbc19f3cdfda'; // Your client id
var client_secret = '4aef0143a1544932907d1f09a6723efd'; // Your secret
var redirect_uri = 'http://statsgaloreapp.azurewebsites.net/callback'; // Your redirect uri
//var redirect_uri = 'http://localhost:8080/callback';

/**
 * Generates a random string containing numbers and letters
 * @param  {number} length The length of the string
 * @return {string} The generated string
 */
var generateRandomString = function(length) {
  var text = '';
  var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  for (var i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
};

var stateKey = 'spotify_auth_state';

var app = express();

app.use(express.static(__dirname + '/public'))
   .use(cors())
   .use(cookieParser());

app.get('/login', function(req, res) {

  var state = generateRandomString(16);
  res.cookie(stateKey, state);

  // your application requests authorization
  var scope = 'user-read-private user-read-email user-top-read playlist-modify-public playlist-modify-private';
  res.redirect('https://accounts.spotify.com/authorize?' +
    querystring.stringify({
      response_type: 'code',
      client_id: client_id,
      scope: scope,
      redirect_uri: redirect_uri,
      state: state
    }));
});

app.get('/callback', function(req, res) {

  // your application requests refresh and access tokens
  // after checking the state parameter

  var code = req.query.code || null;
  var state = req.query.state || null;
  var storedState = req.cookies ? req.cookies[stateKey] : null;

  if (state === null || state !== storedState) {
    res.redirect('/#' +
      querystring.stringify({
        error: 'state_mismatch'
      }));
  } else {
    res.clearCookie(stateKey);
    var authOptions = {
      url: 'https://accounts.spotify.com/api/token',
      form: {
        code: code,
        redirect_uri: redirect_uri,
        grant_type: 'authorization_code'
      },
      headers: {
        'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64'))
      },
      json: true
    };

    request.post(authOptions, function(error, response, body) {
      if (!error && response.statusCode === 200) {

        var access_token = body.access_token,
            refresh_token = body.refresh_token;

        var options = {
          url: 'https://api.spotify.com/v1/me',
          headers: { 'Authorization': 'Bearer ' + access_token },
          json: true
        };

        // use the access token to access the Spotify Web API
        request.get(options, function(error, response, body) {
          console.log(body);
        });

        // we can also pass the token to the browser to make requests from there
        res.redirect('/#' +
          querystring.stringify({
            access_token: access_token,
            refresh_token: refresh_token
          }));
      } else {
        res.redirect('/#' +
          querystring.stringify({
            error: 'invalid_token'
          }));
      }
    });
  }
});

app.get('/refresh_token', function(req, res) {

  // requesting access token from refresh token
  var refresh_token = req.query.refresh_token;
  var authOptions = {
    url: 'https://accounts.spotify.com/api/token',
    headers: { 'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64')) },
    form: {
      grant_type: 'refresh_token',
      refresh_token: refresh_token
    },
    json: true
  };

  request.post(authOptions, function(error, response, body) {
    if (!error && response.statusCode === 200) {
      var access_token = body.access_token;
      res.send({
        'access_token': access_token
      });
    }
  });
});

app.get('/user_home', function(req, res) {
  console.log(req.url + " " + req.query.AccToken);
  res.writeHead(200, {'Content-Type':'text/html'});
  var myReadStream = fs.createReadStream(__dirname + '/public/test.html', 'utf8');
  myReadStream.pipe(res);
});

app.get('/artist_home', function(req, res) {
  console.log(req.url + " " + req.query.AccToken);
  res.writeHead(200, {'Content-Type':'text/html'});
  var myReadStream = fs.createReadStream(__dirname + '/public/artistPage.html', 'utf8');
  myReadStream.pipe(res);
});

app.get('/time_out', function(req, res) {
  
  res.writeHead(200, {'Content-Type':'text/html'});
  var myReadStream = fs.createReadStream(__dirname + '/public/timePage.html', 'utf8');
  myReadStream.pipe(res);
});

 app.get('/inner_user_home', function(req, res) {
  // console.log(req.url + " " + req.query.Param);
  // res.writeHead(200, {'Content-Type':'text/html;'});
  // var myReadStream = fs.createReadStream(req.query.Param + " Hi", 'utf8');//fs.createReadStream(__dirname + '/public/test.html', 'utf8');
  // myReadStream.pipe(res);
  res.writeHead(200,{'Content-Type':'text/plain'});
  // var spo = new Spot.Spots();

  Spot.callSpotifyTopArtists(req.query.AccToken, res);
  //aSpot.callSpotifyArtist('3TVXtAsR1Inumwj472S9r4', req.query.Param, res)
  //Spot.makePlaylist(req.query.AccToken, res, "4ZPdLEztrlZqbJkgHNw54L;7387VaiHpOsSIZ5nmjseya;5TRPicyLGbAF2LGBFbHGvO", 'kmaiytvgfp8yyt598i13fuf37')

  // console.log("                   " + response);
  // res.write(response);
  // res.end();
});

app.get('/playlist_user_home', function(req, res) {
  
  res.writeHead(200,{'Content-Type':'text/plain'});

  Spot.makePlaylist(req.query.AccToken, res, req.query.SongList, req.query.Username);

  // console.log("                   " + response);
  // res.write(response);
  // res.end();
});

app.get('/inner_artist_home_search', function(req, res) {
  
  res.writeHead(200,{'Content-Type':'text/plain'});

  aSpot.callSpotifySearch(req.query.Name, req.query.AccToken, res)

  // console.log("                   " + response);
  // res.write(response);
  // res.end();
});

app.get('/inner_artist_home_stats', function(req, res) {
  
  res.writeHead(200,{'Content-Type':'text/plain'});

  aSpot.callSpotifyArtist(req.query.ID, req.query.AccToken, res)

  // console.log("                   " + response);
  // res.write(response);
  // res.end();
});

// function testTest(x)
// {
//     return x + 7;
// }

console.log('Listening on 8080 new code 4');
app.listen(8080);
