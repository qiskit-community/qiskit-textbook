#!/bin/bash

in_blacklist () {
	file=$1
	for item in $blacklist;
	do
		if [[ $file == *"$item" ]]; then
			return 0
		fi
	done
	return 1
}

gen_html () {
	#jt -t grade3
    jt -r
	find ch* -name "*.ipynb" -print0 | while IFS= read -r -d '' file
	do
		if ! in_blacklist "$file" ; then
			jupyter nbconvert --to html "$file"
		fi
	done
	jupyter nbconvert --to html index.ipynb
}

cp_to () {
	target=$1
	# Copy HTML
	find ch* -name '*.html' | cpio -pdm $target
	cp index.html $target
	# Copy image folders
	find ch*/images/* | cpio -pdm $target
}

add_analytics () {
	analytics_snippet=$(<analytics.html.part)
	# escape the multi-line string to be used as a replacement string in SED
	# https://stackoverflow.com/questions/29613304/is-it-possible-to-escape-regex-metacharacters-reliably-with-sed
	IFS= read -d '' -r < <(sed -e ':a' -e '$!{N;ba' -e '}' -e 's/[&/\]/\\&/g; s/\n/\\&/g' <<<"$analytics_snippet")
	analytics_snippet_escaped=${REPLY%$'\n'}
	find $1 -name '*.html' -exec sed -i '' -e "s#</head>#${analytics_snippet_escaped}</head>#" {} \;
}

main () {
	gen_html
	mkdir -p _build
	cp_to _build
	add_analytics _build
}

main
