#!/bin/sh

setup_git() {
  git config --global user.email "travis@travis-ci.org"
  git config --global user.name "Travis CI"
}

commit_rst_files() {
  git checkout "$1"
  git add documentation/\*.rst
  git commit --message "Update RST files [skip ci]: $TRAVIS_BUILD_NUMBER"
}

upload_files() {
  git remote add upstream https://${GITHUB_TOKEN}@github.com/qiskit/qiskit-textbook.git > /dev/null 2>&1
  git push upstream "$1"
}

setup_git
commit_rst_files $1
upload_files $1
