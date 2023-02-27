////////////////////////////////////////////////////////////////////////
// Configuration
export class Config {
  static get URLNoSuffix() {
    return this.getEnvVar({
      varName: "JUNO_DOMAIN_NO_SUFFIX",
      errorMsg:
        "JUNO_DOMAIN_NO_SUFFIX is a domain that has been registered with Azure nameservers.",
    });
  }

  static get URLWithSuffix() {
    return this.getEnvVar({
      varName: "JUNO_DOMAIN_WITH_SUFFIX",
      errorMsg:
        "JUNO_DOMAIN_WITH_SUFFIX is a domain that has been registered with Azure nameservers.",
    });
  }

  static get resourcePrefix() {
    return this.getEnvVar({
      varName: "JUNO_RESOURCE_PREFIX",
      errorMsg:
        "JUNO_RESOURCE_PREFIX is used to tag resources. It must be unique from other users deploying juno terraform, so that there are no resource conflicts if multiple deployments are using the same subscription. Choose a unique name.",
    });
  }

  // May need to run `az account set --subscription=ID` in order for the
  //     underlying `az` binary to create resources + prompt login
  static get azureSubID() {
    return this.getEnvVar({
      varName: "JUNO_AZURE_SUB_ID",
      errorMsg: "A subscription ID is needed to deploy azure resources into.",
    });
  }

  // demoMode is intended for github actions execution and effecting
  //     urbanos-demo.com resources. Should not be enabled in other
  //     contexts or if developers are running the script locally for other
  //     domains.
  static get demoMode() {
    return this.getEnvVar({
      varName: "JUNO_DEMO_MODE_ENABLED",
      defaultValue: "false",
    }) === "true"
      ? true
      : false;
  }

  // tag to put on all created resources, helpful for billing info + confirming
  //     that resources related to this terraform has been entirely removed
  static get tags() {
    return {
      environment: `${this.resourcePrefix}-terraform`,
    };
  }

  static get azureAppID() {
    return this.getEnvVar({
      varName: "JUNO_DEMO_AZURE_APP_ID",
      errorMsg: "Required for azure login.",
    });
  }
  static get azurePassword() {
    return this.getEnvVar({
      varName: "JUNO_DEMO_AZURE_PASSWORD",
      errorMsg: "Required for azure login.",
    });
  }
  static get azureTenant() {
    return this.getEnvVar({
      varName: "JUNO_DEMO_AZURE_TENANT",
      errorMsg: "Required for azure login.",
    });
  }

  static get tfBackendKey() {
    return this.getEnvVar({
      varName: "JUNO_DEMO_TF_BACKEND_KEY",
      errorMsg: "Required for remote tf state access.",
    });
  }

  private static getEnvVar(input: {
    varName: string;
    defaultValue?: string;
    errorMsg?: string;
  }) {
    const { varName, defaultValue, errorMsg } = input;
    const envVar = process.env[varName];
    if (envVar) {
      return envVar;
    } else if (defaultValue) {
      return defaultValue;
    } else {
      throw Error(
        `${varName} is not set in environment variables. ${errorMsg}`
      );
    }
  }
}
