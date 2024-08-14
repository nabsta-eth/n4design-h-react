#!/bin/bash
pnpm start &
./wait-for-server.sh http://localhost:3000
