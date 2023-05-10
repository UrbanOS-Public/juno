////////////////////////////////////////////////////////////////////////
import { RemoteBackend, TerraformStack } from "cdktf";
import { Config } from "./configuration";

// Configure Remote Backend with Terraform Cloud
export const initTFRemoteBackend = (classRef: TerraformStack) =>
  new RemoteBackend(classRef, {
    hostname: "app.terraform.io",
    organization: Config.tfOrgName,
    workspaces: {
      name: Config.tfWorkspaceName,
    },
    token: Config.tfBackendKey,
  });
