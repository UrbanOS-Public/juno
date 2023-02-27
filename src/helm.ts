import { Fn, TerraformStack } from "cdktf";
import { KubernetesClusterKubeConfigOutputReference } from "../.gen/providers/azurerm/kubernetes-cluster";
import { PublicIp } from "../.gen/providers/azurerm/public-ip";
import { HelmProvider } from "../.gen/providers/helm/provider";
import { Release } from "../.gen/providers/helm/release";
import { Manifest } from "../.gen/providers/kubectl/manifest";
import { Config } from "./configuration";
import { DependsOn, loadFileContentsAsString } from "./utils";

export const initializeHelm = (
  classRef: TerraformStack,
  conf: KubernetesClusterKubeConfigOutputReference
) => {
  new HelmProvider(classRef, "Helm", {
    kubernetes: {
      host: conf.host,
      clientCertificate: Fn.base64decode(conf.clientCertificate),
      clientKey: Fn.base64decode(conf.clientKey),
      clusterCaCertificate: Fn.base64decode(conf.clusterCaCertificate),
    },
  });
};

export const installUrbanOS = (
  classRef: TerraformStack,
  dependsOn: DependsOn
) => {
  new Release(classRef, "UrbanOSHelmRelease", {
    name: "urbanos",
    chart: "urban-os",
    version: "1.13.31",
    repository: "https://urbanos-public.github.io/charts/",
    description:
      "Install of UrbanOS using values from the Juno terraform repo. Installed with the helm provider.",
    namespace: "urbanos",
    createNamespace: false,
    recreatePods: true,
    forceUpdate: true,
    values: [loadFileContentsAsString("urbanos_demo_chart_values.yaml")],
    ...dependsOn,
  });
};

export const installIngressNginx = (
  classRef: TerraformStack,
  ip: PublicIp,
  dependsOn: DependsOn
) =>
  new Release(classRef, "IngressNginxHelmRelease", {
    name: "ingress-nginx",
    chart: "ingress-nginx",
    repository: "https://kubernetes.github.io/ingress-nginx",
    description:
      "Install of ingress-nginx for making andi and the discovery suite applications available on the internet",
    namespace: "urbanos",
    createNamespace: false,
    recreatePods: true,
    forceUpdate: true,
    set: [
      ...azureDnsAnnotations,
      {
        name: "controller.service.loadBalancerIP",
        value: ip.ipAddress,
      },
    ],
    ...dependsOn,
  });

export const installCertManager = (
  classRef: TerraformStack,
  dependsOn: DependsOn
) => {
  const release = new Release(classRef, "CertManagerHelmRelease", {
    name: "cert-manager",
    chart: "cert-manager",
    repository: "https://charts.jetstack.io",
    description:
      "Install of cert-manager to register https certs through letsencrypt",
    namespace: "urbanos",
    createNamespace: false,
    set: certManagerValues,
    recreatePods: true,
    forceUpdate: true,
    ...dependsOn,
  });

  new Manifest(classRef, "CertIssuer", {
    dependsOn: [release],
    yamlBody: loadFileContentsAsString(
      "resource_additions/cluster_issuer.yaml"
    ),
  });

  return release;
};

const certManagerValues = [
  {
    name: "installCRDs",
    value: "true",
  },
  {
    name: "prometheus.enabled",
    value: "false",
  },
];

const azureDnsAnnotations = [
  {
    name: 'controller.service.annotations."service\\.beta\\.kubernetes\\.io/azure-load-balancer-health-probe-request-path"',
    value: "/healthz",
  },
  {
    name: 'controller.service.annotations."service\\.beta\\.kubernetes\\.io/azure-dns-label-name"',
    value: Config.URLNoSuffix,
  },
];
