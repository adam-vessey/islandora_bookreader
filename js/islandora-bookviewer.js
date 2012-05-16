//
// This file shows the minimum you need to provide to BookReader to display a book
//
// Copyright(c)2008-2009 Internet Archive. Software license AGPL version 3.

// Create the BookReader object
br = new BookReader();
br.structMap = new Array();
br.djatoka_prefix = islandora_params.DJATOKA_PREFIX;
br.islandora_prefix = islandora_params.ISLANDORA_PREFIX;
br.fedora_prefix = islandora_params.FEDORA_PREFIX;
br.default_width = parseInt(islandora_params.page_width);
br.default_height = parseInt(islandora_params.page_height);
br.pageProgression = islandora_params.page_progression;
br.structMap = islandora_params.book_pids;
br.compression = islandora_params.COMPRESSION;
br.baseUrl = islandora_params.base_url;
br.module_path = islandora_params.module_path;

br.getPageWidth = function(index) {
  var leafStr = br.structMap[index];
  
  if (typeof leafStr != 'undefined' && leafStr.width != null) {
    return leafStr.width;
  }
  else {
    return br.default_width;
  }
}

// Return the height of a given page.
br.getPageHeight = function(index) {
  var leafStr = br.structMap[index];
  
  if (typeof leafStr != 'undefined' && leafStr.height != null) {
    return leafStr.height;
  }
  else {
    return br.default_height;
  }
}

// We load the images from fedora
// using a different URL structure
br.getPageURI = function(index, reduce, rotate) {
  // reduce and rotate are ignored in this simple implementation, but we
  // could e.g. look at reduce and load images from a different directory
  // or pass the information to an image server
  var leafStr = br.structMap[index];// get the pid of the object from the
                                        // struct map islandora specific
  if (typeof leafStr != 'undefined' && typeof leafStr.url != 'undefined') {
    return leafStr.url;
  }
  else {
    var pid = br.getPid(index);
    var url = br.baseUrl + '/islandora_bookreader/getbookpage/' + pid;
    return url;
  }
}

br.getOcrURI = function(index) {
  var indices = br.getSpreadIndices(index);
  var pidL = br.getPid(indices[0]); // pid for left page
  var pidR = br.getPid(indices[1]); // pid for right page

  return br.baseUrl + "/bookreader/ocr/" + pidL + '/' + pidR;
}

br.getModsURI = function(index) {
  // var leafStr = br.structMap[index+1];//get the pid of the object from the
  // struct map islandora specific
  // return br.islandora_prefix + '/' + leafStr + "/MODS";
  // return "/mods2html/" + leafStr;
  var indices = br.getSpreadIndices(index);
  var pidL = br.getPid(indices[0]); // pid for left page
  var pidR = br.getPid(indices[1]); // pid for right page

  return br.baseUrl + "/mods2html/" + br.bookPid;
}

/**
 * Get the Fedora PID, given an index.
 * 
 * @param index integer
 *   An integer which represents an offset in structMap.
 * @returns
 *   The PID of the given leaf, or '-' if there is no such leaf.
 */
br.getPid = function(index) {
  var leafStr = br.structMap[index];// get the pid of the object from the
                                        
  if (typeof leafStr == 'undefined') {
    return '-';
  }
  else {
    return leafStr.pid;
  }
}

// Return which side, left or right, that a given page should be displayed on
br.getPageSide = function(index) { 
  if (br.pageProgression == null) {
    var vals = ["R", "L"];
    return vals[index & 0x1];
  }
  else {
    return br.pageProgression.toUpperCase()[1 - (index & 0x1)];
  }
}

// This function returns the left and right indices for the user-visible
// spread that contains the given index. The return values may be
// null if there is no facing page or the index is invalid.
br.getSpreadIndices = function(pindex) {
  var spreadIndices = [ null, null ];
  if ('rl' == this.pageProgression) {
    // Right to Left
    if (this.getPageSide(pindex) == 'R') {
      spreadIndices[1] = pindex;
      spreadIndices[0] = pindex + 1;
    } else {
      // Given index was LHS
      spreadIndices[0] = pindex;
      spreadIndices[1] = pindex - 1;
    }
  } else {
    // Left to right
    if (this.getPageSide(pindex) == 'L') {
      spreadIndices[0] = pindex;
      spreadIndices[1] = pindex + 1;
    } else {
      // Given index was RHS
      spreadIndices[1] = pindex;
      spreadIndices[0] = pindex - 1;
    }
  }

  return spreadIndices;
}

br.search = function(term) {

  var url = br.baseUrl + "/ocrsearch/" + br.bookPid + "/" + escape(term)
  term = term.replace(/\//g, ' '); // strip slashes, since this goes in the url
  this.searchTerm = term;

  this.removeSearchResults();
  this.showProgressPopup('<img id="searchmarker" src="' + this.imagesBaseURL
      + 'marker_srch-on.png' + '"> Search results will appear below...');
  $.ajax({
    url : url,
    dataType : 'json',
    success : function(data, status, xhr) {
      br.BRSearchCallback(data);
    },
    error : function() {
      alert("Search call to " + url + " failed");
    }
  });
}

// For a given "accessible page index" return the page number in the book.
//
// For example, index 5 might correspond to "Page 1" if there is front matter
// such
// as a title page and table of contents.
// for now we just show the image number
br.getPageNum = function(index) {
  var leafStr = br.structMap[index];
  
  if (typeof leafStr == 'undefined') {
    return false;
  }
  else {
    return leafStr.page_number;
  }
}

br.leafNumToIndex = function(index) {
  var leafNum = false;
  
  $.each(br.structMap, function(idx, el) {
    if (el.page_number == index) {
      leafNum = idx;
      return false;
    }
  })
  return leafNum;
}

// Total number of leafs
br.numLeafs = islandora_params.page_count;

// Book title and the URL used for the book title link
br.bookTitle = islandora_params.label;
if (br.bookTitle.length > 100) {
  br.bookTitle = br.bookTitle.substring(0, 97) + '...';
}
// book url should be created dynamically
br.bookUrl = br.islandora_prefix + '/' + PID;
br.bookPid = PID;
// Override the path used to find UI images
br.imagesBaseURL = 'images/';
br.logoURL = ""; // don't want to go to LOC so init it empty, the title already
                  // takes us back to the book
br.getEmbedCode = function(frameWidth, frameHeight, viewParams) {
  return "Embed code not supported in bookreader demo.";
}

function getURLParam(name) {
  // get query string part of url into its own variable
  var url = window.location.href;
  var query_string = url.split("?");

  // make array of all name/value pairs in query string
  var params = query_string[1].split(/\&|#/);

  // loop through the parameters
  var i = 0;
  while (params.length > i) {
    // compare param name against arg passed in
    var param_item = params[i].split("=");
    if (param_item[0] == name) {
      // if they match, return the value
      return param_item[1];
    }
    i++;
  }
  return "";
}

var query = getURLParam("solrq");
if (query != "") {
  br.search(query);
}
// Let's go!
br.init();

// read-aloud and search need backend compenents and are not supported in the
// demo
$('#BRtoolbar').find('.read').hide();
