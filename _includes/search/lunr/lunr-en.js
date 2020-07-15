var initQuery = function() {
  // See if we have a search box
  var searchInput = document.querySelector('input#lunr_search');
  if (searchInput === null) {
    return;
  }

  // Function to parse our lunr cache
  var idx = lunr(function () {
    this.field('title')
    this.field('excerpt')
    this.field('categories')
    this.field('tags')
    this.ref('id')

    this.pipeline.remove(lunr.trimmer)

    for (var item in store) {
      this.add({
        title: store[item].title,
        excerpt: store[item].excerpt,
        categories: store[item].categories,
        tags: store[item].tags,
        id: item
      })
    }
  });

  // Run search upon keyup
  searchInput.addEventListener('keyup', function () {
    var resultdiv = document.querySelector('#results');
    var query = document.querySelector("input#lunr_search").value.toLowerCase();
    var result =
      idx.query(function (q) {
        query.split(lunr.tokenizer.separator).forEach(function (term) {
          q.term(term, { boost: 100 })
          if(query.lastIndexOf(" ") != query.length-1){
            q.term(term, {  usePipeline: false, wildcard: lunr.Query.wildcard.TRAILING, boost: 10 })
          }
          if (term != ""){
            q.term(term, {  usePipeline: false, editDistance: 1, boost: 1 })
          }
        })
      });

      // Empty the results div
      while (resultdiv.firstChild) {
        resultdiv.removeChild(resultdiv.firstChild);
      }

    resultdiv.insertAdjacentHTML('afterbegin', '<p class="results__found">'+result.length+' Result(s) found</p>');
    for (var item in result) {
      var ref = result[item].ref;
      if(store[ref].teaser){
        var searchitem =
          '<div class="list__item">'+
            '<article class="archive__item" itemscope itemtype="https://schema.org/CreativeWork">'+
              '<h2 class="archive__item-title" itemprop="headline">'+
                '<a href="'+store[ref].url+'" rel="permalink">'+store[ref].title+'</a>'+
              '</h2>'+
              '<div class="archive__item-teaser">'+
                '<img src="'+store[ref].teaser+'" alt="">'+
              '</div>'+
              '<p class="archive__item-excerpt" itemprop="description">'+store[ref].excerpt.split(" ").splice(0,20).join(" ")+'...</p>'+
            '</article>'+
          '</div>';
      }
      else{
    	  var searchitem =
          '<div class="list__item">'+
            '<article class="archive__item" itemscope itemtype="https://schema.org/CreativeWork">'+
              '<h2 class="archive__item-title" itemprop="headline">'+
                '<a href="'+store[ref].url+'" rel="permalink">'+store[ref].title+'</a>'+
              '</h2>'+
              '<p class="archive__item-excerpt" itemprop="description">'+store[ref].excerpt.split(" ").splice(0,20).join(" ")+'...</p>'+
            '</article>'+
          '</div>';
      }
      resultdiv.insertAdjacentHTML('beforeend', searchitem);
    }
  });
};

// Fills in the search input with the query in the url
var prepopulateSearchInput = function () {
  var searchInput = document.getElementById('lunr_search');
  if (!searchInput) { return }

  var params = new URLSearchParams(window.location.search)
  var searchValue = params.get('search')
  if (!searchValue) { return }
  searchInput.value = searchValue.trim()
}

// Simulate a 'keyup' event to trigger a search
var triggerSearch = function () {
  var searchInput = document.getElementById('lunr_search');
  if (!searchInput || !searchInput.value.trim()) { return }

  searchInput.focus();
  var enterEvent = document.createEvent('Event');
  enterEvent.initEvent('keyup');
  searchInput.dispatchEvent(enterEvent);
}

initFunction(prepopulateSearchInput)

loadAsyncScript('https://cdnjs.cloudflare.com/ajax/libs/lunr.js/2.3.6/lunr.min.js')
.then(() => {
  initFunction(initQuery)
  initFunction(triggerSearch)
})
.catch((err) => console.error('Cannot load lunr search engine:', err))
