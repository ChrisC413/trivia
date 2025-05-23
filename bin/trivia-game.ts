#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { TriviaGameStack } from '../lib/trivia-game-stack';

const app = new cdk.App();
new TriviaGameStack(app, 'TriviaGameStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
  },
}); 