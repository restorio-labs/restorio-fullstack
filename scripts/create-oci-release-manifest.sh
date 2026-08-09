#!/usr/bin/env bash

set -euo pipefail

readonly release_tag="${1:?Expected release tag}"
readonly release_commit="${2:?Expected release commit}"
: "${GHCR_USERNAME:?Missing GHCR_USERNAME}"

resolve_image() {
  local component="$1"
  local image="ghcr.io/${GHCR_USERNAME,,}/restorio-$component"
  local digest

  if digest=$(crane digest "$image:$release_tag" 2>/dev/null); then
    printf '%s %s %s\n' "$image" "$release_tag" "$digest"
    return
  fi

  local available_tags
  available_tags=$(crane ls "$image")
  local latest_tag=""
  local candidate
  while IFS= read -r candidate; do
    if ! [[ "$candidate" =~ ^v[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
      continue
    fi

    if ! printf '%s\n%s\n' "$candidate" "$release_tag" | sort -V -C; then
      continue
    fi

    if [ -z "$latest_tag" ] || printf '%s\n%s\n' "$latest_tag" "$candidate" | sort -V -C; then
      latest_tag="$candidate"
    fi
  done <<< "$available_tags"

  if [ -z "$latest_tag" ]; then
    echo "No published image tag at or before $release_tag for $image" >&2
    return 1
  fi

  digest=$(crane digest "$image:$latest_tag")
  echo "$image was unchanged in $release_tag; recording $latest_tag" >&2
  printf '%s %s %s\n' "$image" "$latest_tag" "$digest"
}

components_json="{}"
for component in api admin-panel kitchen-panel mobile-app waiter-panel; do
  resolved_image=$(resolve_image "$component")
  read -r image tag digest <<< "$resolved_image"
  component_json=$(jq --compact-output --null-input \
    --arg component "$component" \
    --arg image "$image" \
    --arg tag "$tag" \
    --arg digest "$digest" \
    '{($component): {image: $image, tag: $tag, digest: $digest}}')
  components_json=$(jq --compact-output --argjson component "$component_json" '. + $component' <<< "$components_json")
done

jq --null-input \
  --arg release_tag "$release_tag" \
  --arg commit "$release_commit" \
  --argjson components "$components_json" \
  '{schemaVersion: 1, releaseTag: $release_tag, commit: $commit, components: $components}'
