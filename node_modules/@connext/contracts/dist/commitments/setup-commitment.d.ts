import { AppIdentity, MultisigTransaction, ContractAddresses } from "@connext/types";
import { MultisigCommitment } from "./multisig-commitment";
export declare class SetupCommitment extends MultisigCommitment {
    readonly contractAddresses: ContractAddresses;
    readonly multisigAddress: string;
    readonly multisigOwners: string[];
    readonly freeBalanceAppIdentity: AppIdentity;
    constructor(contractAddresses: ContractAddresses, multisigAddress: string, multisigOwners: string[], freeBalanceAppIdentity: AppIdentity);
    getTransactionDetails(): MultisigTransaction;
}
//# sourceMappingURL=setup-commitment.d.ts.map