### CDKTF Notes

- If a provider is added to cdktf.json `npm run get` needs to be run
- `cdktf synth` will generate terraform at "cdktf.out/stacks/juno"
  - If cdktf commands aren't working and you'd like to use "terraform" commands
    instead, you can run terraform commands at that path.

### Adding new providers

(New providers should only be needed if you're using a new state backend, and
unless you're doing it in CI/CD, you might as well use local state. You'll need
new providers if you're deploying to a new cloud, which will require a good
amount of work from a network perspective. Lots of this is reliant on azure
specific ingress notations. UrbanOS installation will be very transferable
though.)

You can either use a tf provider, and have cdktf generate corresponding ".gen"
type bindings, or use a "prebuilt" cdk provider: https:www.npmjs.com/search?q=keywords%3Acdktf

When adding a new provider (`cdktf provider add "kubernetes@~> 2.18.0"`)
cdktf will attempt to find a prebuilt, at the desired version,
and will "gen" one manually if it's not available as a prebuilt on npm.

docs on prebuilts are very lacking.

- broken "api" link: https:github.com/cdktf/cdktf-provider-helm/blob/main/API.md
  its best to consult the underlying provider docs. ex: https:registry.terraform.io/providers/hashicorp/kubernetes/latest/docs

### Auth-Generated notes from CDKTF

========================================================================================================

Your cdktf typescript project is ready!

cat help Print this message

Compile:
npm run get Import/update Terraform providers and modules (you should check-in this directory)
npm run compile Compile typescript code to javascript (or "npm run watch")
npm run watch Watch for changes and compile typescript in the background
npm run build Compile typescript

Synthesize:
cdktf synth [stack] Synthesize Terraform resources from stacks to cdktf.out/ (ready for 'terraform apply')

Diff:
cdktf diff [stack] Perform a diff (terraform plan) for the given stack

Deploy:
cdktf deploy [stack] Deploy the given stack

Destroy:
cdktf destroy [stack] Destroy the stack

Test:
npm run test Runs unit tests (edit **tests**/main-test.ts to add your own tests)
npm run test:watch Watches the tests and reruns them on change

Upgrades:
npm run upgrade Upgrade cdktf modules to latest version
npm run upgrade:next Upgrade cdktf modules to latest "@next" version (last commit)

Use Providers:

You can add prebuilt providers (if available) or locally generated ones using the add command:

cdktf provider add "aws@~>3.0" null kreuzwerker/docker

You can find all prebuilt providers on npm: https://www.npmjs.com/search?q=keywords:cdktf
You can also install these providers directly through npm:

npm install @cdktf/provider-aws
npm install @cdktf/provider-google
npm install @cdktf/provider-azurerm
npm install @cdktf/provider-docker
npm install @cdktf/provider-github
npm install @cdktf/provider-null

You can also build any module or provider locally. Learn more https://cdk.tf/modules-and-providers

========================================================================================================
