import { TerraformStack, Fn } from "cdktf";
import { KubernetesClusterKubeConfigOutputReference } from "../.gen/providers/azurerm/kubernetes-cluster";
import { Manifest } from "../.gen/providers/kubectl/manifest";
import { KubectlProvider } from "../.gen/providers/kubectl/provider";
import { DependsOn, loadFileContentsAsString } from "./utils";

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

export const installDiscoveryUIIngress = (
  classRef: TerraformStack,
  dependsOn: DependsOn
) =>
  installResource(
    classRef,
    dependsOn,
    "DiscUIIngress",
    "resource_additions/discovery_ui_ingress.yaml"
  );

const installResource = (
  classRef: TerraformStack,
  dependsOn: DependsOn,
  tfID: string,
  yamlFile: string
) =>
  new Manifest(classRef, tfID, {
    ...dependsOn,
    yamlBody: loadFileContentsAsString(yamlFile),
  });
