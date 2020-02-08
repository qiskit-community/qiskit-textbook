#!/usr/bin/env bash

#set -x
set -e
set -o pipefail

EXTERNAL=false
CLEAN=false
HELP=false

while [[ $# -gt 0 ]]
do
key="$1"
case $key in
    -h|--help)
    HELP=true
    shift
    ;;
    -e|--external)
    EXTERNAL=true
    shift
    ;;
    -c|--clean)
    CLEAN=true
    shift
    ;;
    *) # unknown option
    shift
    ;;
esac
done

if $HELP; then
  cat << EndOfMessage

Usage:
  ./$(basename "$0") [--help] [--clean --external]

Options:
  --help  : show help
  --clean : make a clean build
  --external : enable external documentation repositories

EndOfMessage
  exit 0
fi

if $CLEAN; then
  echo "Cleaning dist folder"
  rm -rf dist
  docker-compose rm -v -f -s
fi

if $EXTERNAL; then
  git submodule update --init
  rm -f documentation/qiskit
  ln -s ../external/qiskit/docs documentation/qiskit
else
  rm -rf documentation/api
  rm -f documentation/qiskit
fi

docker-compose build
docker-compose up
