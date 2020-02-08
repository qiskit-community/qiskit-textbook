#!/usr/bin/env bash

set -x
set -e
set -o pipefail

# Add last qiskit version to the requirements file. This is necessary to avoid problems with the docker cache.
QISKIT_VERSION=$(curl -s 'https://pypi.org/pypi/qiskit/json' | jq '.info.version' -r)
sed -i -e "s/qiskit/qiskit==${QISKIT_VERSION}/g" requirements.txt

if [ "$TRAVIS_PULL_REQUEST" != "false" ]; then
  dploy env:set --release pr-$TRAVIS_PULL_REQUEST_BRANCH ELASTIC_INDEX=documentation-pr-$TRAVIS_PULL_REQUEST_BRANCH;
  dploy up --pr-message "🚀 Latest deployment for this branch: \$url" --build-arg BASE_URL="https://sw-iqx-documentation-pr-${TRAVIS_PULL_REQUEST_BRANCH}.mybluemix.net"
else
  dploy up --pr-message '🚀 Latest deployment for this branch: $url'
fi;

# Delete old elastic indexes
npm install
npm install @quantum/dploy
NODE_TLS_REJECT_UNAUTHORIZED=0 node travis/delete-old-elastic-indexes.js

# Delete running application
dploy down --deleted-branches
