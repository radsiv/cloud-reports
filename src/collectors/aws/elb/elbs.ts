import * as AWS from "aws-sdk";
import { AWSErrorHandler } from "../../../utils/aws";
import { BaseCollector } from "../../base";

export class ElbV2sCollector extends BaseCollector {
    public collect() {
        return this.getAllElbs();
    }

    private async getAllElbs() {

        const self = this;

        const serviceName = "ELBv2";
        const elbRegions = self.getRegions(serviceName);
        const elbs = {};

        for (const region of elbRegions) {
            try {
                const elb = self.getClient(serviceName, region) as AWS.ELBv2;
                elbs[region] = [];
                let fetchPending = true;
                let marker: string | undefined;
                while (fetchPending) {
                    const elbsResponse: AWS.ELBv2.DescribeLoadBalancersOutput
                        = await elb.describeLoadBalancers({ Marker: marker }).promise();
                    elbs[region] = elbs[region].concat(elbsResponse.LoadBalancers);
                    marker = elbsResponse.NextMarker;
                    fetchPending = marker !== undefined;
                }
            } catch (error) {
                AWSErrorHandler.handle(error);
                continue;
            }
        }
        return { elbs };
    }
}
