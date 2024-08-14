#!/bin/bash
set -e
function ask_yes_or_no() {
    read -p "$1 (y/N): "
    case $(echo $REPLY | tr '[A-Z]' '[a-z]') in
        y|yes) echo "yes" ;;
        *)     echo "no" ;;
    esac
}
if [[ "no" == $(ask_yes_or_no "proceed with reset main, staging, and develop, and clear all git stash?") ]]
then
    echo "ok then, have a good day"
    exit 0
fi
git stash clear
git fetch --all
git checkout main
git reset --hard origin/main
git checkout staging
git reset --hard origin/staging
git checkout develop
git reset --hard origin/develop
git status
echo "successfully reset main, staging, and develop, and cleared all git stash"
