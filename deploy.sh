#!/bin/bash

path=textbook

CURRENT_BRANCH=${GITHUB_BRANCH##*/}

if [[ $CURRENT_BRANCH != "stable" ]] && [[ $CURRENT_BRANCH != "" ]]
then
    path="${path}-${CURRENT_BRANCH}"
fi

install_rclone () {
  curl https://downloads.rclone.org/rclone-current-linux-amd64.deb -o rclone.deb
  sudo apt-get install -y ./rclone.deb
  CONFIG_PATH=$(rclone config file | tail -1)
  echo "Decrypting config into ${CONFIG_PATH}"
  openssl aes-256-cbc -K $encrypted_rclone_key -iv $encrypted_rclone_iv -in rclone.conf.enc -out $CONFIG_PATH -d
}

main () {
  echo "Updating ${path} to ${GITHUB_REPOSITORY}@${GITHUB_SHA}"
  install_rclone
  rclone sync _site/ IBMCOS:qiskit-org-web-resources/${path}
}

main
