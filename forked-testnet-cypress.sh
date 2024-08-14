#!/bin/bash
echo "VITE_USE_LOCAL_FORKED_CHAIN=TRUE" >> .env
yarn hh:node &
yarn start &
./wait-for-server.sh http://localhost:3000
