$(function() {
  var examples = ["playing hooky", "don't tell anyone", "rectal exam", "stupid boss", "HIV test", "control urges"];
  
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
         .replace(/[\/\.\*\+\?\|\(\)\[\]\{\}\\]/g,'\$&') // escape regexp chars
         .replace(/\s+/gi,'|');                          // seperate words with |
    var re = new RegExp('\\b('+ q + ')\\b', 'gi');
    return text.replace(re,'<b>$&</b>');
  }
  
  var ROW_HTML=['',
  '<tr class="ROWCLASS">',
  '  <td class="person">',
  '    <a href="http://www.facebook.com/profile.php?id=ID&v=wall" target="_blank"><div class="profile"><div class="black"/><img src="http://graph.facebook.com/ID/picture?type=large"/></div></a>',
  '  </td>',
  '<td class="msg">',
  '  SEX <a href="http://www.facebook.com/profile.php?id=ID&v=wall" target="_blank">NAME</a>',
  '  FROM <p><q>MSG</q></q>',
  '</td>',
  '</tr>'].join('\n');
  if (params.classy) { ROW_HTML = ROW_HTML.replace(/<\/?a.+?>/g,''); }

  function gender2class(gender) { return 'gender-'+(gender || 'any'); }

  function update_gender(gender) {
    $('table').attr('class','only-'+gender2class(gender));
  }
  
  $('#q').attr('value',params.q);
  $('input:radio[value='+params.gender+']').attr('checked',true); update_gender(params.gender);
  $('input:radio').click(function() { update_gender($(this).val()); });
  if (!params.classy) {
    $('body').addClass('asshole');
  } else {
    $('.black').live('mouseover mouseout', function(event) { $('#explain').toggle( event.type === 'mouseover' ); });
  }
  
  $.each(examples,function(_,example){ $('<a>',{href:'?q='+encodeURIComponent(example),text:example}).appendTo($('#examples')); });
  
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
      $.getJSON("http://graph.facebook.com/" + post.from.id + "?callback=?", function(user) {
        var classname =  gender2class(user.gender);
        var body = post.message + " " + (post.caption || "") +" " + (post.description || "") + " " +(post.name || "");
        if (body.length > params.maxlen) {
            body = body.slice(0,params.maxlen-3) + '...';
        }
        var html = ROW_HTML
        .replace(/ROWCLASS/g, classname)
        .replace(/ID/g,  post.from.id)
        .replace(/NAME/g,hide(post.from.name))
        .replace(/MSG/g, highlight(params.q,encode(body)))
        .replace(/SEX/g, gender_img(user.gender))
        .replace(/FROM/g,(user.location && user.location.name) || '');
        $(html).appendTo($('table'));
      });
    });
  }
});