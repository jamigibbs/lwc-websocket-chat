# LWC Websocket Chat

This repo contains an example of a Salesforce Lightning Web Component Chat using websockets. This is a simple experimental project that was built out of my own curiosity and is not meant to be used in production. Please visit the related blog post [Websocket Chat in Salesforce with Lightning Web Components](https://blog.jamigibbs.com/websockets-in-salesforce-with-lightning-web-components/) for more information.

# Getting Started

If you haven't done so already, make sure you've setup SFDX and enabled a Dev Hub: https://trailhead.salesforce.com/en/content/learn/modules/sfdx_app_dev/sfdx_app_dev_setup_dx

## 1. Create a Scratch Org & Push Metadata

To do this, you can either run the provided script in terminal:

`scripts/create-scratch.sh`

Or, run each of these sfdx commands individually:

```
sfdx force:org:create -s -a name_of_scratch -f config/project-scratch-def.json

sfdx force:source:push -u name_of_scratch

sfdx force:data:tree:import -u name_of_scratch -p data/org-data-plan.json

sfdx force:user:create -u name_of_scratch --setalias chat-user

sfdx force:org:open -u name_of_scratch
```

## 2. Deploy your node server to Heroku

Create a node websocket server by clicking the "Deploy to Heroku" button on the [sf-chat-websocket-server](https://github.com/jamigibbs/sf-chat-websocket-server) repo.

## 3. Update the websocket server url

Add your web socket url that was created by Heroku to:
  - `labels/CustomLabels.labels-meta.xml`
  - `cspTrustedSites/HTTP_Websocket_Server.cspTrustedSite-meta.xml`
  - `WSS_Websocket_Server.cspTrustedSite-meta.xml`

Deploy those changes to the scratch org:

`sfdx force:source:deploy -x manifest/websocket_chat/package.xml`

## 2. Add the LWC Websocket Chat component to a page 

The last step is to add the component to a page from the App Builder or in a community from the Experience Builder.

# Additional Exercises

Interested in seeing what else you can do with this project? Here are a few ideas:

- Handle multiple chat rooms.
- Add chat notifications to the user's notification bell.
- Display a person's name to other users when they're typing.