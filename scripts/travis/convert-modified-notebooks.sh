#!/bin/bash

convert_changed_in_commit () {
  CHANGED_FILES=($(git diff --name-only $1))
  for file in $CHANGED_FILES; do
    extension = ${file##*.}
    if [ "$extension" == ".ipynb" ]; then
      echo "Converting $file..."
      jupyter nbconvert --to rst "$file"
    fi
  done
}

convert_changed_in_commit $1