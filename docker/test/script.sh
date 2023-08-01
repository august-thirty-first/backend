# #!/bin/bash

set -e
set -x

mkdir -p images

npm ci
exec npm run test
