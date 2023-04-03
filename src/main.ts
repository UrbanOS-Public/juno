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
  getKubeConfFromCluster,
  initializeAzureProvider,
  reservePublicIP,
} from "./azure";
import {
  createUrbanOSNamespace,
  initializeKubectlProvider,
  installAuth0Secrets,
  installIngresses,
  installStrimziCRDs,
} from "./kubectl";
import {
  initializeHelm,
  installCertManager,
  installElasticsearch,
  installIngressNginx,
  installMinioOperator,
  installMinioTenant,
  installMockCVEData,
  installPostgresql,
  installRedis,
  installStreamsToEventHub,
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
    const cluster = createCluster(classRef);
    const clusterKubeConf = getKubeConfFromCluster(cluster);
    const publicIPForCluster = reservePublicIP(classRef, cluster);
    assignUrbanOSDNSRecords(classRef, publicIPForCluster);

    /////////////////////////////////////////////////////
    // Initialize Kubectl to install additional resources.
    //     (Ingresses / Namespaces / etc.)
    initializeKubectlProvider(classRef, clusterKubeConf);
    const namespace = createUrbanOSNamespace(classRef, {
      dependsOn: [cluster],
    });

    //////////////////////////////////////////////////////////////////////////
    // Install UrbanOS, Ingress-Nginx for ingress proxy, Cert-Manager for auto
    //     TLS renewal with let's encrypt
    initializeHelm(classRef, clusterKubeConf);

    const certManager = installCertManager(classRef, {
      dependsOn: [namespace],
    });

    const ingressNginx = installIngressNginx(classRef, publicIPForCluster, {
      dependsOn: [namespace, certManager],
    });

    installIngresses(classRef, { dependsOn: [ingressNginx] });

    const minioOperator = installMinioOperator(classRef, {
      dependsOn: [namespace],
    });
    const minioTenant = installMinioTenant(classRef, {
      dependsOn: [minioOperator],
    });

    const postgresql = installPostgresql(classRef, {
      dependsOn: [namespace],
    });

    const strimziCRDs = installStrimziCRDs(classRef, {
      dependsOn: [namespace],
    });

    const auth0 = installAuth0Secrets(classRef, {
      dependsOn: [namespace],
    });

    const redis = installRedis(classRef, {
      dependsOn: [namespace],
    });

    const elasticsearch = installElasticsearch(classRef, {
      dependsOn: [namespace],
    });

    const urbanos = installUrbanOS(classRef, {
      dependsOn: [
        minioTenant,
        postgresql,
        strimziCRDs,
        auth0,
        redis,
        elasticsearch,
      ],
    });

    const mockCVEData = installMockCVEData(classRef, {
      dependsOn: [urbanos],
    });

    if (Config.eventHubURL) {
      installStreamsToEventHub(classRef, {
        dependsOn: [mockCVEData],
      });
    }

    //////////////////////////////////////////////////////////////////////////
    // Outputs
    // (tf commands run from cdk.out/juno/stacks, after cdktf synth from root)
    // Ex retrieval: `terraform output -state=terraform.juno.tfstate juno_kube_config`
    // Ex retrieval: `terraform output juno_kube_config`
    new TerraformOutput(this, "juno_kube_config", {
      value: cluster.kubeConfigRaw,
      sensitive: true,
    });

    new TerraformOutput(this, "ingress_load_balancer_ip", {
      value: publicIPForCluster,
      sensitive: false,
    });
  }
}

const app = new App();
new MyStack(app, "juno");
app.synth();
