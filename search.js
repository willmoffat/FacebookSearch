$(function() {

  
  
  var examples = shuffle(["cheated test", '"don\'t tell anyone"', "rectal exam", "control urges", '"lost my virginity"', "playing hooky", '"dna test"', '"divorce trial"', "professor asshole", '"going to a strip club"', '"boss is an asshole"', '"my dui"', '"I hate my boss"', '"I hate my job"', '"Having a wank"', '"i\'m not racist but"']);
  
  var params={
    q:  examples[0],  // query str
    gender:  'any',   // male female any
    maxlen:  500,     // max message len
    classy: false     // don't hide profile pics, names, links
  };
  document.location.search.replace(/[?&]([^&=]+)=([^&]+)/g,function(_,key,val) { params[key]=decodeURIComponent(val).replace(/\+/g,' '); });
   
  function hide(name)   { return params.classy ? name.replace(/[a-z]/g,'-') : name; } // just show initials unless in asehole mode
  function encode(text) { return text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');  }
  function gender_img(gender) {
    if (!gender) { return ''; }
    return '<img class="gender" src="images/'+gender+'.png" />';
  }
  function highlight(q,text) {
    q = q.replace(/^\s+|\s+$/g,'')                       // whitespace trim
         .replace(/\"/g,'')                              // remove quote marks
         .replace(/[\/\.\*\+\?\|\(\)\[\]\{\}\\]/g,'\$&') // escape regexp chars
         .replace(/\s+/gi,'|');                          // seperate words with |
    var re = new RegExp('\\b('+ q + ')\\b', 'gi');
    return text.replace(re,'<b>$&</b>');
  }
  
  var ROW_HTML=['',
  '<div class="update ~ROWCLASS~">',
  '  <div class="person">',
  '    <a href="http://www.facebook.com/profile.php?id=~ID~&v=wall" target="_blank"><div class="black"/><img src="http://graph.facebook.com/~ID~/picture?type=large"/></a>',
  '  </div>',
  '<div class="msg">',
  '  <p>~SEX~ <b><a href="http://www.facebook.com/profile.php?id=~ID~&v=wall" target="_blank">~NAME~</a></b>',
  '  ~MSG~ </p>',
  ' <span class="msg-metadata">~TIME~ ~FROM~</span>',
  '</div>',
  '</div>'].join('\n');
  if (params.classy) { ROW_HTML = ROW_HTML.replace(/<\/?a.+?>/g,''); }

  function gender2class(gender) { return 'gender-'+(gender || 'any'); }

  var opposite = {male: "female", female: "male"};
  function update_gender(gender) {
    var classes = [];
    $("input:checkbox[checked]").each(function(_, box) {
      classes.push('show-' + gender2class($(box).val()));
    })
    
    $("#results").attr("class", classes.join(" "));
  }
  
  $('#q').attr('value',params.q);
  $('input:checkbox[value='+params.gender+']').attr('checked',true); update_gender(params.gender);
  $('input:checkbox').click(update_gender);
  if (!params.classy) {
    $('body').addClass('asshole');
  } else {
    $('.black').live('mouseover mouseout', function(event) { $('#explain').toggle( event.type === 'mouseover' ); });
  }

  $.getJSON("http://popular.youropenbook.org:8000/?q=" + $("#q").val() + "&callback=?", function(response) {
    setExamples(response.latest, "#latest");
    $("#latest").show();
  })

  function setExamples(examples, location) {
    $.each(examples,function(_,example){ $('<a>',{href:'?q='+encodeURIComponent(example),text:example}).appendTo(location); });
  }

  
  function loadMore() {
    var page_remaining = $(document).height() - ($(window).height() + $(window).scrollTop());
    if  (page_remaining < 1000){
      fetchNextPage();
    }
  }
  $(window).scroll(loadMore);

  var nextPage = false;
  function fetchNextPage() {
    if (nextPage) {
      $.getJSON(nextPage + "&callback=?", handleSearchResults);
      nextPage = false;
    }
  }

  $.getJSON( 'http://graph.facebook.com/search?callback=?', {'q':params.q, 'type':'post'}, handleSearchResults);

  function body(post) {
    var body = $.map(['message','caption','description','name'],function(prop) {return post[prop] || '';}).join(' ');
    if (body.length > params.maxlen) {
      body = body.slice(0,params.maxlen-3) + '...';
    }
    body = encode(body);
    return highlight( params.q, body );
  }
  function handleSearchResults(response, textStatus) {
    //console.warn(response);

    if (response.paging && response.paging.next) {
      nextPage = response.paging.next;
      loadMore();
    } else {
      $(".waitloading").hide();
      $('#finished').show();
    }
    $.each(response.data,function(_,post) {
      if (!post || !post.from || !post.from.id) { return; } //TODO: when does this happen?
      if (post.from && post.from.category) {
        //not a user, probably not interesting
        return;
      }
      $.getJSON("http://graph.facebook.com/" + post.from.id + "?callback=?", function(user) {
        var classname =  gender2class(user.gender);
        var html = ROW_HTML
        .replace(/~ROWCLASS~/g, classname)
        .replace(/~ID~/g,  post.from.id)
        .replace(/~NAME~/g,hide(post.from.name))
        .replace(/~SEX~/g, gender_img(user.gender))
        .replace(/~TIME~/g,window.get_relative_timestamp(post.created_time))
        .replace(/~FROM~/g,(user.location && user.location.name) || '')
        .replace(/~MSG~/g, body(post));  // MUST BE LAST
        $(html).appendTo($('#results'));
      });
    });
  }

  window.get_relative_timestamp = function(timestamp) {
    var c = new Date();
    var t = window.iso2date(timestamp);

    var d = c.getTime() - t.getTime();
    var dY = Math.floor(d / (365 * 30 * 24 * 60 * 60 * 1000));
    var dM = Math.floor(d / (30 * 24 * 60 * 60 * 1000));
    var dD = Math.floor(d / (24 * 60 * 60 * 1000));
    var dH = Math.floor(d / (60 * 60 * 1000));
    var dN = Math.floor(d / (60 * 1000));

    if (dY > 0)   { return dY === 1? "1 year ago"   : dY + " years ago"; }
    if (dM > 0)   { return dM === 1? "1 month ago"  : dM + " months ago"; }
    if (dD > 0)   { return dD === 1? "1 day ago"    : dD + " days ago"; }
    if (dH > 0)   { return dH === 1? "1 hour ago"   : dH + " hours ago"; }
    if (dN > 0)   { return dN === 1? "1 minute ago" : dN + " minutes ago"; }
    if (dN === 0)  { return "less than a minute ago"; }
    if (dN < 0)   { return "in the future???"; }
  };

  // from http://delete.me.uk/2005/03/iso8601.html
  window.iso2date = function(string) {
    var regexp = "([0-9]{4})(-([0-9]{2})(-([0-9]{2})" +
    "(T([0-9]{2}):([0-9]{2})(:([0-9]{2})(\.([0-9]+))?)?" +
    "(Z|(([-+])([0-9]{2}):([0-9]{2})))?)?)?)?";
    var d = string.match(new RegExp(regexp));

    var offset = 0;
    var date = new Date(d[1], 0, 1);

    if (d[3]) { date.setMonth(d[3] - 1); }
    if (d[5]) { date.setDate(d[5]); }
    if (d[7]) { date.setHours(d[7]); }
    if (d[8]) { date.setMinutes(d[8]); }
    if (d[10]) { date.setSeconds(d[10]); }
    if (d[12]) { date.setMilliseconds(Number("0." + d[12]) * 1000); }
    if (d[14]) {
      offset = (Number(d[16]) * 60) + Number(d[17]);
      offset *= ((d[15] == '-') ? 1 : -1);
    }

    offset -= date.getTimezoneOffset();
    var time = (Number(date) + (offset * 60 * 1000));
    var result = new Date();
    result.setTime(Number(time));
    return result;
  };

  function shuffle(arr) {
    for (var i = 1; i < arr.length; i++) {
      var target = Math.round((Math.random() * i));
      var tmp = arr[target];
      arr[target] = arr[i];
      arr[i] = tmp;
    }
    return arr;
  }
});