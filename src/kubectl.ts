import { TerraformStack, Fn } from "cdktf";
import { KubernetesClusterKubeConfigOutputReference } from "../.gen/providers/azurerm/kubernetes-cluster";
import { Manifest } from "../.gen/providers/kubectl/manifest";
import { KubectlProvider } from "../.gen/providers/kubectl/provider";
import { Config } from "./configuration";
import { DependsOn, loadFileContentsAsString, replaceAll } from "./utils";

/////////////////////////////////////////////////////
// connect with kubectl to install individual resources.
//   installs resources used to configure ingress materials, as well
//   as a few custom things for urbanos, that are ideally moved into
//   urbanos/charts later on.
export const initializeKubectlProvider = (
  classRef: TerraformStack,
  clusterKubeConf: KubernetesClusterKubeConfigOutputReference
) => {
  new KubectlProvider(classRef, "Kubectl", {
    loadConfigFile: false,
    host: clusterKubeConf.host,
    clientCertificate: Fn.base64decode(clusterKubeConf.clientCertificate),
    clientKey: Fn.base64decode(clusterKubeConf.clientKey),
    clusterCaCertificate: Fn.base64decode(clusterKubeConf.clusterCaCertificate),
  });
};

export const createUrbanOSNamespace = (
  classRef: TerraformStack,
  dependsOn: DependsOn
) =>
  installResource(
    classRef,
    dependsOn,
    "Namespace",
    "resource_additions/urbanos_namespace.yaml"
  );

export const installIngresses = (
  classRef: TerraformStack,
  dependsOn: DependsOn
) => {
  [
    ["andi.yaml", "Andi"],
    ["discovery_api.yaml", "API"],
    ["discovery_streams.yaml", "Streams"],
    ["discovery_ui.yaml", "UI"],
    ["crash.yaml", "Crash"],
  ].forEach(([ingress_file, label]) => {
    installResource(
      classRef,
      dependsOn,
      `${label}Ingress`,
      `resource_additions/ingresses/${ingress_file}`,
      { key: "URL_W_SUFFIX", value: Config.URLWithSuffix }
    );
  });
};

export const installStrimziCRDs = (
  classRef: TerraformStack,
  dependsOn: DependsOn
) =>
  installResource(
    classRef,
    dependsOn,
    "StrimziCRD",
    "resource_additions/strimzi-crds-0.33.2.yaml"
  );

export const installAuth0Secrets = (
  classRef: TerraformStack,
  dependsOn: DependsOn
) => {
  const raptor = installResource(
    classRef,
    dependsOn,
    "RaptorAuth0Secret",
    "resource_additions/raptor_secret.yaml",
    { key: "REPLACE-WITH-BASE64", value: btoa(Config.raptorAuth0Secret) }
  );
  return installResource(
    classRef,
    { dependsOn: [...dependsOn.dependsOn, raptor] },
    // doesn't really require raptor but, this way what's returned represents
    //     both resources added.
    "AndiAuth0Secret",
    "resource_additions/andi_secret.yaml",
    { key: "REPLACE-WITH-BASE64", value: btoa(Config.andiAuth0Secret) }
  );
};

export const installSauronGithubToken = (
  classRef: TerraformStack,
  dependsOn: DependsOn
) => {
  return installResource(
    classRef,
    { dependsOn: [...dependsOn.dependsOn] },
    "SauronGithub",
    "resource_additions/sauron_github_token.yaml",
    { key: "REPLACE-WITH-BASE64", value: btoa(Config.sauronGithubToken) }
  );
};

export const installStreamsToEventHubSecrets = (
  classRef: TerraformStack,
  dependsOn: DependsOn
) => {
  const api_key = installResource(
    classRef,
    dependsOn,
    "Auth0ApiKeySecret",
    "resource_additions/auth0_user_api_key.yaml",
    { key: "REPLACE-WITH-BASE64", value: btoa(Config.auth0ApiKey) }
  );

  return installResource(
    classRef,
    { dependsOn: [...dependsOn.dependsOn, api_key] },
    "EventHubURLSecret",
    "resource_additions/event_hub_secret.yaml",
    { key: "REPLACE-WITH-BASE64", value: btoa(Config.eventHubURL) }
  );
};

export const installMinioUser = (
  classRef: TerraformStack,
  dependsOn: DependsOn
) =>
  installResource(
    classRef,
    dependsOn,
    "MinioUser",
    "resource_additions/minio_user.yaml"
  );

const installResource = (
  classRef: TerraformStack,
  dependsOn: DependsOn,
  tfID: string,
  yamlFile: string,
  secretInject?: {
    key: string;
    value: string;
  }
) => {
  let yamlBody = loadFileContentsAsString(yamlFile);

  if (secretInject) {
    yamlBody = replaceAll(yamlBody, secretInject.key, secretInject.value);
  }

  return new Manifest(classRef, tfID, {
    ...dependsOn,
    yamlBody,
  });
};
