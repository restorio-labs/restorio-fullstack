#!/usr/bin/env bash

set -euo pipefail

readonly base_ref="${1:-}"
readonly head_ref="${2:-HEAD}"

declare -A selected=()

select_component() {
  selected["$1"]=1
}

select_static_frontends() {
  select_component admin-panel
  select_component kitchen-panel
  select_component mobile-app
  select_component waiter-panel
}

if [ -n "$base_ref" ]; then
  changed_files=$(git diff --name-only "$base_ref" "$head_ref")
else
  changed_files=$(git ls-files)
fi

while IFS= read -r changed_file; do
  case "$changed_file" in
    app/api/*)
      select_component api
      ;;
    app/apps/admin-panel/*)
      select_component admin-panel
      ;;
    app/apps/kitchen-panel/*)
      select_component kitchen-panel
      ;;
    app/apps/mobile-app/*)
      select_component mobile-app
      ;;
    app/apps/waiter-panel/*)
      select_component waiter-panel
      ;;
    app/packages/* | .dockerignore | bun.lock | bunfig.toml | package.json | turbo.json | tsconfig.json | tsconfig.base.json)
      select_static_frontends
      ;;
  esac
done <<< "$changed_files"

component_definition() {
  case "$1" in
    api)
      jq --compact-output --null-input \
        --arg name api \
        --arg context ./app/api \
        --arg file ./app/api/Dockerfile \
        --arg image restorio-api \
        '{name: $name, context: $context, file: $file, image: $image}'
      ;;
    admin-panel | kitchen-panel | mobile-app | waiter-panel)
      jq --compact-output --null-input \
        --arg name "$1" \
        --arg context . \
        --arg file "./app/apps/$1/Dockerfile" \
        --arg image "restorio-$1" \
        '{name: $name, context: $context, file: $file, image: $image}'
      ;;
  esac
}

for component in api admin-panel kitchen-panel mobile-app waiter-panel; do
  if [ -n "${selected[$component]:-}" ]; then
    component_definition "$component"
  fi
done | jq --compact-output --slurp '.'
