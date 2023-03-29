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

export const installMinioOperator = (
  classRef: TerraformStack,
  dependsOn: DependsOn
) =>
  new Release(classRef, "MinioOperatorHelmRelease", {
    name: "minio-operator",
    chart: "operator",
    version: "4.5.8",
    repository: "https://operator.min.io/",
    description:
      "Install of Minio Operator using values from the Juno terraform repo. Installed with the helm provider.",
    namespace: "urbanos",
    createNamespace: false,
    values: [
      loadFileContentsAsString("resource_additions/minio_operator_values.yaml"),
    ],
    ...dependsOn,
  });

export const installMinioTenant = (
  classRef: TerraformStack,
  dependsOn: DependsOn
) =>
  new Release(classRef, "MinioTenantHelmRelease", {
    name: "minio-tenant",
    chart: "tenant",
    version: "4.5.8",
    repository: "https://operator.min.io/",
    description:
      "Install of Minio Tenant using values from the Juno terraform repo. Installed with the helm provider.",
    namespace: "urbanos",
    createNamespace: false,
    values: [
      loadFileContentsAsString("resource_additions/minio_tenant_values.yaml"),
    ],
    ...dependsOn,
  });

export const installPostgresql = (
  classRef: TerraformStack,
  dependsOn: DependsOn
) =>
  new Release(classRef, "PostgresqlHelmRelease", {
    name: "postgresql",
    chart: "postgresql",
    version: "12.1.14",
    repository: "https://charts.bitnami.com/bitnami",
    description:
      "Install of Postgresql using values from the Juno terraform repo. Installed with the helm provider.",
    namespace: "urbanos",
    createNamespace: false,
    values: [
      loadFileContentsAsString("resource_additions/postgres_values.yaml"),
    ],
    ...dependsOn,
  });

export const installRedis = (classRef: TerraformStack, dependsOn: DependsOn) =>
  new Release(classRef, "RedisHelmRelease", {
    name: "redis",
    chart: "redis",
    version: "17.1.4",
    repository: "https://charts.bitnami.com/bitnami",
    description:
      "Install of Redis using values from the Juno terraform repo. Installed with the helm provider.",
    namespace: "urbanos",
    createNamespace: false,
    values: [loadFileContentsAsString("resource_additions/redis_values.yaml")],
    ...dependsOn,
  });

export const installElasticsearch = (
  classRef: TerraformStack,
  dependsOn: DependsOn
) =>
  new Release(classRef, "ElasticsearchHelmRelease", {
    name: "elasticsearch",
    chart: "elasticsearch",
    version: "7.14.0",
    repository: "https://helm.elastic.co",
    description:
      "Install of Elasticsearch using values from the Juno terraform repo. Installed with the helm provider.",
    namespace: "urbanos",
    createNamespace: false,
    values: [
      loadFileContentsAsString("resource_additions/elasticsearch_values.yaml"),
    ],
    ...dependsOn,
  });

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
