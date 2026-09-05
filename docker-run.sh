docker run -i \
  -p 5000:5000 \
  --mount type=bind,source=/opt/my-api/secrets/api_key,target=/run/secrets/api_key,readonly \
  skola24_schedule
