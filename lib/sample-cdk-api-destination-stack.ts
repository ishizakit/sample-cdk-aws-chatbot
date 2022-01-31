import { Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import * as iam from "aws-cdk-lib/aws-iam";
import * as events from "aws-cdk-lib/aws-events";

export class SampleCdkApiDestinationStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // イベントがAPIを叩くためのロールを作成
    const eventRole = new iam.Role(this, "role", {
      roleName: "eventsInvokeApiRole",
      assumedBy: new iam.ServicePrincipal("events.amazonaws.com"),
    });
    eventRole.addToPolicy(
      new iam.PolicyStatement({
        resources: ["*"],
        actions: ["events:InvokeApiDestination"],
      })
    );

    // API接続先を作成
    // 認証方式なしができないので適当なAPIKeyを設定する
    const connection = new events.CfnConnection(this, "events-connection", {
      name: "no-auth",
      authorizationType: "API_KEY",
      authParameters: {
        // アッパーキャメルケースじゃないとエラーになる
        ApiKeyAuthParameters: {
          ApiKeyName: "Authorization",
          ApiKeyValue: "hoge",
        },
      },
    });

    // API送信先を作成
    const destination = new events.CfnApiDestination(
      this,
      "events-destination",
      {
        name: "slack-webhook-destination",
        connectionArn: connection.attrArn,
        httpMethod: "POST",
        invocationEndpoint: process.env.SLACK_WEBHOOK_URL || "",
      }
    );

    // イベントの設定
    new events.CfnRule(this, "events-rule", {
      name: "batch-status-changed-to-slack",
      targets: [
        {
          id: "slack-destination",
          arn: destination.attrArn,
          roleArn: eventRole.roleArn,
          inputTransformer: {
            inputPathsMap: {
              name: "$.detail.jobName",
              status: "$.detail.status",
            },
            inputTemplate: `
            {
              "channel": "${process.env.SLACK_CHANNEL_NAME}",
              "username": "${process.env.SLACK_BOT_NAME}",
              "icon_url": "${process.env.SLACK_BOT_ICON}",
              "attachments": [
                {
                  "fallback": "<name>のステータスが変わりました",
                  "pretext": "<name>のステータスが変わりました",
                  "color": "#00DD00",
                  "fields": [
                    {
                      "title": "ジョブ名 : <name>",
                      "value": "ステータス : <status>"
                    }
                  ]
                }
              ]
            }`,
          },
        },
      ],
      eventPattern: {
        // ケバブケースじゃないと動かない
        source: ["aws.batch"],
        "detail-type": ["Batch Job State Change"],
        detail: {
          status: ["RUNNING", "SUCCEEDED", "FAILED"],
        },
      },
    });
  }
}
