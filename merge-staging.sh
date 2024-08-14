#!/bin/bash
set -e
function ask_yes_or_no() {
    read -p "$1 (y/N): "
    case $(echo $REPLY | tr '[A-Z]' '[a-z]') in
        y|yes) echo "yes" ;;
        *)     echo "no" ;;
    esac
}
if [[ "no" == $(ask_yes_or_no "Are you sure about merging into STAGING?") || \
      "no" == $(ask_yes_or_no "Are you *really* sure?") ]]
then
    echo "Skipped."
    exit 0
fi
branch_name=$(git rev-parse --symbolic-full-name --abbrev-ref HEAD)
git stash
git fetch --all
git checkout staging
git reset --hard origin/staging
git merge origin develop
git push origin staging
git checkout $branch_name
git stash pop
echo "Successfully merged develop --> staging"
