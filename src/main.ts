// Copyright (c) HashiCorp, Inc
// SPDX-License-Identifier: MPL-2.0

import * as dotenv from "dotenv";
dotenv.config();

import { Construct } from "constructs";
import { App, TerraformOutput, TerraformStack } from "cdktf";

import { Config } from "./configuration";
import { initTFRemoteBackend } from "./remote_tf_state";

import {
  assignUrbanOSDNSRecords,
  createCluster,
  createDNSZone,
  createResourceGroup,
  getKubeConfFromCluster,
  initializeAzureProvider,
  reservePublicIP,
} from "./azure";
import {
  createUrbanOSNamespace,
  initializeKubectlProvider,
  installDiscoveryUIIngress,
} from "./kubectl";
import {
  initializeHelm,
  installCertManager,
  installIngressNginx,
  installUrbanOS,
} from "./helm";

class MyStack extends TerraformStack {
  constructor(scope: Construct, id: string) {
    super(scope, id);
    const classRef = this;

    // DEMO_MODE is enabled only in the github workflow.
    //     When not running in DEMO_MODE, aka running locally, a local state file
    //     will be used instead of terraform cloud remote state.
    if (Config.demoMode) initTFRemoteBackend(classRef);

    ////////////////////////////////////////////////////////////////////////
    // Azure Setup
    initializeAzureProvider(classRef);
    const rg = createResourceGroup(classRef);
    const dnsZone = createDNSZone(classRef, rg);
    const cluster = createCluster(classRef, rg);
    const clusterKubeConf = getKubeConfFromCluster(cluster);
    const publicIPForCluster = reservePublicIP(classRef, rg, cluster);
    assignUrbanOSDNSRecords(classRef, dnsZone, rg, publicIPForCluster);

    /////////////////////////////////////////////////////
    // Initialize Kubectl to install additional resources.
    //     (Ingresses / Namespaces / etc.)
    initializeKubectlProvider(classRef, clusterKubeConf);
    const namespace = createUrbanOSNamespace(classRef, {
      dependsOn: [cluster],
    });
    installDiscoveryUIIngress(classRef, { dependsOn: [namespace] });

    //////////////////////////////////////////////////////////////////////////
    // Install UrbanOS, Ingress-Nginx for ingress proxy, Cert-Manager for auto
    //     TLS renewal with let's encrypt
    initializeHelm(classRef, clusterKubeConf);
    installUrbanOS(classRef, { dependsOn: [namespace] });
    const ingressRelease = installIngressNginx(classRef, publicIPForCluster, {
      dependsOn: [namespace, dnsZone],
    });
    installCertManager(classRef, {
      dependsOn: [namespace, dnsZone, ingressRelease],
    });

    //////////////////////////////////////////////////////////////////////////
    // Outputs
    // (tf commands run from cdk.out/juno/stacks, after cdktf synth from root)
    // Ex retrieval: `tf output -state=terraform.juno.tfstate juno_kube_config`
    // Ex retrieval: `tf output juno_kube_config`
    new TerraformOutput(this, "juno_kube_config", {
      value: cluster.kubeConfigRaw,
      sensitive: true,
    });
  }
}

const app = new App();
new MyStack(app, "juno");
app.synth();
