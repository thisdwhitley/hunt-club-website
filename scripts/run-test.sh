#!/bin/bash

# FILE: scripts/run-test.sh
#
# Load environment variables from .env.local and run weather service test

# Load environment variables from .env.local
set -a
source .env.local
set +a

# Run the weather service test
node scripts/test-weather-service.js