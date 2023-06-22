////////////////////////////////////////////////////////////////////////
// Configuration

export class Config {
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
    return this.getEnvVar({
      varName: "AZURE_RESOURCE_GROUP_NAME",
      errorMsg:
        "RESOURCE_GROUP_NAME is used deploy resource into Azure. It needs to be manually created before deployment",
    });
    
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

  static get auth0ApiKey() {
    return this.getEnvVar({
      varName: "AUTH0_USER_API_KEY",
      defaultValue: "",
    });
  }

  static get azureAppID() {
    return this.getEnvVar({
      varName: "JUNO_DEMO_AZURE_APP_ID",
      defaultValue: "",
    });
  }

  static get azurePassword() {
    return this.getEnvVar({
      varName: "JUNO_DEMO_AZURE_PASSWORD",
      defaultValue: "",
    });
  }

  static get azureTenant() {
    return this.getEnvVar({
      varName: "JUNO_DEMO_AZURE_TENANT",
      defaultValue: "",
    });
  }

  // if provided, store tf state in terraform.io
  //     if omitted, use local state
  static get tfBackendKey() {
    return this.getEnvVar({
      varName: "JUNO_DEMO_TF_BACKEND_KEY",
      defaultValue: "",
    });
  }

  static get tfWorkspaceName() {
    return this.getEnvVar({
      varName: "JUNO_DEMO_TF_WORKSPACE_NAME",
      defaultValue: "",
    });
  }

  static get tfOrganizationName() {
    return this.getEnvVar({
      varName: "JUNO_DEMO_TF_ORGANIZATION_NAME",
      defaultValue: "",
    });
  }

  static get urbanosChartVersion() {
    return this.getEnvVar({
      varName: "URBANOS_CHART_VERSION",
      errorMsg: "UrbanOS requires URBANOS_CHART_VERSION for installation",
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

  static get useStagingLetsEncrypt() {
    return this.getEnvVar({
      varName: "JUNO_USE_STAGING_LETS_ENCRYPT",
      defaultValue: "false",
    }).toLowerCase() === "true"
      ? true
      : false;
  }

  static get sauronGithubToken() {
    return this.getEnvVar({
      varName: "JUNO_SAURON_GITHUB_PAT",
      errorMsg: "UrbanOS requires a github private access token for Sauron service"
    });
  }

  static get env() {
    return this.getEnvVar({
      varName: "ENV",
      errorMsg: "Unable to determine environment"
    });
  }

  static get enableSauron() {
    return this.getEnvVar({
      varName: "JUNO_ENABLE_SAURON",
      defaultValue: "false",
    }).toLowerCase() === "true"
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
}
