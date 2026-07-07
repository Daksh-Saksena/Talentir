#!/bin/bash

# Check if a simulation ID was provided
if [ -z "$1" ]; then
  echo "Usage: ./sim <simulation-id>"
  echo "Example: ./sim projectile-motion"
  exit 1
fi

ID=$1
URL="http://localhost:3000/sim/$ID"

echo "Opening $ID in full screen..."
open "$URL"
