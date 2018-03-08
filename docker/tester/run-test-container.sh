#!/usr/bin/env bash

# ##############################################################################
# run-test-container.sh
# Nick Bradley <nbrad11@cs.ubc.ca>
#
# Description:
# Starts a Docker container from the specified image.
#
# Example:
#  ./run-test-container.sh autotest/cpsc310__d2__bootstrap /tmp/123kjka 1
# ##############################################################################

set -o errexit  # exit on command failure
set -o pipefail # exit if any command in pipeline fails
set -o nounset  # exit if undeclared variable is used

testImage=${1}
tempDir=${2}
containerLive=${3}

docker run --cap-add=NET_ADMIN \
           --volume "${tempDir}":/output \
           ${containerLive} \
           --rm \
           ${testImage}