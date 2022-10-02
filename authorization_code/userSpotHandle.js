// class Spots {
//     constructor(height, width) {
//       this.area = height * width;
//     }
//   }

// class Spots {
//     getName() {
//       return 'stackoverflow';
//     }
//  }

const axios = require('axios');
var FormData = require('form-data');

// axios
//   .get('https://example.com/todos')
//   .then(res => {
//     console.log(`statusCode: ${res.status}`);
//     console.log(res);
//   })
//   .catch(error => {
//     console.error(error);
//   });

var topArtistsURI = [];
var topArtistNames = [];
var topSongsURI = [];
var topSongsNames = [];

var artistsPop = [];
var songsPop = [];
var songsId = '';

var dance = 0;
var energy = 0;
var loudness = 0;
var tempo = 0;
var valence = 0;
var acousticness = 0;

function reset()
{
  topArtistsURI = [];
  topArtistNames = [];
  topSongsURI = [];
  topSongsNames = [];

  artistsPop = [];
  songsPop = [];
  songsId = '';

  dance = 0;
  energy = 0;
  loudness = 0;
  tempo = 0;
  valence = 0;
  acousticness = 0;
}

function callSpotifyTopArtists(accToken, res1)
{
  reset();
    axios
    .get('https://api.spotify.com/v1/me/top/artists?time_range=long_term&limit=50', {
        headers: {
        'Content-type': 'application/json',
        'Authorization': 'Bearer ' + accToken
        }
    }
    )
    .then(res => {
        console.log(`statusCode: ${res.status}`);
        console.log(res.data);

        if(parseInt(res.status) == 401)
        {
          res.write("Time Out...");
          res.end();
          return;
        }

        // var data = JSON.parse(res);
        // console.log(data);
        response = res.data.items[1].name;

        for(let i = 0; i< 50; i++)
        {
          topArtistNames[i] = res.data.items[i].name;
          topArtistsURI[i] = res.data.items[i].id;
          artistsPop[i] = res.data.items[i].popularity;
        }

        callSpotifyTopSongs(accToken, res1);
    })
    .catch(error => {
        console.error(error);
        //return "error";
        res1.write("Time Out...");
        res1.end();
    });
}

function callSpotifyTopSongs(accToken, res1)
{
    axios
    .get('https://api.spotify.com/v1/me/top/tracks?time_range=long_term&limit=50', {
        headers: {
        'Content-type': 'application/json',
        'Authorization': 'Bearer ' + accToken
        }
    }
    )
    .then(res => {
        console.log(`statusCode: ${res.status}`);
        console.log(res.data);

        // var data = JSON.parse(res);
        // console.log(data);
        response = res.data.items[1].name;

        for(let i = 0; i< 50; i++)
        {
          topSongsNames[i] = res.data.items[i].name;
          topSongsURI[i] = res.data.items[i].id;
          songsPop[i] = res.data.items[i].popularity;
          songsId += res.data.items[i].id;
          if(i != 49)
          {
            songsId += ',';
          }
        }

        callSpotifySongAnalysis(accToken, res1);
    })
    .catch(error => {
        console.error(error);
        //return "error";
    });
}

function callSpotifySongAnalysis(accToken, res1)
{
    axios
    .get('https://api.spotify.com/v1/audio-features?ids=' + songsId, {
        headers: {
        'Content-type': 'application/json',
        'Authorization': 'Bearer ' + accToken
        }
    }
    )
    .then(res => {
        console.log(`statusCode: ${res.status}`);
        console.log(res.data);

        // var data = JSON.parse(res);
        // console.log(data);
        //response = res.data.audio_features[1].name;

        for(let i = 0; i< 50; i++)
        {
          console.log(i);
          dance += res.data.audio_features[i].danceability;
          energy += res.data.audio_features[i].energy;
          loudness += res.data.audio_features[i].loudness;
          tempo += res.data.audio_features[i].tempo;
          valence += res.data.audio_features[i].valence;
          acousticness += res.data.audio_features[i].acousticness;
        }

        dance = (dance/50) * 100
        energy = (energy/50) * 100
        loudness = (loudness/50) * 100
        tempo = tempo/50
        valence = (valence/50) * 100
        acousticness = (acousticness/50) * 100

        finalStr = "pop:" + popScore() + "dance:" + dance + "  energy: " + energy + "  loudness: " + loudness + "  tempo: " + tempo + "  valence: " + valence + "  acousticness: " + acousticness;
        //need to format this to match the format expected by the frontend JS.
        console.log("                   " + finalStr);
        finalStr = popScore().toPrecision(3) + "::" + dance.toPrecision(3) + "::" + energy.toPrecision(3) + "::" + valence.toPrecision(3) + "::" + acousticness.toPrecision(3) + "::" + tempo.toPrecision(3) + ",," + getLists(topArtistNames) + ",," + getLists(topSongsNames) + ",," + getLists(topSongsURI);
        console.log("                   " + finalStr);
        res1.write(finalStr);
        res1.end();
    })
    .catch(error => {
        console.error(error);
        //return "error";
    });
}

function getLists(list)
{
  var ret = "";
  for(let i = 0; i < list.length; i++)
  {
    ret += list[i];
    if(i != (list.length - 1))
    {
      ret += ";;";
    }
  }
  return ret;
}

function popScore()
{
  var sum = 0;
  for(let i = 0; i<50; i++)
  {
    //sum += songsPop[i];
    sum += artistsPop[i];
  }
  return (sum/50);
}

var allSongs;
function makePlaylist(accToken, res1, songs, userID)
{
  reset();
  allSongs = songs.split(';;');
  var today = new Date();
  var date = today.getFullYear()+"-"+(today.getMonth()+1)+"-"+today.getDate();
  axios
  .post('https://api.spotify.com/v1/users/'+userID+'/playlists', {"name": "All Time Favorites", "description": "Your all time favorite songs from Stats Galore on " + date, "public": false}, {
      headers: {
      'Content-type': 'application/json',
      'Authorization': 'Bearer ' + accToken
      }
  }
  )
  .then(res => {
      console.log(`statusCode: ${res.status}`);
      console.log(res.data);

      if(parseInt(res.status) == 401)
      {
        res.write("Time Out...");
        res.end();
        return;
      }

      addPlaylist(accToken, res1, res.data.id);
  })
  .catch(error => {
      console.error(error);
      //return "error";
      res1.write("Time Out...");
      res1.end();
  });
}

function addPlaylist(accToken, res1, playID)
{
  var uris = '';
  for(let i = 0; i < 26; i++)
  {
    uris += 'spotify%3Atrack%3A' + allSongs[i] + '';
    if( i != 25 )
    {
      uris += '%2C';
    }
  }


  console.log(uris);
  console.log(playID);
  axios
    .post('https://api.spotify.com/v1/playlists/'+playID+'/tracks?uris='+uris, {},{
      headers: {
      'Content-type': 'application/json',
      'Authorization': 'Bearer ' + accToken
      }
  }
  )
  .then(res => {
      console.log(`statusCode: ${res.status}`);
      console.log(res.data);

      addPlaylist2(accToken, res1, playID);
  })
  .catch(error => {
      console.error(error);
      //return "error";
  });
}

function addPlaylist2(accToken, res1, playID)
{
  var uris = '';
  for(let i = 26; i < 50; i++)
  {
    uris += 'spotify%3Atrack%3A' + allSongs[i] + '';
    if( i != 49 )
    {
      uris += '%2C';
    }
  }


  console.log(uris);
  console.log(playID);
  axios
    .post('https://api.spotify.com/v1/playlists/'+playID+'/tracks?uris='+uris, {},{
      headers: {
      'Content-type': 'application/json',
      'Authorization': 'Bearer ' + accToken
      }
  }
  )
  .then(res => {
      console.log(`statusCode: ${res.status}`);
      console.log(res.data);

      res1.write("Playlist successful");
      res1.end();
  })
  .catch(error => {
      console.error(error);
      //return "error";
  });
}

module.exports = {callSpotifyTopArtists, makePlaylist};