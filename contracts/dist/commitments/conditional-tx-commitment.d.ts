import { ConditionalTransactionCommitmentJSON, MultisigOperation, ContractAddresses } from "@connext/types";
import { MultisigCommitment } from "./multisig-commitment";
export declare class ConditionalTransactionCommitment extends MultisigCommitment {
    readonly contractAddresses: ContractAddresses;
    readonly multisig: string;
    readonly multisigOwners: string[];
    readonly appIdentityHash: string;
    readonly freeBalanceAppIdentityHash: string;
    readonly interpreterAddr: string;
    readonly interpreterParams: string;
    constructor(contractAddresses: ContractAddresses, multisig: string, multisigOwners: string[], appIdentityHash: string, freeBalanceAppIdentityHash: string, interpreterAddr: string, interpreterParams: string, initiatorSignature?: string, responderSignature?: string);
    toJson(): ConditionalTransactionCommitmentJSON;
    static fromJson(json: ConditionalTransactionCommitmentJSON): ConditionalTransactionCommitment;
    getTransactionDetails(): {
        to: string;
        value: number;
        data: string;
        operation: MultisigOperation;
    };
}
//# sourceMappingURL=conditional-tx-commitment.d.ts.map