#!/bin/bash

set -euf -o pipefail

curl -sL https://deb.nodesource.com/setup_10.x | sudo -E bash -
apt install nodejs

apt-get install -y postgresql-client
