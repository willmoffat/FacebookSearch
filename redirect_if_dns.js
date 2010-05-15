if (/willmoffat\.github\.com/.test(window.location.host)) {
    setTimeout(function() {
      window.location = "http://youropenbook.org/" + (window.location.search || "");
    }, 1000)
}
    