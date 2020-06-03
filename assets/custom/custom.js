const prepopulateSearchInput = () => {
	// This fills in the search input with the query in the url
	var urlSubString = window.location.search.substring(1);
	var escapedSearchString = urlSubString.split('=')[1];
	if (escapedSearchString !== undefined) {
		var searchString = unescape(escapedSearchString.replace("+", " "));
		var searchInput = document.getElementById('lunr_search');
		if (searchInput !== null) {
		searchInput.value = searchString;
		};
	};
}

//initFunction(prepopulateSearchInput);

/*window.onload = function() {
	// Sets focus to search input and simulates keyup to trigger search
	const searchInput = document.getElementById("lunr_search");
	if (searchInput !== null) {
		searchInput.focus();
		// simulate pressing enter to trigger search
		var enterEvent = document.createEvent('Event');
		enterEvent.initEvent('keyup');
		searchInput.dispatchEvent(enterEvent);
	};
};*/

