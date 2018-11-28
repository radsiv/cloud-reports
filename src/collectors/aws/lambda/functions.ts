import * as AWS from "aws-sdk";
import { AWSErrorHandler } from "../../../utils/aws";
import { BaseCollector } from "../../base";

export class LambdaFunctionsCollector extends BaseCollector {
    public collect() {
        return this.getAllFunctions();
    }

    private async getAllFunctions() {

        const self = this;

        const serviceName = "Lambda";
        const lambdaRegions = self.getRegions(serviceName);
        const functions = {};

        for (const region of lambdaRegions) {
            try {
                const lambda = self.getClient(serviceName, region) as AWS.Lambda;
                functions[region] = [];
                let fetchPending = true;
                let marker: string | undefined;
                while (fetchPending) {
                    const functionsResponse: AWS.Lambda.ListFunctionsResponse =
                        await lambda.listFunctions({ Marker: marker }).promise();
                    functions[region] = functions[region].concat(functionsResponse.Functions);
                    marker = functionsResponse.NextMarker;
                    fetchPending = marker !== undefined && marker !== null;
                }
            } catch (error) {
                AWSErrorHandler.handle(error);
                continue;
            }
        }
        return { functions };
    }
}
