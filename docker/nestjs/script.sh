# #!/bin/bash

set -e
set -x

mkdir -p images

npm install
exec npm run start:dev