#!/bin/bash

user=delapuente
org=qiskit-community
repo=community.qiskit.org

download_repo () {
  root=$1
  mkdir -p $root
  pushd $root || return
  git clone --depth 1 "https://${user}:${GITHUB_TOKEN}@github.com/${org}/${repo}.git"
  popd || return
}

push_repo () {
  root=$1
  pushd $root/$repo || return
  git add static/textbook
  git add .
  git commit -m"Updating textbook to ${TRAVIS_REPO_SLUG}@${TRAVIS_COMMIT}"
  git push origin master
  popd || return
}

main () {
  download_repo _repo
  mkdir -p _repo/$repo/static/textbook
  rsync -r --delete _site/ _repo/$repo/static/textbook
  push_repo _repo
}

main
