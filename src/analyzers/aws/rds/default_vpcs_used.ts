import {
    CheckAnalysisType, ICheckAnalysisResult, IDictionary,
    IResourceAnalysisResult, SeverityStatus,
} from "../../../types";
import { BaseAnalyzer } from "../../base";

export class DefaultVpcUsedRDSInstancesAnalyzer extends BaseAnalyzer {
    public  checks_what : string =  "Are there any default vpc used for RDS instances?";
    public  checks_why : string = "Default vpcs are open to world by default and requires extra setup make them secure";
    public checks_recommendation: string = `Recommended not to use default vpc instead create a
        custom one as they make you better understand the security posture`;
    public checks_name : string = "DBInstance";
    public analyze(params: any, fullReport?: any): any {
        const allInstances = params.instances;
        if (!fullReport["aws.vpc"] || !fullReport["aws.vpc"].vpcs || !allInstances) {
            return undefined;
        }
        const allVpcs = fullReport["aws.vpc"].vpcs;
        const default_vpcs_used: ICheckAnalysisResult = { type: CheckAnalysisType.Security };
        default_vpcs_used.what = this.checks_what;
        default_vpcs_used.why = this.checks_why;
        default_vpcs_used.recommendation = this.checks_recommendation;
        const allRegionsAnalysis: IDictionary<IResourceAnalysisResult[]> = {};
        for (const region in allInstances) {
            const regionInstances = allInstances[region];
            const regionVpcs = allVpcs[region];
            const defaultVpcs = this.getDefaultVpcs(regionVpcs);
            allRegionsAnalysis[region] = [];
            for (const instance of regionInstances) {
                const instanceAnalysis: IResourceAnalysisResult = {};
                if (!instance.DBSubnetGroup) {
                    continue;
                }
                instanceAnalysis.resource = {
                    instanceName: instance.DBInstanceIdentifier,
                    vpcId: instance.DBSubnetGroup.VpcId,
                };
                instanceAnalysis.resourceSummary = {
                    name: this.checks_name,
                    value: instance.DBInstanceIdentifier,
                };
                if (this.isVpcExist(defaultVpcs, instance.DBSubnetGroup.VpcId)) {
                    instanceAnalysis.severity = SeverityStatus.Failure;
                    instanceAnalysis.message = "Default VPC is used";
                    instanceAnalysis.action = "Use custom VPC instead of default VPC";
                } else {
                    instanceAnalysis.severity = SeverityStatus.Good;
                    instanceAnalysis.message = "Default VPC is not used";
                }
                allRegionsAnalysis[region].push(instanceAnalysis);
            }
        }
        default_vpcs_used.regions = allRegionsAnalysis;
        return { default_vpcs_used };
    }

    private getDefaultVpcs(vpcs: any[]) {
        if (!vpcs) {
            return [];
        }
        return vpcs.filter((vpc) => {
            return vpc.IsDefault;
        });
    }

    private isVpcExist(vpcs, vpcId) {
        if (!vpcs || !vpcId) {
            return false;
        }
        return vpcs.filter((vpc) => {
            return vpc.VpcId === vpcId;
        }).length > 0;
    }
}
