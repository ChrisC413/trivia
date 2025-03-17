import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda-nodejs';
import * as apigatewayv2 from '@aws-cdk/aws-apigatewayv2-alpha';
import * as apigatewayv2_integrations from '@aws-cdk/aws-apigatewayv2-integrations-alpha';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import * as path from 'path';

export class TriviaGameStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create DynamoDB table
    const table = new dynamodb.Table(this, 'GameTable', {
      partitionKey: { name: 'roomId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'gameId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // For development only
      pointInTimeRecovery: true,
    });

    // Add GSI for game queries
    table.addGlobalSecondaryIndex({
      indexName: 'GameIndex',
      partitionKey: { name: 'gameId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'roomId', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // Create WebSocket API
    const webSocketApi = new apigatewayv2.WebSocketApi(this, 'TriviaWebSocketApi', {
      connectRouteOptions: { integration: new apigatewayv2_integrations.WebSocketLambdaIntegration('ConnectIntegration', createConnectLambda(this, table)) },
      disconnectRouteOptions: { integration: new apigatewayv2_integrations.WebSocketLambdaIntegration('DisconnectIntegration', createDisconnectLambda(this, table)) },
      defaultRouteOptions: { integration: new apigatewayv2_integrations.WebSocketLambdaIntegration('DefaultIntegration', createDefaultLambda(this, table)) },
    });

    // Add WebSocket routes
    webSocketApi.addRoute('createRoom', {
      integration: new apigatewayv2_integrations.WebSocketLambdaIntegration('CreateRoomIntegration', createCreateRoomLambda(this, table)),
    });

    webSocketApi.addRoute('joinRoom', {
      integration: new apigatewayv2_integrations.WebSocketLambdaIntegration('JoinRoomIntegration', createJoinRoomLambda(this, table)),
    });

    webSocketApi.addRoute('startGame', {
      integration: new apigatewayv2_integrations.WebSocketLambdaIntegration('StartGameIntegration', createStartGameLambda(this, table)),
    });

    webSocketApi.addRoute('submitAnswer', {
      integration: new apigatewayv2_integrations.WebSocketLambdaIntegration('SubmitAnswerIntegration', createSubmitAnswerLambda(this, table)),
    });

    webSocketApi.addRoute('submitThemeGuess', {
      integration: new apigatewayv2_integrations.WebSocketLambdaIntegration('SubmitThemeGuessIntegration', createSubmitThemeGuessLambda(this, table)),
    });

    webSocketApi.addRoute('nextQuestion', {
      integration: new apigatewayv2_integrations.WebSocketLambdaIntegration('NextQuestionIntegration', createNextQuestionLambda(this, table)),
    });

    // Create WebSocket Stage
    const stage = new apigatewayv2.WebSocketStage(this, 'TriviaWebSocketStage', {
      webSocketApi,
      stageName: 'prod',
      autoDeploy: true,
    });

    // Output the WebSocket URL
    new cdk.CfnOutput(this, 'WebSocketURL', {
      value: stage.url,
      description: 'WebSocket API URL',
    });
  }
}

// Helper function to create Lambda functions with common configuration
function createBaseLambda(stack: cdk.Stack, table: dynamodb.Table, handler: string): lambda.NodejsFunction {
  const fn = new lambda.NodejsFunction(stack, handler, {
    runtime: lambda.Runtime.NODEJS_18_X,
    handler: 'handler',
    entry: path.join(__dirname, `../handlers/${handler}.ts`),
    environment: {
      DYNAMODB_TABLE: table.tableName,
      WEBSOCKET_ENDPOINT: process.env.WEBSOCKET_ENDPOINT || '',
    },
  });

  // Grant DynamoDB permissions
  table.grantReadWriteData(fn);

  // Grant WebSocket API permissions
  fn.addToRolePolicy(new iam.PolicyStatement({
    effect: iam.Effect.ALLOW,
    actions: ['execute-api:ManageConnections'],
    resources: ['*'], // You might want to restrict this to your specific API
  }));

  return fn;
}

// Create individual Lambda functions
function createConnectLambda(stack: cdk.Stack, table: dynamodb.Table): lambda.NodejsFunction {
  return createBaseLambda(stack, table, 'connect');
}

function createDisconnectLambda(stack: cdk.Stack, table: dynamodb.Table): lambda.NodejsFunction {
  return createBaseLambda(stack, table, 'disconnect');
}

function createDefaultLambda(stack: cdk.Stack, table: dynamodb.Table): lambda.NodejsFunction {
  return createBaseLambda(stack, table, 'default');
}

function createCreateRoomLambda(stack: cdk.Stack, table: dynamodb.Table): lambda.NodejsFunction {
  return createBaseLambda(stack, table, 'createRoom');
}

function createJoinRoomLambda(stack: cdk.Stack, table: dynamodb.Table): lambda.NodejsFunction {
  return createBaseLambda(stack, table, 'joinRoom');
}

function createStartGameLambda(stack: cdk.Stack, table: dynamodb.Table): lambda.NodejsFunction {
  return createBaseLambda(stack, table, 'startGame');
}

function createSubmitAnswerLambda(stack: cdk.Stack, table: dynamodb.Table): lambda.NodejsFunction {
  return createBaseLambda(stack, table, 'submitAnswer');
}

function createSubmitThemeGuessLambda(stack: cdk.Stack, table: dynamodb.Table): lambda.NodejsFunction {
  return createBaseLambda(stack, table, 'submitThemeGuess');
}

function createNextQuestionLambda(stack: cdk.Stack, table: dynamodb.Table): lambda.NodejsFunction {
  return createBaseLambda(stack, table, 'nextQuestion');
} 