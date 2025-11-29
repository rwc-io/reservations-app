#!/bin/bash

jq -n \
  --arg APPLICATION_TITLE "${APPLICATION_TITLE:-Reservations}" \
  --arg FIREBASE_PROJECT_ID "$FIREBASE_PROJECT_ID" \
  --arg FIREBASE_APP_ID "$FIREBASE_APP_ID" \
  --arg FIREBASE_STORAGE_BUCKET "$FIREBASE_STORAGE_BUCKET" \
  --arg FIREBASE_API_KEY "$FIREBASE_API_KEY" \
  --arg FIREBASE_AUTH_DOMAIN "$FIREBASE_AUTH_DOMAIN" \
  --arg FIREBASE_MESSAGING_SENDER_ID "$FIREBASE_MESSAGING_SENDER_ID" \
  -f src/app/reservations-app.config.json.jq \
  > src/app/reservations-app.config.json
