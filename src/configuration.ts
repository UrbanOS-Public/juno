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

  static get resourceGroupLocation() {
    // too lazy to move to .env
    return "eastus";
  }

  static get resourceGroupName() {
    // too lazy to move to .env
    return "urbanos-team";
  }

  static get eventHubURL() {
    return this.getEnvVar({
      varName: "JUNO_EVENT_HUB_URL",
      defaultValue: "",
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
  //     demo-urbanos.com resources. Should not be enabled in other
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

  static get auth0ApiKey() {
    return this.getEnvVar({
      varName: "AUTH0_USER_API_KEY",
      defaultValue: "",
    });
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

  static get andiAuth0Secret() {
    return this.getEnvVar({
      varName: "JUNO_ANDI_AUTH0_CLIENT_SECRET",
      errorMsg: "UrbanOS requires auth0 client secret for Andi service",
    });
  }

  static get raptorAuth0Secret() {
    return this.getEnvVar({
      varName: "JUNO_RAPTOR_AUTH0_CLIENT_SECRET",
      errorMsg: "UrbanOS requires auth0 client secret for Raptor service",
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
    } else if (defaultValue != undefined) {
      return defaultValue;
    } else {
      throw Error(
        `${varName} is not set in environment variables. ${errorMsg}`
      );
    }
  }
}
