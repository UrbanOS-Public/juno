# Juno

Terraform scripts to deploy a complete instance of UrbanOS on demand in Azure!

The github workflow will create a "Demo" instance at demo-urbanos.com

- [Deploy UrbanOS with Juno](https://github.com/UrbanOS-Public/juno/actions/workflows/deploy_urbanos.yml)
- [Teardown UrbanOS with Juno](https://github.com/UrbanOS-Public/juno/actions/workflows/teardown_urbanos.yml)

An empty DNSZone, App Service DNS name, and resource group, are the only
resources that exist ahead of this terraform creating resources. Alterations to
those references can be made in "configuration.ts"

## Local Setup
- `npm install @types/node --save-dev` to enable better code sense
- Install azure CLI: https://learn.microsoft.com/en-us/cli/azure/install-azure-cli
- Install terraform: https://developer.hashicorp.com/terraform/tutorials/aws-get-started/install-cli
- Install NVM: https://github.com/nvm-sh/nvm#installing-and-updating
- Install node: `nvm install 16.19.0` & `nvm use 16.19.0`


## Auth0 Setup
- Create an Auth0 Tenant by following up to step #7 from here: https://github.com/UrbanOS-Public/auth0-setup#setting-up-new-auth0-tenants
- Clone the Auth0 setup repo: https://github.com/UrbanOS-Public/auth0-setup
- Place the file the previous command created inside the config folder
- - Removed duplicate items in this config file
  - For example, both `\"https://discovery.urbanosinternal.com\"` and ` \"https://data.urbanosinternal.com\"` have duplicate entries in the following example:
```
  "allowedOrigins": "[\"http://localhost:9001\", \"http://localhost:9002\", \"https://discovery.urbanosinternal.com\", \"https://discovery.urbanosinternal.com\",\"https://data.urbanosinternal.com\", \"https://data.urbanosinternal.com\"]"
```
- Completed step #8 from here: https://github.com/UrbanOS-Public/auth0-setup#setting-up-new-auth0-tenants
  - Answered no to googl-0auth2 question
  - Answered yes to User/Password question
- In Auth0, navigate to "Applications" -> "Raptor" -> "APIs" -> Expanded the dropdown for "Auth0 Management API" -> Added "read:roles" to list of permissions
- In Auth0, navigate to "Applications" -> "Andi" -> "Connections" -> Enabled Username/pass and Disabled Google

## Debugging the cluster

- Should any issues with the demo, a teardown followed by a create
  operation should reset things to working state.
- To manually interact with the cluster, find "juno-cluster" in the aks service,
  and hit the "connect" button to be guided on getting terminal access from your
  machine.

## Notes

- This instance has it's own auth0 tenant "urbanos-demo". Contact
  Fred Estabrook to be added as a user or admin. A login
  at that tenant is required to access Andi or Discovery
- See [this commit](https://github.com/UrbanOS-Public/juno/commit/14743c8b8ce1203420330a0e5c10578f7c3d7445)
  for an example of adding a new ingress / subdomain
- Secrets used in github actions are added as "environment" secrets, not repo
  secrets.

## Billing

- Cost per hour of the entire environment is about $.47 an hour. A breakdown
  of cost is available in resource_calculations.xlsx
- All Azure resources are created with the `environment` tag `juno-terraform`
  in the event they need to be manually removed from Azure / identified for
  billing.

## Future upgrades / ideas

- The data ingested by default isn't super interesting, lets find exciting
  data and have it be created by default!
  - Andi is initialized with a bash script, but it would be easier to
    generate API bodies (dynamic urls / ids) in another language to alter
    json. The URL is hardcoded to demo-urbanos.com in a few places.
- Images are pinned at January 30th 2023. Upgrading to newer versions will
  require:
  - upgrading the urbanos chart version installed in the urbanos release in helm.ts
  - upgrading the kafka chart version installed in the kafka release in helm.ts
  - altering urbanos_chart_values to correspond with this new chart version
  - altering urbanos_kafka_values to correspond with this new chart version
  - updating the version pin in the helm template script in "scripts"
  - pinning each urbanos image in urbanos_chart_values at a release tag
    (or preferably, pinning those in the charts repo itself. Upgrading all
    environments would be much smoother if charts didn't always point to
    "development" image tag, and image versions were cut more often)
  - PS. I noticed andi now has API protection, so "initialize_andi.sh" might
    need to be upgraded to include support for providing an auth0 user secret.
    Additionally, "initialize_andi" will need to be updated / replaced with
    something that supports dynamic ids coming back from endpoints.
- It takes a lot of time to destroy / reapply, just to fix urbanos bugs that
  have nothing to do w azure resources. Could be a "refresh urbanos" action,
  that helm uninstalls everything + manually deletes pvcs + secrets, then runs
  the terraform apply action again to create only the helm releases and reuse
  existing azure resources.
- Vault is not deployed to this environment, so the Andi "add secret" step
  will fail in configuring ingestions if attempted.
- The environment can be stood up 5 times a week.
  - This is because we're regenerating certs for ingresses upon environment
    start. Lets Encrypt allows for 5 generations per specific URL. See
    "cluster_issuer.yaml" for more information.
  - To start the environment more than 5 times a week, we'll need to implement
    a way to cache the generated certs, with a 90 day expiry. With that in place,
    you'd be able to stand up the environment as many times as you want.
  - Idea on how to accomplish this:
    - Create a managed identity for the cluster, and allow that identity to write
      to azure keyvault. Follow the following guides to auto generate the secrets
      into azure keyvault.
    - https://learn.microsoft.com/en-us/azure/aks/csi-secrets-store-nginx-tls#bind-certificate-to-ingress-controller
    - https://github.com/kubernetes/ingress-nginx/blob/main/charts/ingress-nginx/values.yaml#L513
    - https://learn.microsoft.com/en-us/azure/aks/csi-secrets-store-driver
    - https://learn.microsoft.com/en-us/azure/aks/use-managed-identity
    - https://learn.microsoft.com/en-us/azure/aks/csi-secrets-store-identity-access#code-try-7

### Using this repo to creating your own instance of UrbanOS

Create your own instance of UrbanOS, separate from the Demo instance that
the github workflow here creates.

#### Prerequisites:
- Complete Local Setup section
- Create an azure environment with billing, subscription, and resource groups already setup

#### Azure/Terraform Setup:
- Logged into azure cli with `az login --tenant={tenant_id}
  - Tenant ID was found in the Azure Active Directory while under the correct directory/subscription
- Create a contributor role for Terraform to use: `az ad sp create-for-rbac --role="Contributor" --scopes="/subscriptions/{subscription_id}"`
- Populated the env vars: JUNO_AZURE_SUB_ID, JUNO_DEMO_AZURE_APP_ID, JUNO_DEMO_AZURE_PASSWORD, JUNO_DEMO_AZURE_TENANT
- Change function "resourceGroupName" inside configuration.ts #TODO: Add this to .env
- Purchase a custom domain to create App Service domain and custom domain manually
- Add custom domain to env file

#### Setting up UrbanOS Values:
- Set "URBANOS_CHART_VERSION" in env file to latest at https://github.com/UrbanOS-Public/charts/tree/master/charts/urban-os
- Created a folder in env directory
- Copied urbanos_kafka_values.yaml and urbanos_values.yaml to the new env folder
- Adjusted values as needed. Mainly, Auth0 domain, ingress domain, and secrets. (Note: Most secrets aren't available yet until first deployment.) #TODO: Be more specific here
- Set "ENV" in .env to the name of the env folder that was created
- Set "AUTH0_USER_API_KEY", "JUNO_ANDI_AUTH0_CLIENT_SECRET", "JUNO_RAPTOR_AUTH0_CLIENT_SECRET" to "NA" for now. Will replace after first deployment once values are generated
- Run the deployment section once in order to generate some values needed for Auth0. This should successfully deploy the cluster and all pods. You can verify this through kubectl commands or preferably k9s.
- `kubectl get configmap auth0-config -o jsonpath='{.data.auth0\.config}' > auth0-config.json`
- Complete Auth0 Setup Part 2 from this README
- Added ClientID/Secret from Auth0 to values file in Juno
- Added ClientID/Secrets from Auth0 to env file in Juno
- Delete the DNSZone lock file manually in Azure
- `cdktf destroy`
- `cdktf apply`

#### First Time Using the Application:
- Signed up through discovery's Auth0 login (discovery.<dnsdomain>.com)
- Verified my email (You will see a poor user experience login loop before you verify email)
- Grants Curator role to my user via Auth0
    - "User Management" -> Select your user -> "Roles" -> "Assign Roles" -> "Curator"


#### Deployment:
- `npm i cdktf-cli@0.15.5 --global`
- `npm i`
- `npm run get`
- `cdktf apply` (will apply changes to the environment described in your .env file)


[Notes on using CDKTF are here](/notes/cdktf.md)
