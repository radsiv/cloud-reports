import * as AWS from "aws-sdk";
import { AWSErrorHandler } from "../../../utils/aws";
import { BaseCollector } from "../../base";

export class FlowLogsCollector extends BaseCollector {
    public collect() {
        return this.getAllFlowLogs();
    }

    private async getAllFlowLogs() {

        const self = this;

        const serviceName = "EC2";
        const ec2Regions = self.getRegions(serviceName);
        const flow_logs = {};

        for (const region of ec2Regions) {
            try {
                const ec2 = self.getClient(serviceName, region) as AWS.EC2;
                flow_logs[region] = [];
                let fetchPending = true;
                let marker: string | undefined;
                while (fetchPending) {
                    const flowLogsResponse:
                        AWS.EC2.DescribeFlowLogsResult = await ec2.describeFlowLogs({ NextToken: marker }).promise();
                    if (flowLogsResponse && flowLogsResponse.FlowLogs) {
                        flow_logs[region] = flow_logs[region].concat(flowLogsResponse.FlowLogs);
                        marker = flowLogsResponse.NextToken;
                        fetchPending = marker !== undefined;
                    } else {
                        fetchPending = false;
                    }
                }
            } catch (error) {
                AWSErrorHandler.handle(error);
                continue;
            }
        }
        return { flow_logs };
    }
}
