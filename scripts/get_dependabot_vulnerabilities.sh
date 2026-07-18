gh api --paginate \
  "/repos/restorio-labs/restorio-fullstack/dependabot/alerts?state=open&per_page=100" \
  --jq '.[] | {
    number,
    package: .dependency.package.name,
    severity: .security_advisory.severity,
    manifest: .dependency.manifest_path,
    patched_version: .security_vulnerability.first_patched_version.identifier,
    url: .html_url
  }'
  