#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { SampleCdkAwsChatbotStack } from "../lib/sample-cdk-aws-chatbot-stack";
import { SampleCdkApiDestinationStack } from "../lib/sample-cdk-api-destination-stack";

const app = new cdk.App();
new SampleCdkAwsChatbotStack(app, "SampleCdkAwsChatbotStack", {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});

new SampleCdkApiDestinationStack(app, "SampleCdkApiDestinationStack", {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});
