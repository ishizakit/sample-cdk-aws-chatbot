import { Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import * as sns from "aws-cdk-lib/aws-sns";
import * as chatbot from "aws-cdk-lib/aws-chatbot";
import * as events from "aws-cdk-lib/aws-events";
import * as targets from "aws-cdk-lib/aws-events-targets";

export class SampleCdkAwsChatbotStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // SNSのTopicの作成
    const topic = new sns.Topic(this, "sns-topic", {
      topicName: "batch-status-changed",
    });

    // ChatbotのSlack設定
    new chatbot.SlackChannelConfiguration(this, "chatbot", {
      slackChannelConfigurationName: "batch-status-changed",
      slackWorkspaceId: process.env.SLACK_WORKSPACE_ID || "",
      slackChannelId: process.env.SLACK_CHANNEL_ID || "",
      notificationTopics: [topic],
    });

    // イベントの作成
    new events.Rule(this, "events-rule", {
      ruleName: "batch-status-changed-to-sns",
      targets: [new targets.SnsTopic(topic)],
      // AWSコンソール > Amazon EventBridge > ルール作成でぼちぼちして適切なイベントパターンを探すといい
      eventPattern: {
        source: ["aws.batch"],
        detailType: ["Batch Job State Change"],
        detail: {
          status: ["RUNNING", "SUCCEEDED", "FAILED"],
        },
      },
    });
  }
}
