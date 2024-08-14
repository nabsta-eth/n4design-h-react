#!/bin/bash
set -e
function ask_yes_or_no() {
    read -p "$1 (y/N): "
    case $(echo $REPLY | tr '[A-Z]' '[a-z]') in
        y|yes) echo "yes" ;;
        *)     echo "no" ;;
    esac
}
if [[ "no" == $(ask_yes_or_no "Are you sure about merging into PRODUCTION?") || \
      "no" == $(ask_yes_or_no "Are you *really* sure?") ]]
then
    echo "Skipped."
    exit 0
fi
branch_name=$(git rev-parse --symbolic-full-name --abbrev-ref HEAD)
git stash
git fetch --all
git checkout main
git reset --hard origin/main
git merge origin staging
git push origin main
git checkout $branch_name
git stash pop
echo "Successfully merged staging --> main"
