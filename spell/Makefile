spell:
	ln -sf ../content .
	sphinx-build -W -b spelling . _build/
	grep --color "the the " content/**/*.ipynb
	grep --color " a the " content/**/*.ipynb
	grep --color "the a " content/**/*.ipynb
