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
  installSauronGithubToken,
  installIngresses,
  installStrimziCRDs,
} from "./kubectl";
import {
  initializeHelm,
  installCertManager,
  installElasticsearch,
  installIngressNginx,
  installKafka,
  installMinioOperator,
  installMinioTenant,
  installMockCVEData,
  installPostgresql,
  installRedis,
  installSauron,
  installStreamsToEventHub,
  installUrbanOS,
} from "./helm";

class MyStack extends TerraformStack {
  constructor(scope: Construct, id: string) {
    super(scope, id);
    const classRef = this;

    console.log(">>>>>>>>>>>>>>>>>>>> Starting script for:", Config.env);

    if (Config.tfBackendKey && Config.tfWorkspaceName && Config.tfOrganizationName) {
      console.log("Using remote TF backend:", Config.tfWorkspaceName);
      initTFRemoteBackend(classRef);
    } else {
      console.log(
        "Using local terraform state, since either backend key, workspace name, or organization name were not provided."
      );
    }

    ////////////////////////////////////////////////////////////////////////
    // Azure Setup
    initializeAzureProvider(classRef);
    const { cluster, medram, highram } = createCluster(classRef);
    const clusterKubeConf = getKubeConfFromCluster(cluster);
    const publicIPForCluster = reservePublicIP(classRef, cluster);
    assignUrbanOSDNSRecords(classRef, publicIPForCluster);

    /////////////////////////////////////////////////////
    // Initialize Kubectl to install additional resources.
    //     (Ingresses / Namespaces / etc.)
    initializeKubectlProvider(classRef, clusterKubeConf);
    const namespace = createUrbanOSNamespace(classRef, {
      dependsOn: [cluster, medram, highram],
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

    const kafka = installKafka(classRef, {
      dependsOn: [strimziCRDs],
    });

    const urbanos = installUrbanOS(classRef, {
      dependsOn: [
        minioTenant,
        postgresql,
        kafka,
        auth0,
        redis,
        elasticsearch,
        cluster,
        medram,
        highram,
      ],
    });

    if (Config.enableSauron && Config.env !== "demo") {
      const sauronGithubToken = installSauronGithubToken(classRef, {
        dependsOn: [namespace],
      });

      installSauron(classRef, {
        dependsOn: [urbanos, sauronGithubToken]
      });
    }

    const mockCVEData = installMockCVEData(classRef, { dependsOn: [urbanos] });

    if (Config.eventHubURL) {
      console.log("EVENTHUB WILL BE INSTALLED");
      installStreamsToEventHub(classRef, {
        dependsOn: [mockCVEData],
      });
    } else {
      console.log("EVENTHUB WILL *NOT* BE INSTALLED");
    }

    // wait to install ingresses until mockCVE and urbanos are deployed, so that
    //   service challenges pass when generating certs
    installIngresses(classRef, {
      dependsOn: [ingressNginx, mockCVEData, urbanos],
    });

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
