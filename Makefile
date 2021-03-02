.PHONY: help book clean serve

BUILD_DIR := "./_build"
# space delimited list of available languages, e.g., LOCALES:=ja es pt
LOCALES:=ja

help:
	@echo "Please use 'make <target>' where <target> is one of:"
	@echo "  install     to install the necessary dependencies for jupyter-book to build"
	@echo "  book        to convert the content/ folder into Jekyll markdown in _build/"
	@echo "  clean       to clean out site build files"
	@echo "  runall      to run all notebooks in-place, capturing outputs with the notebook"
	@echo "  serve       to serve the repository locally with Jekyll"
	@echo "  build       to build the site HTML and store in _site/"
	@echo "  site        to build the site HTML, store in _site/, and serve with Jekyll"


install:
	jupyter-book install ./

book:
	jupyter-book build ./
	python3 scripts/create_redirections.py $(BUILD_DIR)
	python3 scripts/postprocess_html.py $(BUILD_DIR)

	for l in $(LOCALES); \
	do \
		$(call BUILD_LOCALE_BOOK,$$l); \
	done

runall:
	jupyter-book run ./content

clean:
	python scripts/clean.py

serve:
	bundle exec guard

build:
	jupyter-book build ./ --overwrite
	python3 scripts/create_redirections.py $(BUILD_DIR)
	python3 scripts/postprocess_html.py $(BUILD_DIR)

	for l in $(LOCALES); \
	do \
		$(call BUILD_LOCALE_BOOK,$$l,--overwrite); \
	done

site: build
	bundle exec jekyll build
	touch _site/.nojekyll

define BUILD_LOCALE_BOOK
	echo "Building '$1' book" && \
	jupyter-book build --config ./i18n/config.i18n.yml --toc ./_data/$1/toc.yml ./ $2 && \
	python3 scripts/create_redirections.py $(BUILD_DIR)/$1 && \
	python3 scripts/postprocess_html.py $(BUILD_DIR)/$1
endef
