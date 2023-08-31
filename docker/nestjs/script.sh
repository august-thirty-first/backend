# #!/bin/bash

set -e
set -x

mkdir -p images

npm install
npm run typeorm migration:run
exec npm run start:dev