const axios = require('axios');

var dance = 0;
var energy = 0;
var loudness = 0;
var tempo = 0;
var valence = 0;
var acousticness = 0;

var countcount = 0;
var albums = [];
var allSongs = new Map();
var counter = 0;
var finalSongs = [];

function reset()
{
    dance = 0;
    energy = 0;
    loudness = 0;
    tempo = 0;
    valence = 0;
    acousticness = 0;

    countcount = 0;
    albums = [];
    allSongs = new Map();
    counter = 0;
    finalSongs = [];
}

function callSpotifySearch(name, accToken, res1)
{
    reset();
    axios
    .get('https://api.spotify.com/v1/search?q=' + name + '&type=artist&market=US&limit=6', {
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

        var finalStr = '';

        if(parseInt(res.status) == 401)
        {
          res.write("Time Out...");
          res.end();
          return;
        }

        var len = Object.keys(res.data.artists.items).length;
        if(len == 0)
        {
            finalStr = "NoneNoneqwe"
        }
        else if(len > 0 && len < 7)
        {
            for(let i = 0; i< len; i++)
            {
                finalStr += res.data.artists.items[i].name;
                finalStr += '::';
                finalStr += res.data.artists.items[i].id;
                finalStr += '::';
                finalStr += res.data.artists.items[i].popularity;
                if(i != (len - 1))
                {
                    finalStr += ';;';
                }
            }
        }
        res1.write(finalStr);
        res1.end();
    })
    .catch(error => {
        console.error(error);
        //return "error";
        res1.write("Time Out...");
        res1.end();
    });
}

function callSpotifyArtist(ID, accToken, res1)
{
    reset();
    axios
    .get('https://api.spotify.com/v1/artists/'+ID+'/albums?include_groups=single&market=US&limit=50', {
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

        var num = Object.keys(res.data.items).length;
        for(let i = 0; i < num; i++)
        {
          var temp = res.data.items[i].id
          //albums[i] = temp;
          albums.push(temp);
        }

        callSpotifyArtist2(ID, accToken, res1);
    })
    .catch(error => {
        console.error(error);
        res1.write("Time Out...");
        res1.end();
        //return "error";
    });
}

function callSpotifyArtist2(ID, accToken, res1)
{
    axios
    .get('https://api.spotify.com/v1/artists/'+ID+'/albums?include_groups=album&market=US&limit=50', {
        headers: {
        'Content-type': 'application/json',
        'Authorization': 'Bearer ' + accToken
        }
    }
    )
    .then(res => {
        console.log(`statusCode: ${res.status}`);
        console.log(res.data);

        var num = Object.keys(res.data.items).length;
        //var albumNum = albums.length;
        for(let i = 0; i < num; i++)
        {
          var temp = res.data.items[i].id
          //albums[albums.length] = temp;
          albums.push(temp);
        }

        //console.log(albums);
        callSpotifyAlbums(accToken, res1)

        // res1.write("test");
        // res1.end();
    })
    .catch(error => {
        console.error(error);
        //return "error";
    });
}

function callSpotifyAlbums(accToken, res1)
{
    if(counter >= albums.length)
    {
        //go to nextstep
        ///var songSet = new Set(allSongs);
        finalSongs = Array.from(allSongs.values());
        console.log(finalSongs);
        console.log(albums.length);
        console.log(finalSongs.length);
        callSpotifyAnalysis(accToken, res1, 0);
    }
    else if((counter + 10) > albums.length)
    {
        var albStr = ''
        for(let i = counter; i < albums.length; i++)
        {
            albStr += albums[i];
            if((albums.length-1) != i)
            {
                albStr += '%2C';
            }
        }

        counter += 10

        axios
        .get('https://api.spotify.com/v1/albums?ids=' + albStr, {
            headers: {
            'Content-type': 'application/json',
            'Authorization': 'Bearer ' + accToken
            }
        }
        )
        .then(res => {
            console.log(`statusCode: ${res.status}`);
            console.log(res.data);
    
            var num = Object.keys(res.data.albums).length;
            
            for(let i = 0; i < num; i++)
            {
              var end = Object.keys(res.data.albums[i].tracks.items).length
              for(let j = 0; j < end; j++)
              {
                allSongs.set(res.data.albums[i].tracks.items[j].name, res.data.albums[i].tracks.items[j].id);
              }
            }
    
            callSpotifyAlbums(accToken, res1);
        })
        .catch(error => {
            console.error(error);
            //return "error";
        });
    }
    else if((counter + 10) <= albums.length)
    {
        var albStr = ''
        var endVal = counter + 10;
        for(let i = counter; i < endVal; i++)
        {
            albStr += albums[i];
            if((endVal-1) != i)
            {
                albStr += '%2C';
            }
        }
        counter += 10;

        axios
        .get('https://api.spotify.com/v1/albums?ids=' + albStr, {
            headers: {
            'Content-type': 'application/json',
            'Authorization': 'Bearer ' + accToken
            }
        }
        )
        .then(res => {
            console.log(`statusCode: ${res.status}`);
            console.log(res.data);
    
            var num = Object.keys(res.data.albums).length;
            
            for(let i = 0; i < num; i++)
            {
              var end = Object.keys(res.data.albums[i].tracks.items).length
              for(let j = 0; j < end; j++)
              {
                allSongs.set(res.data.albums[i].tracks.items[j].name, res.data.albums[i].tracks.items[j].id);
              }
            }
    
            callSpotifyAlbums(accToken, res1);
        })
        .catch(error => {
            console.error(error);
            //return "error";
        });
    }

    function callSpotifyAnalysis(accToken, res1, ounter)
    {
        console.log("stop here");

        console.log(ounter);
        console.log(finalSongs.length);
        if(ounter >=finalSongs.length)
        {
            console.log("stop here 1");
            //go to nextstep
            console.log(""+countcount);
            finalize(accToken, res1);
        }
        else if((ounter + 40) > finalSongs.length)
        {
            console.log("stop here 2");
            var albStr = ''
            for(let i = ounter; i < finalSongs.length; i++)
            {
                albStr += finalSongs[i];
                if((finalSongs.length-1) != i)
                {
                    albStr += '%2C';
                }
            }
    
            ounter += 40;
    
            axios
            .get('https://api.spotify.com/v1/audio-features?ids=' + albStr, {
                headers: {
                'Content-type': 'application/json',
                'Authorization': 'Bearer ' + accToken
                }
            }
            )
            .then(res => {
                console.log(`statusCode: ${res.status}`);
                console.log(res.data);
        
                var num = Object.keys(res.data.audio_features).length;
                
                for(let i = 0; i< num; i++)
                {
                  dance += res.data.audio_features[i].danceability;
                  energy += res.data.audio_features[i].energy;
                  loudness += res.data.audio_features[i].loudness;
                  tempo += res.data.audio_features[i].tempo;
                  valence += res.data.audio_features[i].valence;
                  acousticness += res.data.audio_features[i].acousticness;
                  countcount++;
                }
                
                callSpotifyAnalysis(accToken, res1, ounter);
                
            })
            .catch(error => {
                console.error(error);
                //return "error";
            });
        }
        else if((ounter + 40) <= finalSongs.length)
        {
            console.log("stop here 3");
            var albStr = ''
            var endVal = ounter + 40;
            for(let i = ounter; i < endVal; i++)
            {
                albStr += finalSongs[i];
                if((endVal-1) != i)
                {
                    albStr += '%2C';
                }
            }
            ounter += 40;
    
            axios
            .get('https://api.spotify.com/v1/audio-features?ids=' + albStr, {
                headers: {
                'Content-type': 'application/json',
                'Authorization': 'Bearer ' + accToken
                }
            }
            )
            .then(res => {
                console.log(`statusCode: ${res.status}`);
                console.log(res.data);
        
                var num = Object.keys(res.data.audio_features).length;
                
                for(let i = 0; i< num; i++)
                {
                  dance += res.data.audio_features[i].danceability;
                  energy += res.data.audio_features[i].energy;
                  loudness += res.data.audio_features[i].loudness;
                  tempo += res.data.audio_features[i].tempo;
                  valence += res.data.audio_features[i].valence;
                  acousticness += res.data.audio_features[i].acousticness;
                  countcount++;
                }
                
                callSpotifyAnalysis(accToken, res1, ounter);
            })
            .catch(error => {
                console.error(error);
                //return "error";
            });
        }
    }

    function finalize(accToken, res1)
    {
        var divisionNum = finalSongs.length;
        dance = (dance/divisionNum) * 100
        energy = (energy/divisionNum) * 100
        loudness = (loudness/divisionNum) * 100
        tempo = tempo/divisionNum
        valence = (valence/divisionNum) * 100
        acousticness = (acousticness/divisionNum) * 100

        finalStr = "  dance: " + dance + "  energy: " + energy + "  loudness: " + loudness + "  tempo: " + tempo + "  valence: " + valence + "  acousticness: " + acousticness;

        finalStr = dance + ":" + energy + ":" + valence + ":" + (100 - acousticness) + ":" + tempo;
        res1.write(finalStr);
        res1.end();
    }

}


module.exports = {callSpotifySearch, callSpotifyArtist}