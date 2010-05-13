$(function() {
  var q = decodeURIComponent(document.location.search.split(/=/)[1] || 'toothache').replace(/\+/g,' ');
  
  function encode(text) { return text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');  }
  function gender_img(gender) {
    if (!gender) { return ''; }
    return '<img class="gender" src="images/'+gender+'.png" />';
  }
  function highlight(q,text) {
    var re = new RegExp('\\b'+ q.replace(/[^a-z0-9]+/gi,'|') + '\\b', 'g');
    return text.replace(re,'<b>$&</b>');
  }
  
  var ROW_HTML=['',
  '<tr>',
  '  <td class="person">',
  '    <a href="http://www.facebook.com/profile.php?id=ID&v=wall" target="_blank"><div class="profile"><img src="http://graph.facebook.com/ID/picture?type=large"/></div></a>',
  '  </td>',
  '<td class="msg">',
  '  SEX <a href="http://www.facebook.com/profile.php?id=ID&v=wall" target="_blank">NAME</a>',
  '  FROM <p><q>MSG</q></q>',
  '</td>',
  '</tr>'].join('\n');

  $('#q').attr('value',q);

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

  $.getJSON( 'http://graph.facebook.com/search?callback=?', {'q':q, 'type':'post'}, handleSearchResults);

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
      $.getJSON("http://graph.facebook.com/" + post.from.id + "?callback=?", function(user) {
        var html = ROW_HTML
        .replace(/ID/g,  post.from.id)
        .replace(/NAME/g,post.from.name)
        .replace(/MSG/g, highlight(q,encode(post.message||post.name||'')))
        .replace(/SEX/g, gender_img(user.gender))
        .replace(/FROM/g,(user.location && user.location.name) || '');
        $(html).appendTo($('table'));
      });
    });
  }
});