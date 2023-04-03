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

- This instance has it's own tenant "urbanos-demo". Contact
  "benjamin.mitchinson@accenture.com" to be added as a user or admin.

## Billing

- All Azure resources are created with `juno-terraform` in the event they
  need to be manually removed from Azure / identified for billing.
-

## Future upgrades

- UrbanOS charts aren't pinned to an image release of apps in smartcitiesdata
  repo. Upgrading to latest (past the Jan30th version freeze implemented here),
  will require
  - upgrading the chart version installed in helm.ts
  - altering chart values to correspond with this new chart version
  - pinning images at a release tag (or preferably, pinning those in the charts
    repo itself)
  - PS. I noticed andi now has API protection, so "initialize_andi.sh" might
    need to be upgraded to include support for providing an auth0 user secret

### Using this repo to creating your own instance of UrbanOS

Create your own instance of UrbanOS, separate from the Demo instance that
the github workflow here creates.

Instructions TODO, but running `cdktf apply` from root and editing `.env` should
be most of it.

[Notes on using CDKTF are here](/notes/cdktf.md)
