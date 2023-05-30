#!/bin/bash
# note: this hook could be reused across all envs depending on
#   how we parameterize kustomize within ./deploy_urban_os.sh
GIT_ROOT=$(git rev-parse --show-toplevel)
KUSTOMIZE_DIR="$GIT_ROOT/envs/product/kustomize"
cat <&0 > "$KUSTOMIZE_DIR/helm_output.yaml"
kustomize build $KUSTOMIZE_DIR && rm "$KUSTOMIZE_DIR/helm_output.yaml"