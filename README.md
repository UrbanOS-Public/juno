# Juno

Terraform scripts to deploy a complete instance of UrbanOS on demand in Azure!

The github workflow will create a "Demo" instance at demo-urbanos.com

- [Deploy UrbanOS with Juno](https://github.com/UrbanOS-Public/juno/actions/workflows/deploy_urbanos.yml)
- [Teardown UrbanOS with Juno](https://github.com/UrbanOS-Public/juno/actions/workflows/teardown_urbanos.yml)

## Debugging the cluster

- Should any issues with the demo, a 15 minute teardown and 20 minute create
  operation should reset things to working state.
- To manually interact with the cluster, find "juno-cluster" in the aks service,
  and hit the "connect" button to be guided on getting terminal access from your
  machine

## Notes

- All Azure resources are created with `juno-terraform` in the event they
  need to be manually removed from Azure.

### Using this repo to creating your own instance of UrbanOS

Create your own instance of UrbanOS, separate from the Demo instance that
the github workflow here creates.

Instructions TODO, but running `cdktf apply` from root and editing `.env` should
be most of it.

[Notes on using CDKTF are here](/notes/cdktf.md)
