const injectIntoSidebar = () => {
       // This is a hack to place the buttons / search on the right sidebar
       // it is intended to be temporary until someone more knowledgeable than
       // me can do things properly.
       const sidebar = document.querySelector('aside.sidebar__right');
       const sidebarHeader = document.querySelector('aside.sidebar__right > header');
       sidebarHeader.innerHTML = `
	<form action="/textbook/search.html" method="GET">
		<button type="submit" id="submit">
			<img src="/textbook/assets/images/search-solid.svg" alt="Search">
		</button>
		<input type="text" id="siderbar-search-input" name="search">
	</form>
	<h2>On This Page</h2>
       `;
       // Inject IQX Button and notebook download link
       var buttonHTML = '<a href="https://quantum-computing.ibm.com/jupyter/user/qiskit-textbook/content/';
       const currentPath = window.location.pathname;
       const contentPath = currentPath.slice(10);
       const notebookPath = contentPath.replace(/\.html$/, '.ipynb');
       buttonHTML += notebookPath;
       buttonHTML += '" target="_blank"><button class="interact-button" id="interact-button-binder">';
       buttonHTML += 'Open in IBM Quantum Experience</button></a>';
       var linkHTML = '<a href="/textbook/content/' + notebookPath + '" class="download__link"> Download as Jupyter Notebook'
       linkHTML += '<img src="/textbook/assets/images/download-solid.svg" class="download-button"></a>'
       buttonElement = document.createElement('div');
       buttonElement.innerHTML = buttonHTML;
       dlLinkElement = document.createElement('div');
       dlLinkElement.innerHTML = linkHTML;
       sidebar.appendChild(buttonElement);
       sidebar.appendChild(dlLinkElement);
}

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

initFunction(injectIntoSidebar);
initFunction(prepopulateSearchInput);

window.onload = function() {
	// Sets focus to search input and simulates keyup to trigger search
	const searchInput = document.getElementById("lunr_search");
	if (searchInput !== null) {
		searchInput.focus();
		// simulate pressing enter to trigger search
		var enterEvent = document.createEvent('Event');
		enterEvent.initEvent('keyup');
		searchInput.dispatchEvent(enterEvent);
	};
};

