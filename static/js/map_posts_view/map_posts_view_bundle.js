(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var HttpClient = require('../common_modules/_http_client').HttpClient;
var endPoints = require('../common_modules/_allowed_urls').endPoints;
var showLoading = require('../common_modules/_loading').showLoading;
var doneLoading = require('../common_modules/_loading').doneLoading;

var chosenPlaces = [];  // TODO: pointless?
var lookup = [];
var markers = [];

var postcardContainer = document.getElementById('postcard-container');

function getNewUserPosts() {
  var aClient = new HttpClient();
  var url = endPoints.getUpdatedPosts.url;

  aClient.get(url, function(response, status) {
    if (status == 200) {
      var userPosts = JSON.parse(response);

      console.log(userPosts);

      initialiseGMaps(userPosts);
    } else {
      // TODO: render error
    }
  });

}

function addHexColor(c1, c2) {
  var hexStr = (parseInt(c1, 16) + parseInt(c2, 16)).toString(16);
  while (hexStr.length < 6) { hexStr = '0' + hexStr; } // Zero pad.
  return hexStr;
}

function pad(n, width, z) {
  z = z || '0';
  n = n + '';
  return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
}

function initialiseGMaps(userPosts) {
  var mapOptions = {
    center: {lat: 48.8534100, lng: 2.3488000},
    zoom: 5
  };

  var map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions);
  var input = document.getElementById('places-input');

  // set the Google maps control array to have the input element at the "TOP_LEFT" value/position
  map.controls[google.maps.ControlPosition.TOP_CENTER].push(input);

  var searchBox = new google.maps.places.SearchBox(input); // turn the HTML input into places search

  var bounds = new google.maps.LatLngBounds();

  var allUserPaths = [];
  //  for every user
  for (var i = 0; i < userPosts.users.length; i++) {
    var user = userPosts.users[i];
    var posts = user.posts;

    // for every post by that user
    var routeHistory = [];

    for (var j = 0; j < posts.length; j++) {
      var post = posts[j];

      if (post.latitude != null && post.longitude != null) {
        var pinIcon = new google.maps.MarkerImage(
          user.avatar_url,
          null, /* size is determined at runtime */
          null, /* origin is 0,0 */
          null, /* anchor is bottom center of the scaled image */
          new google.maps.Size(42, 42)
        );

        // Adding the pin location to a list that will allow a path to be drawn between them, one
        // for each user
        var pinLocation = new google.maps.LatLng(post.latitude, post.longitude);
        routeHistory.push(pinLocation);

        var marker = new google.maps.Marker({
          position: pinLocation,
          map: map,
          title: user.name,
          id: post.id,
        });

        marker.setIcon(pinIcon);

        google.maps.event.addListener(marker, 'click', function(id) {
          return function() {
            console.log('[data-postcard-id="' + id + '"]');
            var postcardNode = document.querySelectorAll('[data-postcard-id="' + id + '"]')[0];
            var postcardBounds = postcardNode.getBoundingClientRect();
            console.log(postcardBounds.left, postcardContainer.scrollLeft);
            postcardContainer.scrollLeft = postcardBounds.left;
          }
        }(marker.id));
        // to bind the map to the markers
        bounds.extend(marker.getPosition());
      }
    }
    allUserPaths.push(routeHistory);

  }

  // making the path between all the pins
  for (var i = 0; i < allUserPaths.length; i++) {
      // TODO: CRW - this should be a list of colours - FIX!
    var colour;
    if (i == 0) {
      colour = '#040A0D';
    } else {
      colour = '#CFD5D9';
    }
    console.log(colour);

    var path = new google.maps.Polyline({
      path: allUserPaths[i],
      geodesic: true,
      strokeColor: colour,
      strokeOpacity: 1.0,
      strokeWight: 2
    });

    path.setMap(map);
  }

  map.fitBounds(bounds);

  doneLoading();
}

showLoading();

// Add all listeners down here
google.maps.event.addDomListener(window, 'load', getNewUserPosts);

postcardContainer.addEventListener('click', function(event) {
  var postcardId = event.target.getAttribute('data-postcard-id');
  if (postcardId !== null) {
//    TODO: do something, pop up big postcard
    var that = null;
  }
});

var leftCarouselArrow = document.getElementById('left-arrow');
leftCarouselArrow.addEventListener('click', function() {
  // TODO: CRW - add a translate property to the size of a postcard left
});

var rightCarouselArrow = document.getElementById('right-arrow');
rightCarouselArrow.addEventListener('click', function() {
  // TODO: CRW - add a translate property to the size of a postcard right
});


},{"../common_modules/_allowed_urls":2,"../common_modules/_http_client":3,"../common_modules/_loading":4}],2:[function(require,module,exports){
var endPoints = (function() {
  return {

//    saveRoute: {
//      url: 'save-route',
//      methods: ['POST']
//    },

    getUpdatedPosts: {
      url: 'get-updated-posts',
      methods: ['GET']
    },

//    upload: {
//      url: 'upload',
//      methods: ['GET', 'POST']
//    },

//    map: {
//      url: 'map',
//      methods: ['GET']
//    },

    readTable: function(tablename, id) {
      return {
        url: 'read/' + tablename + '/' + id,
        methods: ['GET']
      };
    },

    writeTable: function(tablename) {
      return {
        url: 'write/' + tablename,
        methods: ['POST']
      };
    },

    updateTable: function(tablename) {
      return {
        url: 'update/' + tablename,
        methods: ['PUT']
      };
    },


  };
})();  // Note the closure :)

// Export the endPoints module
exports.endPoints = endPoints;
},{}],3:[function(require,module,exports){
var HttpClient = function() {

  function buildFormData(jsonObj) {
    var encodedData = '';
    var encodedPairs = [];

    for (var key in jsonObj) {
      var value = jsonObj[key];
      encodedPairs.push(encodeURIComponent(key) + '=' + encodeURIComponent(value));
    }

    // replace spaces with pluses
    encodedData = encodedPairs.join('&').replace(/%20/g, '+');
    return encodedData;
  }

  this.get = function(aUrl, aCallback) {
    var anHttpRequest = new XMLHttpRequest();
    anHttpRequest.onreadystatechange = function() {
      if (anHttpRequest.readyState == 4)
        aCallback(anHttpRequest.responseText, anHttpRequest.status);
    }

    anHttpRequest.open( "GET", aUrl, true );

    anHttpRequest.send( null );
  };

  this.post = function(aUrl, bodyData, aCallback) {
    var anHttpRequest = new XMLHttpRequest();
    anHttpRequest.onreadystatechange = function() {
      if (anHttpRequest.readyState == 4) {
        aCallback(anHttpRequest.responseText, anHttpRequest.status);
      }
    }

    anHttpRequest.open( "POST", aUrl, true );

    anHttpRequest.setRequestHeader('Content-type', 'application/json; charset=utf-8');

    anHttpRequest.send(JSON.stringify(bodyData));
  };

  this.put = function(aUrl, bodyData, aCallback) {
    var anHttpRequest = new XMLHttpRequest();
    anHttpRequest.onreadystatechange = function() {
      if (anHttpRequest.readyState == 4) {
        aCallback(anHttpRequest.responseText, anHttpRequest.status);
      }
    }

    anHttpRequest.open( "PUT", aUrl, true );

    anHttpRequest.setRequestHeader('Content-type', 'application/json; charset=utf-8');

    anHttpRequest.send(JSON.stringify(bodyData));
  };

  this.postImgur = function(imgFile, aCallback) {

    var aUrl = 'https://api.imgur.com/3/image';
    // create new form to send to imgur
    var fd = new FormData();
    fd.append('image', imgFile);

    var anHttpRequest = new XMLHttpRequest();

    anHttpRequest.onreadystatechange = function() {
      if (anHttpRequest.readyState == 4)
        aCallback(anHttpRequest.responseText, anHttpRequest.status);
    }

    anHttpRequest.open('POST', aUrl);

    var clientId = 'a9cda2e43ea6ba9';
    anHttpRequest.setRequestHeader('Authorization', 'Client-ID ' + clientId)

    anHttpRequest.send(fd);
  };

}

// Export the HttpClient module
exports.HttpClient = HttpClient;
},{}],4:[function(require,module,exports){
var toggleClass = require('../common_modules/_modify_classes').toggleClass;
var addClass = require('../common_modules/_modify_classes').addClass;
var removeClass = require('../common_modules/_modify_classes').removeClass;

var toggleLoading = function() {
  var loadingPane = document.getElementById('loading-pane');
  var contentLoading = document.getElementById('content-loading');

  toggleClass(contentLoading, 'loading-done');
  toggleClass(loadingPane, 'loading-done');
};

var showLoading = function() {
  var loadingPane = document.getElementById('loading-pane');
  var contentLoading = document.getElementById('content-loading');

  removeClass(contentLoading, 'loading-done');
  removeClass(loadingPane, 'loading-done');
};

var doneLoading = function() {
  var loadingPane = document.getElementById('loading-pane');
  var contentLoading = document.getElementById('content-loading');

  addClass(contentLoading, 'loading-done');
  addClass(loadingPane, 'loading-done');
};

var checkLoaded = function() {
  // pass a list of booleans to this function that represent states changing in loading process
  var params = Array.prototype.slice.call(arguments);

  if (params.every(checkTrue)) {
    doneLoading();
  } else {
    showLoading();
  }

  function checkTrue(value) {
    if (value) {
      return true;
    } else {
      return false;
    }
  }
};

exports.toggleLoading = toggleLoading;
exports.showLoading = showLoading;
exports.doneLoading = doneLoading;
exports.checkLoaded = checkLoaded;
},{"../common_modules/_modify_classes":5}],5:[function(require,module,exports){
var hasClass = function(node, className) {
  var nodeClassNames = node.className.split(' ');

  // chack the class isn't on the node already
  if (nodeClassNames.indexOf(className) == -1) {
    return false;
  } else {
    return true;
  }
};

var addClass = function(node, className) {
  var nodeClassNames = node.className.split(' ');

  // chack the class isn't on the node already
  if (!hasClass(node, className)) {
    node.className = nodeClassNames.join(' ').concat(' ', className);
  }

  return node;
};

var removeClass = function(node, className) {
  var nodeClassNames = node.className.split(' ');
  var newClasses = [];

  for (var j = 0; j < nodeClassNames.length; j++) {
    if (nodeClassNames[j] !== className) {
      newClasses.push(nodeClassNames[j]);
    }
  }

  node.className = newClasses.join(' ');

  return node;
};

var toggleClass = function(node, className) {

  // the node had the class already
  if (hasClass(node, className)) {
    removeClass(node, className);
  } else {
    // the node doesn't have the class
    addClass(node, className);
  }

  return node;
};


// Export the HttpClient module
exports.hasClass = hasClass;
exports.addClass = addClass;
exports.removeClass = removeClass;
exports.toggleClass = toggleClass;
},{}]},{},[1]);
