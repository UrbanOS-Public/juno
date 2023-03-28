import { TerraformStack } from "cdktf";
import { KubernetesCluster } from "../.gen/providers/azurerm/kubernetes-cluster";
import { PublicIp } from "../.gen/providers/azurerm/public-ip";
import { ResourceGroup } from "../.gen/providers/azurerm/resource-group";
import { AzurermProvider } from "../.gen/providers/azurerm/provider";
import { Config } from "./configuration";
import { DnsARecord } from "../.gen/providers/azurerm/dns-a-record";
import { DnsZone } from "../.gen/providers/azurerm/dns-zone";

export const initializeAzureProvider = (classRef: TerraformStack) => {
  let credentials = {};
  if (Config.demoMode) {
    credentials = {
      subscriptionId: Config.azureSubID,
      clientId: Config.azureAppID,
      clientSecret: Config.azurePassword,
      tenantId: Config.azureTenant,
    };
  } else {
    // use cli that's already been logged into with a local "az login"
    credentials = {
      subscriptionId: Config.azureSubID,
    };
  }
  new AzurermProvider(classRef, "AzureRm", {
    features: {
      resourceGroup: {
        preventDeletionIfContainsResources: false,
      },
    },
    ...credentials,
  });
};

export const createResourceGroup = (classRef: TerraformStack) =>
  new ResourceGroup(classRef, "ResourceGroup", {
    name: `${Config.resourcePrefix}-resource-group`,
    location: "eastus",
    tags: Config.tags,
  });

// ref: https://github.com/tribe-health/cdk-typescript-azurerm-k8s/blob/9d99becc2cedd876571cd9f867763ae5f34d1746/main.ts#L35
// ref: https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/resources/kubernetes_cluster
export const createCluster = (classRef: TerraformStack, rg: ResourceGroup) =>
  new KubernetesCluster(classRef, `AzureCluster`, {
    name: `${Config.resourcePrefix}-cluster`,
    location: rg.location,
    resourceGroupName: rg.name,
    dnsPrefix: Config.resourcePrefix,
    defaultNodePool: {
      name: `clusterpool`,
      // az vm list-sizes --location eastus
      // vmSize: "Standard_B2s", // 4GB RAM, 8 GB Storage $.05 / hr
      vmSize: "Standard_B2ms", //8GB RAM, 16 GB Storage $.1 / hr
      nodeCount: 6,
      tags: Config.tags,
    },
    tags: Config.tags,
    identity: {
      type: "SystemAssigned",
    },
  });

// https://github.com/hashicorp/terraform-provider-azurerm/issues/14849#issuecomment-1008341086
export const reservePublicIP = (
  classRef: TerraformStack,
  rg: ResourceGroup,
  cluster: KubernetesCluster
) =>
  new PublicIp(classRef, "ClusterIPAddress", {
    name: "UrbanOSClusterIP",
    location: rg.location,
    resourceGroupName: cluster.nodeResourceGroup,
    allocationMethod: "Static",
    sku: "Standard",
    tags: Config.tags,
  });

export const getKubeConfFromCluster = (cluster: KubernetesCluster) =>
  cluster.kubeConfig.get(0);

export const createDNSZone = (classRef: TerraformStack, rg: ResourceGroup) =>
  new DnsZone(classRef, "DNSZone", {
    name: Config.URLWithSuffix,
    resourceGroupName: rg.name,
    tags: Config.tags,
  });

export const assignUrbanOSDNSRecords = (
  classRef: TerraformStack,
  dnsZone: DnsZone,
  rg: ResourceGroup,
  ip: PublicIp
) => {
  ["Discovery", "Andi"].forEach((domain) => {
    new DnsARecord(classRef, `${domain}DomainRecord`, {
      name: domain.toLowerCase(),
      zoneName: dnsZone.name,
      resourceGroupName: rg.name,
      ttl: 300,
      records: [ip.ipAddress],
      tags: Config.tags,
    });
  });
};
