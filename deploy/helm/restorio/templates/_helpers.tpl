{{- define "restorio.name" -}}
{{- .Chart.Name | trunc 63 | trimSuffix "-" }}
{{- end }}

{{- define "restorio.fullname" -}}
{{- printf "%s-%s" .Release.Name (include "restorio.name" .) | trunc 63 | trimSuffix "-" }}
{{- end }}

{{- define "restorio.labels" -}}
app.kubernetes.io/name: {{ include "restorio.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
helm.sh/chart: {{ printf "%s-%s" .Chart.Name .Chart.Version | quote }}
{{- end }}
