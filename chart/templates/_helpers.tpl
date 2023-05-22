{{- define "umami.credentials-secret-name" -}}
{{- printf "%s-creds" (include "common.names.fullname" .) -}}
{{- end }}

{{- define "umami.image" -}}
{{ include "common.images.image" (dict "imageRoot" .Values.image "solution" .Values "global" .Values.global) }}
{{- end -}}
{{- define "umami.imagePullSecrets" -}}
{{- include "common.images.pullSecrets" (dict "images" (list .Values.image) "global" .Values.global) -}}
{{- end -}}

{{/*
Create the name of the service account to use
*/}}
{{- define "umami.serviceAccountName" -}}
{{- if .Values.serviceAccount.create -}}
    {{ default (include "common.names.fullname" .) .Values.serviceAccount.name }}
{{- else -}}
    {{ default "default" .Values.serviceAccount.name }}
{{- end -}}
{{- end -}}

{{/*
Return true if cert-manager required annotations for TLS signed certificates are set in the Ingress annotations
Ref: https://cert-manager.io/docs/usage/ingress/#supported-annotations
*/}}
{{- define "umami.ingress.certManagerRequest" -}}
{{ if or (hasKey . "cert-manager.io/cluster-issuer") (hasKey . "cert-manager.io/issuer") }}
    {{- true -}}
{{- end -}}
{{- end -}}

{{/*
Compile all warnings into a single message.
*/}}
{{- define "umami.validateValues" -}}
{{- $messages := list -}}
{{- $messages := append $messages (include "umami.validateValues.foo" .) -}}
{{- $messages := append $messages (include "umami.validateValues.bar" .) -}}
{{- $messages := without $messages "" -}}
{{- $message := join "\n" $messages -}}

{{- if $message -}}
{{-   printf "\nVALUES VALIDATION:\n%s" $message -}}
{{- end -}}
{{- end -}}

{{- define "zerobackMgmtserverNodeListEnv" -}}
{{- $tmp := list -}}
{{- $port := 9010 -}}
{{- range $i, $v := .nodes }}
{{- $tmp = print $v.host ":" $port | append $tmp -}}
{{- end }}
{{- join "," $tmp -}}
{{- end -}}
