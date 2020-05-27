import { EthereumCommitment, MinimalTransaction, MultisigTransaction } from "@connext/types";
export declare abstract class MultisigCommitment implements EthereumCommitment {
    readonly multisigAddress: string;
    readonly multisigOwners: string[];
    private initiatorSignature?;
    private responderSignature?;
    constructor(multisigAddress: string, multisigOwners: string[], initiatorSignature?: string | undefined, responderSignature?: string | undefined);
    abstract getTransactionDetails(): MultisigTransaction;
    get signatures(): string[];
    addSignatures(signature1: string, signature2: string): Promise<void>;
    set signatures(sigs: string[]);
    getSignedTransaction(): Promise<MinimalTransaction>;
    encode(): string;
    hashToSign(): string;
    private assertSignatures;
}
//# sourceMappingURL=multisig-commitment.d.ts.map