#!/bin/bash
url="$1"
max_retries=10
count=1
while [[ "$count" -le "$max_retries" ]]; do
  # Use curl to check if the server responds.
  status_code=$(curl --write-out "%{http_code}" --silent --output /dev/null "$url")
  # If server responds with a successful or redirect HTTP status, it's up.
  if [[ "$status_code" -ge 200 && "$status_code" -lt 400 ]]; then
    echo "Server is up"
    exit 0
  fi
  echo "Server is not up. Retry $count/$max_retries ..."
  count=$((count + 1))
  sleep 5
done
echo "Server did not start within the expected period."
exit 1

