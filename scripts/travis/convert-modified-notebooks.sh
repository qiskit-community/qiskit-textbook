#!/bin/bash

convert_changed_in_commit () {
  CHANGED_FILES=$(git --no-pager diff --name-only $1)
  for file in $CHANGED_FILES; do
    extension=${file##*.}
    if [ "$extension" == "ipynb" ]; then
      jupyter nbconvert --to rst "$file"
    fi
  done
}

convert_changed_in_commit $1