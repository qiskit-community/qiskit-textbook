#!/bin/bash

convert_changed_in_commit () {
  CHANGED_FILES=$(git --no-pager diff --name-only $1)
  for file in $CHANGED_FILES; do
    extension=${file##*.}
    if [ "$extension" == "ipynb" ]; then
      python3 "$THIS_DIR/../conversion/ipynb2rst.py" "$file"
    fi
  done
}

THIS_DIR=$(dirname $(realpath $0))

convert_changed_in_commit $1