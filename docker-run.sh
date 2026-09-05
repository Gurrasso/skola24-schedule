docker run \
  -p 5000:5000 \
  --mount type=bind,source="$(pwd)/secrets/api_key_hash",target=/run/secrets/api_key_hash,readonly \
  -it skola24_schedule

