#!/bin/bash

user=delapuente
org=qiskit-community
repo=community.qiskit.org
path=textbook

if [[ $TRAVIS_BRANCH != "stable" ]] && [[ $TRAVIS_BRANCH != "" ]]
then
    path="${path}-${TRAVIS_BRANCH}"
fi

bundle exec jekyll build --baseurl "${path}" 
touch _site/.nojekyll
