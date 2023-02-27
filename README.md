# Juno

Terraform scripts to deploy a complete instance of UrbanOS on demand in Azure!

The github workflow will create a "Demo" instance when triggered with a
secret passcode, making the instance available at urbanos-demo.com

[Deploy UrbanOS with Juno (Requires passcode)](https://github.com/UrbanOS-Public/juno/actions/workflows/deploy_urbanos.yml)

### Using this repo to creating your own instance of UrbanOS

Create your own instance of UrbanOS, separate from the Demo instance that
the github workflow here creates.

Instructions TODO, but running `cdktf apply` from root and editing `.env` should
be most of it.

[Notes on using CDKTF are here](/notes/cdktf.md)
