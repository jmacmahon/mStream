var entityMap = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
  '/': '&#x2F;',
  '`': '&#x60;',
  '=': '&#x3D;'
};

function escapeHtml (string) {
  return String(string).replace(/[&<>"'`=\/]/g, function (s) {
    return entityMap[s];
  });
}

$(document).ready(function () {
  // Responsive active content
  $(document).on('click', '.activate-panel-1', function(event) {
    $('.activate-panel-1').addClass('active');
    $('.activate-panel-2').removeClass('active');

    $('#panel1').addClass('active');
    $('#panel2').removeClass('active');
  });

  $(document).on('click', '.activate-panel-2', function(event) {
    $('.activate-panel-2').addClass('active');
    $('.activate-panel-1').removeClass('active');

    $('#panel2').addClass('active');
    $('#panel1').removeClass('active');
  });

  $(document).on('click', '.hamburger-button', function(event) {
    $('.responsive-left-nav').toggleClass('hide-on-small');
  });

  // Modals
  $("#sharePlaylist").iziModal({
    title: 'Share Playlist',
    headerColor: '#5a5a6a',
    focusInput: false,
    padding: 15
  });
  $('#savePlaylist').iziModal({
    title: 'Save Playlist',
    headerColor: '#5a5a6a',
    focusInput: false,
    width: 475
  });
  $('#aboutModal').iziModal({
    title: 'Info',
    headerColor: '#5a5a6a',
    width: 475,
    focusInput: false,
    padding: 15
  });
  $('#speedModal').iziModal({
    title: 'Playback',
    headerColor: '#5a5a6a',
    width: 475,
    focusInput: false,
    padding: 15,
    afterRender: function() {
      new Vue({
        el: '#speed-bar',
        data: {
          curSpeed: 1
        },
        watch: {
          curSpeed: function () {
            MSTREAMPLAYER.changePlaybackRate(this.curSpeed);
          }
        },
      });
    }
  });
  $(document).on('click', '.trigger-share', function (event) {
    event.preventDefault();
    $('#sharePlaylist').iziModal('open');
  });
  $(document).on('click', '.trigger-save', function (event) {
    event.preventDefault();
    $('#savePlaylist').iziModal('open');
  });
  $(document).on('click', '.nav-logo', function (event) {
    event.preventDefault();
    $('#aboutModal').iziModal('open');
  });
  $(document).on('click', '.trigger-playback-modal', function (event) {
    event.preventDefault();
    $('#speedModal').iziModal('open');
  });
  $('#savePlaylist').iziModal('setTop', '12%');
  $('#sharePlaylist').iziModal('setTop', '12%');
  $('#aboutModal').iziModal('setTop', '10%');
  $('#speedModal').iziModal('setTop', '12%');

  // Dropzone
  const myDropzone = new Dropzone(document.body, {
    previewsContainer: false,
    clickable: false,
    url: '/upload',
    maxFilesize: null
  });

  myDropzone.on("addedfile", function(file) {
    if (programState[0].state !== 'fileExplorer') {
      iziToast.error({
        title: 'Files can only be added to the file explorer',
        position: 'topCenter',
        timeout: 3500
      });
      myDropzone.removeFile(file);
    } else if (fileExplorerArray.length < 1) {
      iziToast.error({
        title: 'Cannot Upload File Here',
        position: 'topCenter',
        timeout: 3500
      });
      myDropzone.removeFile(file);
    } else {
      var directoryString = "";
      for (var i = 0; i < fileExplorerArray.length; i++) {
        directoryString += fileExplorerArray[i] + "/";
      }
      file.directory = directoryString;
    }
  });

  myDropzone.on('sending', function (file, xhr, formData) {
    xhr.setRequestHeader('data-location', file.directory)
    xhr.setRequestHeader('x-access-token', MSTREAMAPI.currentServer.token)
  });

  myDropzone.on('totaluploadprogress', function (percent, uploaded, size) {
    $('.upload-progress-inner').css('width', (percent) + '%');
    if (percent === 100) {
      $('.upload-progress-inner').css('width', '0%');
    }
  });

  myDropzone.on('queuecomplete', function (file, xhr, formData) {
    var successCount = 0;
    for (var i = 0; i < myDropzone.files.length; i++) {
      if (myDropzone.files[i].status === 'success') {
        successCount += 1;
      }
    }

    if (successCount === myDropzone.files.length) {
      iziToast.success({
        title: 'Files Uploaded',
        position: 'topCenter',
        timeout: 3500
      });
      if (programState[0].state === 'fileExplorer') {
        senddir(false, fileExplorerArray);
      }
    } else if (successCount === 0) {
      // do nothing
    } else {
      iziToast.warning({
        title: successCount + ' out of ' + myDropzone.files.length + ' were uploaded successfully',
        position: 'topCenter',
        timeout: 3500
      });

      if (programState[0].state === 'fileExplorer') {
        senddir(false, fileExplorerArray);
      }
    }

    myDropzone.removeAllFiles()
  });

  myDropzone.on('error', function (err, msg, xhr) {
    var iziStuff = {
      title: 'Upload Failed',
      position: 'topCenter',
      timeout: 3500
    };

    if (msg.error) {
      iziStuff.message = msg.error;
    }

    iziToast.error(iziStuff);
  });

  // Setup scrobbling
  MSTREAMPLAYER.scrobble = function () {
    if (MSTREAMPLAYER.playerStats.metadata.artist && MSTREAMPLAYER.playerStats.metadata.title) {
      MSTREAMAPI.scrobbleByMetadata(MSTREAMPLAYER.playerStats.metadata.artist, MSTREAMPLAYER.playerStats.metadata.album, MSTREAMPLAYER.playerStats.metadata.title, function (response, error) {

      });
    }
  }

  var programState = [];

  // Auto Focus
  Vue.directive('focus', {
    // When the bound element is inserted into the DOM...
    inserted: function (el) {
      // Focus the element
      el.focus()
    }
  });


  new Vue({
    el: '#login-overlay',
    data: {
      pending: false
    },
    methods: {
      submitCode: function (e) {
        // Get Code
        this.pending = true;
        var that = this;
        MSTREAMAPI.login($('#login-username').val(), $('#login-password').val(), function (response, error) {
          that.pending = false;          
          if (error !== false) {
            // Alert the user
            iziToast.error({
              title: 'Login Failed',
              position: 'topCenter',
              timeout: 3500
            });
            return;
          }

          // Local Storage
          if (typeof(Storage) !== "undefined") {
            localStorage.setItem("token", response.token);
          }
          
          // Add the token the URL calls
          MSTREAMAPI.updateCurrentServer($('#login-username').val(), response.token, response.vpaths)

          loadFileExplorer();
          callOnStart();

          // Remove the overlay
          $('.login-overlay').fadeOut("slow");
        });
      }
    }
  });

  function testIt() {
    var token;
    if (typeof(Storage) !== "undefined") {
      token = localStorage.getItem("token");
    }

    if (token) {
      MSTREAMAPI.currentServer.token = token;
    }

    MSTREAMAPI.ping(function (response, error) {
      if (error !== false) {
        $('.login-overlay').fadeIn("slow");
        return;
      }
      // set vPath
      MSTREAMAPI.currentServer.vpaths = response.vpaths;

      VUEPLAYER.playlists.length = 0;
      $.each(response.playlists, function () {
        VUEPLAYER.playlists.push(this);
      });

      // Setup the file browser
      loadFileExplorer();
      callOnStart();
    });
  }

  testIt();
  var startInterval = false;

  function callOnStart() {
    MSTREAMAPI.dbStatus(function (response, error) {
      if (error) {
        $('.scan-status').html('');
        $('.scan-status-files').html('');
        clearInterval(startInterval);
        startInterval = false;
        return;
      }

      // if not scanning
      if (!response.locked || response.locked === false) {
        clearInterval(startInterval);
        startInterval = false;
        $('.scan-status').html('');
        $('.scan-status-files').html('');

        return;
      }

      // Set Interval
      if (startInterval === false) {
        startInterval = setInterval(function () {
          callOnStart();
        }, 2000);
      }

      // Update status
      $('.scan-status').html('Scan In Progress');
      $('.scan-status-files').html(response.totalFileCount + ' files in DB');
    });
  }


  ////////////////////////////// Global Variables
  // These vars track your position within the file explorer
  var fileExplorerArray = [];
  var fileExplorerScrollPosition = [];
  // Stores an array of searchable objects
  var currentBrowsingList = [];

  ////////////////////////////////   Administrative stuff
  // when you click an mp3, add it to now playing
  $("#filelist").on('click', 'div.filez', function () {
    MSTREAMAPI.addSongWizard($(this).data("file_location"), {}, true);
  });

  // Handle panel stuff
  function resetPanel(panelName, className) {
    $('#filelist').empty();
    $('#directory_bar').show();

    $('#search_folders').val('');
    $('.directoryName').html('');

    $('#filelist').removeClass('scrollBoxHeight1');
    $('#filelist').removeClass('scrollBoxHeight2');

    $('#filelist').addClass(className);
    $('.panel_one_name').html(panelName);
  }

  function boilerplateFailure(response, error) {
    iziToast.error({
      title: 'Call Failed',
      position: 'topCenter',
      timeout: 3500
    });
  }

  // clear the playlist
  $("#clear").on('click', function () {
    MSTREAMPLAYER.clearPlaylist();
  });

  /////////////////////////////////////// File Explorer
  function loadFileExplorer() {
    $('ul.left-nav-menu li').removeClass('selected');
    $('.get_file_explorer').addClass('selected');

    resetPanel('File Explorer', 'scrollBoxHeight1');
    programState = [{
      state: 'fileExplorer'
    }]
    $('#directory_bar').show();

    // Reset file explorer vars
    fileExplorerArray = [];
    fileExplorerScrollPosition = [];

    if (MSTREAMAPI.currentServer.vpaths && MSTREAMAPI.currentServer.vpaths.length === 1) {
      fileExplorerArray.push(MSTREAMAPI.currentServer.vpaths[0]);
      fileExplorerScrollPosition.push(0);
    }

    //send this directory to be parsed and displayed
    senddir(null, fileExplorerArray);
  }

  // Load up the file explorer
  $('.get_file_explorer').on('click', loadFileExplorer);

  // when you click on a directory, go to that directory
  $("#filelist").on('click', 'div.dirz', function () {
    //get the id of that class
    var nextDir = $(this).data("directory");
    var newArray = [];
    for (var i = 0; i < fileExplorerArray.length; i++) {
      newArray.push(fileExplorerArray[i]);
    }
    newArray.push(nextDir);

    senddir(false, newArray);
  });

  // when you click the back directory
  $(".backButton").on('click', function () {
    // Handle file Explorer
    if (programState[0].state === 'fileExplorer') {
      if (fileExplorerArray.length != 0) {
        // remove the last item in the array
        var newArray = [];
        for (var i = 0; i < fileExplorerArray.length - 1; i++) {
          newArray.push(fileExplorerArray[i]);
        }

        senddir(true, newArray);
      }
    } else {
      // Handle all other cases
      if (programState.length < 2) {
        return;
      }

      programState.pop();
      var backState = programState[programState.length - 1];

      if (backState.state === 'allPlaylists') {
        getAllPlaylists();
      } else if (backState.state === 'allAlbums') {
        getAllAlbums();
      } else if (backState.state === 'allArtists') {
        getAllArtists();
      } else if (backState.state === 'artist') {
        getArtistsAlbums(backState.name);
      }
    }
  });

  // send a new directory to be parsed.
  function senddir(scrollPosition, newArray) {
    // Construct the directory string
    var directoryString = "";
    for (var i = 0; i < newArray.length; i++) {
      directoryString += newArray[i] + "/";
    }

    $('.directoryName').html('/' + directoryString);
    $('#filelist').html('<div class="loading-screen"><svg class="spinner" width="65px" height="65px" viewBox="0 0 66 66" xmlns="http://www.w3.org/2000/svg"><circle class="spinner-path" fill="none" stroke-width="6" stroke-linecap="round" cx="33" cy="33" r="30"></circle></svg></div>');

    MSTREAMAPI.dirparser(directoryString, false, function (response, error) {
      if (error !== false) {
        boilerplateFailure(response, error);
        return;
      }

      fileExplorerArray = newArray;
      // Set any directory views
      // hand this data off to be printed on the page
      printdir(response);
      // Set scroll postion
      if (scrollPosition === false) {
        var sp = $('#filelist').scrollTop();
        fileExplorerScrollPosition.push(sp);
        $('#filelist').scrollTop(0);
      } else if (scrollPosition === true) {
        var sp = fileExplorerScrollPosition.pop();
        $('#filelist').scrollTop(sp);
      }
    });
  }


  // function that will recieve JSON array of a directory listing.  It will then make a list of the directory and tack on classes for functionality
  function printdir(response) {
    currentBrowsingList = response.contents;

    // clear the list
    $('#search_folders').val('');

    //parse through the json array and make an array of corresponding divs
    var filelist = [];
    $.each(currentBrowsingList, function () {
      if (this.type == 'directory') {
        filelist.push('<div class="clear relative"><div data-directory="' + this.name + '" class="dirz"><img class="folder-image" src="/public/img/folder.svg"><span class="item-text">' + this.name + '</span></div><div class="song-button-box"><span data-directory="' + this.name + '" title="Download Directory" class="downloadDir"><svg width="12" height="12" viewBox="0 0 2048 2048" xmlns="http://www.w3.org/2000/svg"><path d="M1803 960q0 53-37 90l-651 652q-39 37-91 37-53 0-90-37l-651-652q-38-36-38-90 0-53 38-91l74-75q39-37 91-37 53 0 90 37l294 294v-704q0-52 38-90t90-38h128q52 0 90 38t38 90v704l294-294q37-37 90-37 52 0 91 37l75 75q37 39 37 91z"/></svg></span></div></div>');
      } else {
        if (this.artist != null || this.title != null) {
          filelist.push('<div data-file_location="' + response.path + this.name + '" class="filez"><img class="music-image" src="/public/img/music-note.svg"> <span class="item-text">' + this.artist + ' - ' + this.title + '</span></div>');
        } else {
          filelist.push('<div data-file_location="' + response.path + this.name + '" class="filez"><img class="music-image" src="/public/img/music-note.svg"> <span class="item-text">' + this.name + '</span></div>');
        }
      }
    });

    // Post the html to the filelist div
    $('#filelist').html(filelist);
  }

  // when you click 'add directory', add entire directory to the playlist
  $("#addall").on('click', function () {
    //make an array of all the mp3 files in the curent directory
    var elems = document.getElementsByClassName('filez');
    var arr = jQuery.makeArray(elems);

    //loop through array and add each file to the playlist
    $.each(arr, function () {
      MSTREAMAPI.addSongWizard($(this).data("file_location"), {}, true);
    });
  });


  // Search Files
  $('#search_folders').on('change keyup', function () {
    var searchVal = $(this).val();

    var path = "";		// Construct the directory string
    for (var i = 0; i < fileExplorerArray.length; i++) {
      path += fileExplorerArray[i] + "/";
    }

    var filelist = [];
    // This causes an error in the playlist display
    $.each(currentBrowsingList, function () {
      var lowerCase = this.name.toLowerCase();

      if (lowerCase.indexOf(searchVal.toLowerCase()) !== -1) {
        if (this.type === 'directory') {
          filelist.push('<div class="clear relative"><div data-directory="' + this.name + '" class="dirz"><img class="folder-image" src="/public/img/folder.svg"><span class="item-text">' + this.name + '</span></div><div data-directory="' + this.name + '" class="song-button-box"><span class="downloadDir"><svg width="12" height="12" viewBox="0 0 2048 2048" xmlns="http://www.w3.org/2000/svg"><path d="M1803 960q0 53-37 90l-651 652q-39 37-91 37-53 0-90-37l-651-652q-38-36-38-90 0-53 38-91l74-75q39-37 91-37 53 0 90 37l294 294v-704q0-52 38-90t90-38h128q52 0 90 38t38 90v704l294-294q37-37 90-37 52 0 91 37l75 75q37 39 37 91z"/></svg></span></div></div>');
        } else if (this.type === 'playlist') {
          filelist.push('<div data-playlistname="' + encodeURIComponent(this.name) + '" class="playlist_row_container"><span data-playlistname="' + encodeURIComponent(this.name) + '" class="playlistz force-width">' + escapeHtml(this.name) + '</span><div class="song-button-box"><span data-playlistname="' + encodeURIComponent(this.name) + '" class="deletePlaylist">Delete</span></div></div>');
        } else if (this.type === 'album') {
          if (this.album_art_file) {
            filelist.push('<div data-album="' + this.name + '" class="albumz"><img class="album-art-box"  data-original="/album-art/' + this.album_art_file + '?token=' + MSTREAMAPI.currentServer.token + '"><span class="explorer-label-1">' + this.name + '</span></div>');
          } else {
            filelist.push('<div data-album="' + this.name + '" class="albumz"><img class="album-art-box" src="/public/img/default.png"><span class="explorer-label-1">' + this.name + '</span></div>');
          }
        } else if (this.type === 'artist') {
          filelist.push('<div data-artist="' + this.name + '" class="artistz">' + this.name + ' </div>');
        } else {
          if (programState[programState.length - 1].state === 'playlist') {
            if (!this.metadata || !this.metadata.title) {
              filelist.push('<div data-file_location="' + this.filepath + '" class="filez"><img class="album-art-box" src="/public/img/default.png"><span class="explorer-label-1">' + this.filepath + '</span></div>');
            } else if (this.metadata['album-art']) {
              filelist.push('<div data-file_location="' + this.filepath + '" class="filez"><img class="album-art-box"  data-original="/album-art/' + this.metadata['album-art'] + '?token=' + MSTREAMAPI.currentServer.token + '"><span class="explorer-label-1">' + this.metadata.artist + ' - ' + this.metadata.title + '</span></div>');
            } else {
              filelist.push('<div data-file_location="' + this.filepath + '" class="filez"><img class="album-art-box" src="/public/img/default.png"><span class="explorer-label-1">' + this.metadata.artist + ' - ' + this.metadata.title + '</span></div>');
            }
          } else {
            if (this.artist != null || this.title != null) {
              filelist.push('<div data-file_location="' + path + this.name + '" class="filez"><img class="music-image" src="/public/img/music-note.svg"> <span class="title">' + this.artist + ' - ' + this.title + '</span></div>');
            } else {
              filelist.push('<div data-file_location="' + path + this.name + '" class="filez"><img class="music-image" src="/public/img/music-note.svg"> <span class="title">' + this.name + '</span></div>');
            }
          }
        }
      }
    });

    // Post the html to the filelist div
    $('#filelist').html(filelist);
    ll.update();
  });

  $('#search-explorer').on('click', function () {
    // Hide Filepath
    $('#search_folders').toggleClass('hide');
    // Show Search Input
    $('.directoryName').toggleClass('hide');

    if (!$('#search_folders').hasClass('hide')) {
      $("#search_folders").focus();
    } else {
      $('#search_folders').val('');
      $("#search_folders").change();
    }
  });

  $("#filelist").on('click', '.downloadDir', function () {
    var directoryString = "/";
    for (var i = 0; i < fileExplorerArray.length; i++) {
      directoryString += fileExplorerArray[i] + "/";
    }

    directoryString += $(this).data("directory");

    // Use key if necessary
    $("#downform").attr("action", "/download-directory?token=" + MSTREAMAPI.currentServer.token);

    $('<input>').attr({
      type: 'hidden',
      name: 'directory',
      value: directoryString,
    }).appendTo('#downform');

    //submit form
    $('#downform').submit();
    // clear the form
    $('#downform').empty();
  });

  //////////////////////////////////////  Share playlists
  $('#share_playlist_form').on('submit', function (e) {
    e.preventDefault();

    $('#share_it').prop("disabled", true);
    var shareTimeInDays = $('#share_time').val();

    // Check for special characters
    if (/^[0-9]*$/.test(shareTimeInDays) == false) {
      console.log('don\'t do that');
      $('#share_it').prop("disabled", false);
      return false;
    }

    //loop through array and add each file to the playlist
    var stuff = [];
    for (let i = 0; i < MSTREAMPLAYER.playlist.length; i++) {
      //Do something
      stuff.push(MSTREAMPLAYER.playlist[i].filepath);
    }

    if (stuff.length == 0) {
      $('#share_it').prop("disabled", false);
      return;
    }

    MSTREAMAPI.makeShared(stuff, shareTimeInDays, function (response, error) {
      if (error !== false) {
        return boilerplateFailure(response, error);
      }
      $('#share_it').prop("disabled", false);
      var adrs = window.location.protocol + '//' + window.location.host + '/shared/playlist/' + response.playlist_id;
      $('.share-textarea').val(adrs);
    });
  });


  //////////////////////////////////////  Save/Load playlists
  // Save a new playlist
  $('#save_playlist_form').on('submit', function (e) {
    e.preventDefault();

    // Check for special characters
    if (/^[a-zA-Z0-9-_ ]*$/.test(title) == false) {
      console.log('don\'t do that');
      return false;
    }

    if (MSTREAMPLAYER.playlist.length == 0) {
      iziToast.warning({
        title: 'No playlist to save!',
        position: 'topCenter',
        timeout: 3500
      });
      return;
    }

    $('#save_playlist').prop("disabled", true);
    var title = $('#playlist_name').val();

    //loop through array and add each file to the playlist
    var songs = [];
    for (let i = 0; i < MSTREAMPLAYER.playlist.length; i++) {
      songs.push(MSTREAMPLAYER.playlist[i].filepath);
    }

    MSTREAMAPI.savePlaylist(title, songs, function (response, error) {
      if (error !== false) {
        return boilerplateFailure(response, error);
      }
      $('#save_playlist').prop("disabled", false);
      $('#savePlaylist').iziModal('close');
      iziToast.success({
        title: 'Playlist Saved',
        position: 'topCenter',
        timeout: 3000
      });

      if (programState[0].state === 'allPlaylists') {
        getAllPlaylists();
      }

      VUEPLAYER.playlists.push({ name: title, type: 'playlist'});
    });
  });

  // Get all playlists
  $('.get_all_playlists').on('click', function () {
    getAllPlaylists();
  });

  function getAllPlaylists() {
    $('ul.left-nav-menu li').removeClass('selected');
    $('.get_all_playlists').addClass('selected');
    resetPanel('Playlists', 'scrollBoxHeight1');
    $('#filelist').html('<div class="loading-screen"><svg class="spinner" width="65px" height="65px" viewBox="0 0 66 66" xmlns="http://www.w3.org/2000/svg"><circle class="spinner-path" fill="none" stroke-width="6" stroke-linecap="round" cx="33" cy="33" r="30"></circle></svg></div>');
    currentBrowsingList = [];

    programState = [{
      state: 'allPlaylists'
    }]

    MSTREAMAPI.getAllPlaylists(function (response, error) {
      if (error !== false) {
        $('#filelist').html('<div>Server call failed</div>');
        return boilerplateFailure(response, error);
      }

      VUEPLAYER.playlists.length = 0;

      // loop through the json array and make an array of corresponding divs
      var playlists = [];
      $.each(response, function () {
        playlists.push('<div data-playlistname="' + encodeURIComponent(this.name) + '" class="playlist_row_container"><span data-playlistname="' + encodeURIComponent(this.name) + '" class="playlistz force-width">' + escapeHtml(this.name) + '</span><div class="song-button-box"><span data-playlistname="' + encodeURIComponent(this.name) + '" class="deletePlaylist">Delete</span></div></div>');
        this.type = 'playlist';
        currentBrowsingList.push(this);
        VUEPLAYER.playlists.push(this);
      });
      // Add playlists to the left panel
      $('#filelist').html(playlists);
    });
  }

  // delete playlist
  $("#filelist").on('click', '.deletePlaylist', function () {
    var playlistname = decodeURIComponent($(this).data('playlistname'));

    iziToast.question({
      timeout: 10000,
      close: false,
      overlayClose: true,
      overlay: true,
      displayMode: 'once',
      id: 'question',
      zindex: 99999,
      title: "Delete '" + playlistname + "'?",
      position: 'center',
      buttons: [
          ['<button><b>Delete</b></button>', function (instance, toast) {
            MSTREAMAPI.deletePlaylist(playlistname, function (response, error) {
              if (error !== false) {
                return boilerplateFailure(response, error);
              }
              $('div[data-playlistname="'+encodeURIComponent(playlistname)+'"]').remove();
            });
            instance.hide({ transitionOut: 'fadeOut' }, toast, 'button');
          }, true],
          ['<button>Go Back</button>', function (instance, toast) {
            instance.hide({ transitionOut: 'fadeOut' }, toast, 'button');
          }],
      ]
    });
  });

  $("#filelist").on('click', '.removePlaylistSong', function () {
    var lokiId = $(this).data('lokiid');
    MSTREAMAPI.removePlaylistSong(lokiId, function (response, error) {
      if (error !== false) {
        return boilerplateFailure(response, error);
      }
      $('div[data-lokiid="' + lokiId + '"]').remove();
    });
  });

  // load up a playlist
  $("#filelist").on('click', '.playlistz', function () {
    var playlistname = decodeURIComponent($(this).data('playlistname'));
    var name = $(this).html();
    $('.directoryName').html('Playlist: ' + name);
    $('#filelist').html('<div class="loading-screen"><svg class="spinner" width="65px" height="65px" viewBox="0 0 66 66" xmlns="http://www.w3.org/2000/svg"><circle class="spinner-path" fill="none" stroke-width="6" stroke-linecap="round" cx="33" cy="33" r="30"></circle></svg></div>');
    $('#search_folders').val('');
    currentBrowsingList = [];

    programState.push({
      state: 'playlist',
      name: playlistname
    })

    MSTREAMAPI.loadPlaylist(playlistname, function (response, error) {
      if (error !== false) {
        $('#filelist').html('<div>Server call failed</div>');
        return boilerplateFailure(response, error);
      }
      
      // Add the playlist name to the modal
      $('#playlist_name').val(name);

      //parse through the json array and make an array of corresponding divs
      var files = [];
      $.each(response, function (index, value) {
        if (!value.metadata || !value.metadata.title) {
          currentBrowsingList.push({ type: 'file', name: value.filepath, metadata: value.metadata });
          files.push('<div data-lokiid="'+value.lokiId+'" class="clear relative"><div data-lokiid="'+value.lokiId+'" data-file_location="' + value.filepath + '" class="filez left"><img class="album-art-box" src="/public/img/default.png"><span class="explorer-label-1">' + value.filepath + '</span></div><div class="song-button-box"><span data-lokiid="'+value.lokiId+'" class="removePlaylistSong">remove</span></div></div>');
        } else if (value.metadata['album-art']) {
          currentBrowsingList.push({ type: 'file', name: value.metadata.artist + ' - ' + value.metadata.title, metadata: value.metadata });
          files.push('<div data-lokiid="'+value.lokiId+'" class="clear relative"><div data-lokiid="'+value.lokiId+'" data-file_location="' + value.filepath + '" class="filez left"><img class="album-art-box"  data-original="/album-art/' + value.metadata['album-art'] + '?token=' + MSTREAMAPI.currentServer.token + '"><span class="explorer-label-1">' + value.metadata.artist + ' - ' + value.metadata.title + '</span></div><div class="song-button-box"><span data-lokiid="'+value.lokiId+'" class="removePlaylistSong">remove</span></div></div>');
        } else {
          currentBrowsingList.push({ type: 'file', name: value.metadata.artist + ' - ' + value.metadata.title, metadata: value.metadata });
          files.push('<div data-lokiid="'+value.lokiId+'" class="clear relative"><div data-lokiid="'+value.lokiId+'" data-file_location="' + value.filepath + '" class="filez left"><img class="album-art-box" src="/public/img/default.png"><span class="explorer-label-1">' + value.metadata.artist + ' - ' + value.metadata.title + '</span></div><div class="song-button-box"><span data-lokiid="'+value.lokiId+'" class="removePlaylistSong">remove</span></div></div>');
        }
      });

      $('#filelist').html(files);
      // update linked list plugin
      ll.update();
    });
  });

  /////////////// Download Playlist
  $('#downloadPlaylist').click(function () {
    // Loop through array and add each file to the playlist
    var downloadFiles = [];
    for (let i = 0; i < MSTREAMPLAYER.playlist.length; i++) {
      downloadFiles.push(MSTREAMPLAYER.playlist[i].filepath);
    }

    if (downloadFiles < 1) {
      return;
    }

    // Use key if necessary
    $("#downform").attr("action", "/download?token=" + MSTREAMAPI.currentServer.token);

    $('<input>').attr({
      type: 'hidden',
      name: 'fileArray',
      value: JSON.stringify(downloadFiles),
    }).appendTo('#downform');

    //submit form
    $('#downform').submit();
    // clear the form
    $('#downform').empty();
  });

  /////////////////////////////   Mobile Stuff
  $('.mobile-panel').on('click', function () {
    $('ul.left-nav-menu li').removeClass('selected');
    $('.mobile-panel').addClass('selected');
    resetPanel('Mobile Apps', 'scrollBoxHeight2');
    $('#directory_bar').hide();

    $('#filelist').html("\
      <div class='mobile-links'>\
        <a target='_blank' href='https://play.google.com/store/apps/details?id=mstream.music&pcampaignid=MKT-Other-global-all-co-prtnr-py-PartBadge-Mar2515-1'><img alt='Get it on Google Play' src='https://play.google.com/intl/en_us/badges/images/generic/en_badge_web_generic.png'/></a>\
        <div class='mobile-placeholder'>&nbsp;</div>\
        <!-- <a href='https://play.google.com/store/apps/details?id=mstream.music&pcampaignid=MKT-Other-global-all-co-prtnr-py-PartBadge-Mar2515-1'><img alt='Get it on Google Play' src='https://play.google.com/intl/en_us/badges/images/generic/en_badge_web_generic.png'/></a> -->\
      </div>\
      <div class='app-text'>\
        The official mStream App is now available for Android.  Use it to sync and stream music from any mStream server.\
        <br><br>\
        An iOS version will be released soon.\
        <br><br>\
        <a target='_blank' href='/public/qr-tool.html'>Checkout the QR Code tool to help add your server to the app</a>\
      </div>\
    ");
  });

  /////////////////////////////   Database Management
  //  The Manage DB panel
  $('.db-panel').on('click', function () {
    $('ul.left-nav-menu li').removeClass('selected');
    $('.db-panel').addClass('selected');
    resetPanel('Database', 'scrollBoxHeight2');
    $('#filelist').html('<div class="loading-screen"><svg class="spinner" width="65px" height="65px" viewBox="0 0 66 66" xmlns="http://www.w3.org/2000/svg"><circle class="spinner-path" fill="none" stroke-width="6" stroke-linecap="round" cx="33" cy="33" r="30"></circle></svg></div>');
    $('#directory_bar').hide();
    currentBrowsingList = [];

    MSTREAMAPI.dbStatus(function (response, error) {
      if (error !== false) {
        $('#filelist').html('<div>Server call failed</div>');
        return boilerplateFailure(response, error);
      }

      // If there is an error
      if (response.error) {
        $('#filelist').html('<p>The database returned the following error:</p><p>' + response.error + '</p>');
        return;
      }

      // if the DB is locked
      if (response.locked) {
        $('#filelist').html('<p class="scan-status">Scan In Progress</p><p class="scan-status-files">' + response.totalFileCount + ' files in DB</p>');
        return;
      }
      // If you got this far the db is made and working
      $('#filelist').html('<p>Your DB has ' + response.totalFileCount + ' files</p><input type="button" value="Build Database" id="build_database">');
    });
  });

  // Build the database
  $('body').on('click', '#build_database', function () {
    $(this).prop("disabled", true);

    MSTREAMAPI.dbScan(function (response, error) {
      if (error !== false) {
        return boilerplateFailure(response, error);
      }

      $('#filelist').append('  <p class="scan-status">Scan In Progress</p><p class="scan-status-files"></p>');
      callOnStart();
    });
  });

  // Recent Songs
  $('.get_recent_songs').on('click', function () {
    getRecentlyAdded();
  });

  $('#libraryColumn').on('keydown', '#recently-added-limit', function(e) {
    if(e.keyCode===13){
      $( "#recently-added-limit" ).blur();
    }
  });

  $('#libraryColumn').on('focusout', '#recently-added-limit', function() {
    redoRecentlyAdded();
  });

  function getRecentlyAdded() {
    $('ul.left-nav-menu li').removeClass('selected');
    $('.get_recent_songs').addClass('selected');
    resetPanel('Recently Added Songs', 'scrollBoxHeight1');
    $('#filelist').html('<div class="loading-screen"><svg class="spinner" width="65px" height="65px" viewBox="0 0 66 66" xmlns="http://www.w3.org/2000/svg"><circle class="spinner-path" fill="none" stroke-width="6" stroke-linecap="round" cx="33" cy="33" r="30"></circle></svg></div>');
    $('.directoryName').html('Get last &nbsp;&nbsp;<input id="recently-added-limit" class="recently-added-input" type="number" min="1" step="1" value="100">&nbsp;&nbsp; songs');
    
    redoRecentlyAdded();
  }

  function redoRecentlyAdded() {
    currentBrowsingList = [];

    programState = [{
      state: 'recentlyAdded'
    }];

    MSTREAMAPI.getRecentlyAdded($('#recently-added-limit').val(), function (response, error) {
      if (error !== false) {
        $('#filelist').html('<div>Server call failed</div>');
        return boilerplateFailure(response, error);
      }

      //parse through the json array and make an array of corresponding divs
      var filelist = [];
      $.each(response, function () {
        if (this.metadata.title) {
          currentBrowsingList.push({ type: 'file', name: this.metadata.artist + ' - ' + this.metadata.title })
          filelist.push('<div data-file_location="' + this.filepath + '" class="filez"><img class="music-image" src="/public/img/music-note.svg"> <span class="title">' + this.metadata.artist + ' - ' + this.metadata.title + '</span></div>');
        } else {
          currentBrowsingList.push({ type: 'file', name: this.metadata.filename })
          filelist.push('<div data-file_location="' + this.filepath + '" class="filez"><img class="music-image" src="/public/img/music-note.svg"> <span class="title">' + this.metadata.filename + '</span></div>');
        }
      });

      $('#filelist').html(filelist);
    });
  }

  ////////////////////////////////////  Sort by Albums
  //Load up album explorer
  $('.get_all_albums').on('click', function () {
    getAllAlbums();
  });

  function getAllAlbums() {
    $('ul.left-nav-menu li').removeClass('selected');
    $('.get_all_albums').addClass('selected');
    resetPanel('Albums', 'scrollBoxHeight1');
    $('#filelist').html('<div class="loading-screen"><svg class="spinner" width="65px" height="65px" viewBox="0 0 66 66" xmlns="http://www.w3.org/2000/svg"><circle class="spinner-path" fill="none" stroke-width="6" stroke-linecap="round" cx="33" cy="33" r="30"></circle></svg></div>');
    currentBrowsingList = [];

    programState = [{
      state: 'allAlbums'
    }];

    MSTREAMAPI.albums(function (response, error) {
      if (error !== false) {
        $('#filelist').html('<div>Server call failed</div>');
        return boilerplateFailure(response, error);
      }

      //parse through the json array and make an array of corresponding divs
      var albums = [];
      $.each(response.albums, function (index, value) {
        if (value.album_art_file) {
          currentBrowsingList.push({ type: 'album', name: value.name, 'album_art_file': value.album_art_file });

          albums.push('<div data-album="' + value.name + '" class="albumz"><img class="album-art-box"  data-original="/album-art/' + value.album_art_file + '?token=' + MSTREAMAPI.currentServer.token + '"><span class="explorer-label-1">' + value.name + '</span></div>');
        } else {
          currentBrowsingList.push({ type: 'album', name: value.name });
          albums.push('<div data-album="' + value.name + '" class="albumz"><img class="album-art-box" src="/public/img/default.png"><span class="explorer-label-1">' + value.name + '</span></div>');
        }
      });

      $('#filelist').html(albums);
      // update linked list plugin
      ll.update();
    });
  }

  // Load up album-songs
  $("#filelist").on('click', '.albumz', function () {
    var album = $(this).data('album');
    getAlbumSongs(album);
  });

  function getAlbumSongs(album) {
    $('#search_folders').val('');
    $('.directoryName').html('Album: ' + album);
    //clear the list
    $('#filelist').html('<div class="loading-screen"><svg class="spinner" width="65px" height="65px" viewBox="0 0 66 66" xmlns="http://www.w3.org/2000/svg"><circle class="spinner-path" fill="none" stroke-width="6" stroke-linecap="round" cx="33" cy="33" r="30"></circle></svg></div>');
    currentBrowsingList = [];

    programState.push({
      state: 'album',
      name: album
    })

    MSTREAMAPI.albumSongs(album, function (response, error) {
      if (error !== false) {
        $('#filelist').html('<div>Server call failed</div>');
        return boilerplateFailure(response, error);
      }

      //parse through the json array and make an array of corresponding divs
      var filelist = [];
      $.each(response, function () {
        if (this.metadata.title) {
          currentBrowsingList.push({ type: 'file', name: this.metadata.title })
          filelist.push('<div data-file_location="' + this.filepath + '" class="filez"><img class="music-image" src="/public/img/music-note.svg"> <span class="title">' + this.metadata.title + '</span></div>');
        }
        else {
          currentBrowsingList.push({ type: 'file', name: this.metadata.filename })
          filelist.push('<div data-file_location="' + this.filepath + '" class="filez"><img class="music-image" src="/public/img/music-note.svg"> <span class="title">' + this.metadata.filename + '</span></div>');
        }
      });

      $('#filelist').html(filelist);
    });
  }

  /////////////////////////////////////// Artists
  $('.get_all_artists').on('click', function () {
    getAllArtists();
  });

  function getAllArtists() {
    $('ul.left-nav-menu li').removeClass('selected');
    $('.get_all_artists').addClass('selected');
    resetPanel('Artists', 'scrollBoxHeight1');
    $('#filelist').html('<div class="loading-screen"><svg class="spinner" width="65px" height="65px" viewBox="0 0 66 66" xmlns="http://www.w3.org/2000/svg"><circle class="spinner-path" fill="none" stroke-width="6" stroke-linecap="round" cx="33" cy="33" r="30"></circle></svg></div>');
    currentBrowsingList = [];

    programState = [{
      state: 'allArtists'
    }]

    MSTREAMAPI.artists(function (response, error) {
      if (error !== false) {
        $('#filelist').html('<div>Server call failed</div>');
        return boilerplateFailure(response, error);
      }

      //parse through the json array and make an array of corresponding divs
      var artists = [];
      $.each(response.artists, function (index, value) {
        artists.push('<div data-artist="' + value + '" class="artistz">' + value + ' </div>');
        currentBrowsingList.push({ type: 'artist', name: value });
      });

      $('#filelist').html(artists);
    });
  }


  $("#filelist").on('click', '.artistz', function () {
    var artist = $(this).data('artist');
    programState.push({
      state: 'artist',
      name: artist
    })
    getArtistsAlbums(artist)
  });

  function getArtistsAlbums(artist) {
    resetPanel('Albums', 'scrollBoxHeight1');
    $('.directoryName').html('Artist: ' + artist);
    $('#filelist').html('<div class="loading-screen"><svg class="spinner" width="65px" height="65px" viewBox="0 0 66 66" xmlns="http://www.w3.org/2000/svg"><circle class="spinner-path" fill="none" stroke-width="6" stroke-linecap="round" cx="33" cy="33" r="30"></circle></svg></div>');
    $('#search_folders').val('');
    currentBrowsingList = [];

    MSTREAMAPI.artistAlbums(artist, function (response, error) {
      if (error !== false) {
        $('#filelist').html('<div>Server call failed</div>');
        return boilerplateFailure(response, error);
      }

      var albums = [];
      $.each(response.albums, function (index, value) {
        if (value.album_art_file) {
          albums.push('<div data-album="' + value.name + '" class="albumz"><img class="album-art-box"  data-original="/album-art/' + value.album_art_file + '?token=' + MSTREAMAPI.currentServer.token + '"><span class="explorer-label-1">' + value.name + '</span></div>');
        } else {
          albums.push('<div data-album="' + value.name + '" class="albumz"><img class="album-art-box" src="/public/img/default.png"><span class="explorer-label-1">' + value.name + '</span></div>');
        }
        currentBrowsingList.push({ type: 'album', name: value.name })
      });

      $('#filelist').html(albums);
      // update linked list plugin      
      ll.update();
    });
  }

  $('.get_rated_songs').on('click', function () {
    getRatedSongs();
  });
  function getRatedSongs() {
    $('ul.left-nav-menu li').removeClass('selected');
    $('.get_rated_songs').addClass('selected');
    resetPanel('Starred', 'scrollBoxHeight1');
    $('#filelist').html('<div class="loading-screen"><svg class="spinner" width="65px" height="65px" viewBox="0 0 66 66" xmlns="http://www.w3.org/2000/svg"><circle class="spinner-path" fill="none" stroke-width="6" stroke-linecap="round" cx="33" cy="33" r="30"></circle></svg></div>');
    $('#search_folders').val('');
    currentBrowsingList = [];

    programState = [{
      state: 'allRated'
    }]

    MSTREAMAPI.getRated(function (response, error) {
      if (error !== false) {
        $('#filelist').html('<div>Server call failed</div>');
        return boilerplateFailure(response, error);
      }

      //parse through the json array and make an array of corresponding divs
      var files = [];
      $.each(response, function (index, value) {
        var rating = (value.metadata.rating / 2);
        if (!Number.isInteger(rating)) {
          rating = rating.toFixed(1);
        }

        if (!value.metadata || !value.metadata.title) {
          currentBrowsingList.push({ type: 'file', name: value.filepath, metadata: value.metadata });
          files.push('<div data-file_location="' + value.filepath + '" class="filez"><img class="album-art-box" src="/public/img/default.png"><span class="explorer-label-1">[' + rating + '] ' + value.filepath + ']</span></div>');
        } else if (value.metadata['album-art']) {
          currentBrowsingList.push({ type: 'file', name: value.metadata.artist + ' - ' + value.metadata.title, metadata: value.metadata });
          files.push('<div data-file_location="' + value.filepath + '" class="filez"><img class="album-art-box"  data-original="/album-art/' + value.metadata['album-art'] + '?token=' + MSTREAMAPI.currentServer.token + '"><span class="explorer-label-1">[' + rating + '] ' + value.metadata.artist + ' - ' + value.metadata.title + '</span></div>');
        } else {
          currentBrowsingList.push({ type: 'file', name: value.metadata.artist + ' - ' + value.metadata.title, metadata: value.metadata });
          files.push('<div data-file_location="' + value.filepath + '" class="filez"><img class="album-art-box" src="/public/img/default.png"><span class="explorer-label-1">[' + rating + '] ' + value.metadata.artist + ' - ' + value.metadata.title + '</span></div>');
        }
      });

      $('#filelist').html(files);
      // update linked list plugin
      ll.update();
    });
  }


  //////////////////////// Jukebox Mode
  function setupJukeboxPanel() {
    $('ul.left-nav-menu li').removeClass('selected');
    $('.jukebox_mode').addClass('selected');
    // Hide the directory bar
    resetPanel('Jukebox Mode', 'scrollBoxHeight2');
    currentBrowsingList = [];
    $('#directory_bar').hide();

    var newHtml;
    if (JUKEBOX.stats.live !== false && JUKEBOX.connection !== false) {
      newHtml = createJukeboxPanel();
    } else {
      newHtml = '\
        <p class="jukebox-panel">\
        <br><br>\
        <h3>Jukebox Mode allows you to control this page remotely<h3> <br><br>\
        <input value="Connect" type="button" class="jukebox_connect">\
        </p>\
        <img src="/public/img/loading.gif" class="hide jukebox-loading">';
    }

    // Add the content
    $('#filelist').html(newHtml);
  }

  // The jukebox panel
  $('.jukebox_mode').on('click', function () {
    setupJukeboxPanel();
  });

  $('body').on('click', '.remote-button', function () {
    setupJukeboxPanel();
  });

  // Setup Jukebox
  $('body').on('click', '.jukebox_connect', function () {
    $(this).prop("disabled", true);
    $(this).hide();
    $('.jukebox-loading').toggleClass('hide');

    JUKEBOX.createWebsocket(MSTREAMAPI.currentServer.token, false, function () {
      // Wait a while and display the status
      setTimeout(function () {
        setupJukeboxPanel();
      }, 1800);
    });
  });

  function createJukeboxPanel() {
    var returnHtml = '<div class="jukebox-panel autoselect">';

    if (JUKEBOX.stats.error !== false) {
      return returnHtml + 'An error occurred.  Please refresh the page and try again</p>';
    }

    if (JUKEBOX.stats.adminCode) {
      returnHtml += '<h1>Code: ' + JUKEBOX.stats.adminCode + '</h1>';
    }
    if (JUKEBOX.stats.guestCode) {
      returnHtml += '<h2>Guest Code: ' + JUKEBOX.stats.guestCode + '</h2>';
    }

    var adrs = window.location.protocol + '//' + window.location.host + '/remote';
    returnHtml += '<br><h4>Remote Jukebox Controls: <a target="_blank" href="' + adrs + '"> ' + adrs + '</a><h4>';

    return returnHtml + '</div>';
  }

  // Setup jukebox if URL
  var urlPath = window.location.pathname;
  var uuid = urlPath.split("/").pop();

  var urlParams = new URLSearchParams(window.location.search);
  var queryParm = urlParams.get('code');

  myParam = uuid || queryParm || false;
  if(myParam) {
    JUKEBOX.createWebsocket(MSTREAMAPI.currentServer.token, myParam, function () {
      iziToast.success({
        title: 'Jukebox Connected',
        position: 'topCenter',
        message: 'Code: ' + myParam,
        timeout: 3500
      });
    });

    JUKEBOX.setAutoConnect(myParam);
  }
});
