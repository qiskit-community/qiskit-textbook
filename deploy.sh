#!/bin/bash

user=delapuente
org=qiskit-community
repo=community.qiskit.org

download_repo () {
  root=$1
  mkdir -p $root
  cd $root
  git clone --depth 1 "https://${user}:${GITHUB_TOKEN}@github.com/${org}/${repo}.git"
  cd -
}

push_repo () {
  root=$1
  cd $root/$repo
  git add static/textbook
  git commit -am"Updating textbook to ${TRAVIS_REPO_SLUG}@${TRAVIS_COMMIT}"
  git push origin master
  cd -
}

main () {
  download_repo _repo
  mkdir -p _repo/$repo/static/textbook
  rsync -r --delete _build/ _repo/$repo/static/textbook
  push_repo _repo
}

main
