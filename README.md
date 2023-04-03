# Juno

Terraform scripts to deploy a complete instance of UrbanOS on demand in Azure!

The github workflow will create a "Demo" instance at demo-urbanos.com

- [Deploy UrbanOS with Juno](https://github.com/UrbanOS-Public/juno/actions/workflows/deploy_urbanos.yml)
- [Teardown UrbanOS with Juno](https://github.com/UrbanOS-Public/juno/actions/workflows/teardown_urbanos.yml)

An empty DNSZone, App Service DNS name, and resource group, are the only
resources that exist ahead of this terraform creating resources. Alterations to
those references can be made in "configuration.ts"

## Debugging the cluster

- Should any issues with the demo, a teardown followed by a create
  operation should reset things to working state.
- To manually interact with the cluster, find "juno-cluster" in the aks service,
  and hit the "connect" button to be guided on getting terminal access from your
  machine.

## Notes

- This instance has it's own auth0 tenant "urbanos-demo". Contact
  "benjamin.mitchinson@accenture.com" to be added as a user or admin. A login
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
- Kafka might need to be set to a highrampool affinity, like the trino
  worker / coordinators are. Requires a chart update to allow affinity as a
  value of the "kafka" chart.
- Images are pinned at January 30th 2023. Upgrading to newer versions will
  require:
  - upgrading the urbanos chart version installed in helm.ts
  - altering urbanos_demo_chart_values to correspond with this new chart version
  - pinning each urbanos image in urbanos_demo_chart_values at a release tag
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

### Using this repo to creating your own instance of UrbanOS

Create your own instance of UrbanOS, separate from the Demo instance that
the github workflow here creates.

Instructions TODO, but running `cdktf apply` from root and editing `.env` should
be most of it. You'll need your own domain or resource group ahead of time for
this terraform to deploy into.

[Notes on using CDKTF are here](/notes/cdktf.md)
