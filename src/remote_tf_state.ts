////////////////////////////////////////////////////////////////////////
import { RemoteBackend, TerraformStack } from "cdktf";
import { Config } from "./configuration";

// Configure Remote Backend with Terraform Cloud
export const initTFRemoteBackend = (classRef: TerraformStack) =>
  new RemoteBackend(classRef, {
    hostname: "app.terraform.io",
    organization: "benjaminmitchinson",
    workspaces: {
      name: "juno-demo-workspace",
    },
    token: Config.tfBackendKey,
  });
