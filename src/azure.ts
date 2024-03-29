import { TerraformStack } from "cdktf";
import { KubernetesCluster } from "../.gen/providers/azurerm/kubernetes-cluster";
import { KubernetesClusterNodePool } from "../.gen/providers/azurerm/kubernetes-cluster-node-pool";
import { PublicIp } from "../.gen/providers/azurerm/public-ip";
import { AzurermProvider } from "../.gen/providers/azurerm/provider";
import { Config } from "./configuration";
import { DnsARecord } from "../.gen/providers/azurerm/dns-a-record";

export const initializeAzureProvider = (classRef: TerraformStack) => {
  let credentials = {};
  if (Config.azureTenant && Config.azurePassword && Config.azureAppID) {
    credentials = {
      subscriptionId: Config.azureSubID,
      clientId: Config.azureAppID,
      clientSecret: Config.azurePassword,
      tenantId: Config.azureTenant,
    };
  } else {
    // Attempt to use cli that's already been logged into with an "az login"
    console.log(
      "No azure credential set supplied, using the active Azure CLI user / tenant."
    );
    credentials = {
      subscriptionId: Config.azureSubID,
    };
  }
  new AzurermProvider(classRef, "AzureRm", {
    features: {},
    ...credentials,
  });
};

// export const createResourceGroup = (classRef: TerraformStack) =>
//   new ResourceGroup(classRef, "ResourceGroup", {
//     name: `${Config.resourcePrefix}-resource-group`,
//     location: "eastus",
//     tags: Config.tags,
//   });

// ref: https://github.com/tribe-health/cdk-typescript-azurerm-k8s/blob/9d99becc2cedd876571cd9f867763ae5f34d1746/main.ts#L35
// ref: https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/resources/kubernetes_cluster
export const createCluster = (classRef: TerraformStack) => {
  // az vm list-sizes --location eastus
  // https://azure.microsoft.com/en-us/pricing/vm-selector/
  // see resource_calculations.xlsx for compute pricing
  // https://azureprice.net/
  const cluster = new KubernetesCluster(classRef, `AzureCluster`, {
    name: `${Config.resourcePrefix}-cluster`,
    kubernetesVersion: "1.25",
    location: Config.resourceGroupLocation,
    resourceGroupName: Config.resourceGroupName,
    dnsPrefix: Config.resourcePrefix,
    defaultNodePool: {
      name: `defaultpool`,
      vmSize: "Standard_B2s", // 4GB RAM, 8 GB Storage $.0416 / hr
      nodeCount: 10,
      tags: Config.tags,
    },
    azurePolicyEnabled: true,
    tags: Config.tags,
    identity: {
      type: "SystemAssigned",
    },
  });

  const medram = new KubernetesClusterNodePool(classRef, "AddPoolOne", {
    name: "medrampool",
    kubernetesClusterId: cluster.id,
    vmSize: "Standard_B2ms", //8GB RAM, 16 GB Storage $.0832 / hr
    nodeCount: 5,
    tags: Config.tags,
  });

  const highram = new KubernetesClusterNodePool(classRef, "AddPoolTwo", {
    name: "highrampool",
    kubernetesClusterId: cluster.id,
    vmSize: "Standard_B4ms", //16GB RAM, 32 GB Storage $.166 / hr
    nodeCount: 5,
    tags: Config.tags,
  });

  return { cluster, medram, highram };
};

// $2.63 a month https://azure.microsoft.com/en-us/pricing/details/ip-addresses/
// https://github.com/hashicorp/terraform-provider-azurerm/issues/14849#issuecomment-1008341086
export const reservePublicIP = (
  classRef: TerraformStack,
  cluster: KubernetesCluster
) =>
  new PublicIp(classRef, "ClusterIPAddress", {
    name: "UrbanOSClusterIP",
    location: Config.resourceGroupLocation,
    resourceGroupName: cluster.nodeResourceGroup,
    allocationMethod: "Static",
    sku: "Standard",
    tags: Config.tags,
  });

export const getKubeConfFromCluster = (cluster: KubernetesCluster) =>
  cluster.kubeConfig.get(0);

// .50 a month https://azure.microsoft.com/en-us/pricing/details/dns/
// export const createDNSZone = (classRef: TerraformStack, rg: ResourceGroup) =>
//   new DnsZone(classRef, "DNSZone", {
//     name: Config.URLWithSuffix,
//     resourceGroupName: rg.name,
//     tags: Config.tags,
//   });

export const assignUrbanOSDNSRecords = (
  classRef: TerraformStack,
  ip: PublicIp
) => {
  ["Discovery", "Andi", "Data", "Streams", "Crash"].forEach((domain) => {
    new DnsARecord(classRef, `${domain}DomainRecord`, {
      name: domain.toLowerCase(),
      zoneName: Config.URLWithSuffix,
      resourceGroupName: Config.resourceGroupName,
      ttl: 300,
      records: [ip.ipAddress],
      tags: Config.tags,
    });
  });
};
